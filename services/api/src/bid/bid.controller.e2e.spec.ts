import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppModule } from '../app.module';
import { User } from '../entities/user.entity';
import { Tender } from '../tender/tender.entity';
import { Bid, BidStatus } from './bid.entity';
import { AuditLog } from '../audit/audit.entity';
import { Role } from '../auth.stub';
import * as jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

/**
 * e2e tests for Bid module.
 * Tests full request/response cycle with authentication and authorization.
 *
 * Note: These tests require a test database. For local dev, run against
 * a separate postgres container or use an in-memory solution.
 */

describe('BidController (e2e)', () => {
  let app: INestApplication;
  let supplierToken: string;
  let pmuToken: string;
  let tenderId: string;
  let supplierId: string;
  let pmuId: string;

  beforeAll(async () => {
    // Configure test module (minimal setup for e2e)
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          username: process.env.DB_USER || 'zets',
          password: process.env.DB_PASSWORD || 'zets_dev_password',
          database: process.env.DB_NAME || 'zets_test',
          entities: [User, Tender, Bid, AuditLog],
          synchronize: true,
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Seed test data
    const userRepo = moduleFixture.get('UserRepository');
    const tenderRepo = moduleFixture.get('TenderRepository');

    const password = 'TestPassword123!';
    const hash = await bcrypt.hash(password, 10);

    // Create supplier user
    const supplier = await userRepo.save({
      email: 'supplier@test.local',
      passwordHash: hash,
      role: Role.Supplier,
      displayName: 'Test Supplier',
    });
    supplierId = supplier.id;

    // Create PMU user
    const pmu = await userRepo.save({
      email: 'pmu@test.local',
      passwordHash: hash,
      role: Role.PMU_Officer,
      displayName: 'PMU Officer',
    });
    pmuId = pmu.id;

    // Generate JWT tokens
    const jwtSecret = process.env.JWT_SECRET || 'dev-jwt-secret';
    supplierToken = jwt.sign({ sub: supplierId, role: Role.Supplier }, jwtSecret, {
      expiresIn: '24h',
    });
    pmuToken = jwt.sign({ sub: pmuId, role: Role.PMU_Officer }, jwtSecret, {
      expiresIn: '24h',
    });

    // Create test tender (future deadline)
    const tender = await tenderRepo.save({
      title: 'Test Tender',
      description: 'For e2e testing',
      tenderType: 'Goods',
      procuringEntity: 'Test Ministry',
      budget: 100000,
      currency: 'ZWL',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'Published',
      publishedBy: pmuId,
    });
    tenderId = tender.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /bids (create draft)', () => {
    it('should create a draft bid as supplier', async () => {
      const response = await request(app.getHttpServer())
        .post('/bids')
        .set('Authorization', `Bearer ${supplierToken}`)
        .send({
          tenderId,
          amount: 95000,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe(BidStatus.Draft);
      expect(response.body.supplierId).toBe(supplierId);
    });

    it('should reject create bid without authentication', async () => {
      await request(app.getHttpServer())
        .post('/bids')
        .send({
          tenderId,
          amount: 95000,
        })
        .expect(401);
    });

    it('should reject create bid with wrong role (PMU)', async () => {
      await request(app.getHttpServer())
        .post('/bids')
        .set('Authorization', `Bearer ${pmuToken}`)
        .send({
          tenderId,
          amount: 95000,
        })
        .expect(403);
    });

    it('should reject create bid with missing tenderId', async () => {
      await request(app.getHttpServer())
        .post('/bids')
        .set('Authorization', `Bearer ${supplierToken}`)
        .send({
          amount: 95000,
        })
        .expect(400);
    });
  });

  describe('POST /bids/:id/seal (seal bid with COI)', () => {
    let bidId: string;

    beforeAll(async () => {
      // Create a draft bid first
      const response = await request(app.getHttpServer())
        .post('/bids')
        .set('Authorization', `Bearer ${supplierToken}`)
        .send({
          tenderId,
          amount: 92000,
        })
        .expect(201);

      bidId = response.body.id;
    });

    it('should seal a bid with valid COI declaration', async () => {
      const coiDeclaration = {
        company: 'Test Supplier Ltd',
        conflicts: 'None known',
        affiliations: ['Local Chamber of Commerce'],
      };

      const response = await request(app.getHttpServer())
        .post(`/bids/${bidId}/seal`)
        .set('Authorization', `Bearer ${supplierToken}`)
        .send({ coiDeclaration })
        .expect(200);

      expect(response.body.status).toBe(BidStatus.Sealed);
      expect(response.body.coiDeclaration).toEqual(coiDeclaration);
      expect(response.body.sealedAt).toBeDefined();
    });

    it('should reject seal without COI declaration', async () => {
      // Create another draft bid for this test
      const response = await request(app.getHttpServer())
        .post('/bids')
        .set('Authorization', `Bearer ${supplierToken}`)
        .send({
          tenderId,
          amount: 91000,
        })
        .expect(201);

      const newBidId = response.body.id;

      await request(app.getHttpServer())
        .post(`/bids/${newBidId}/seal`)
        .set('Authorization', `Bearer ${supplierToken}`)
        .send({})
        .expect(403);
    });

    it('should prevent sealing another supplier\'s bid', async () => {
      // Create another supplier and try to seal first supplier's bid
      const userRepo = app.get('UserRepository');
      const password = 'TestPassword123!';
      const hash = await bcrypt.hash(password, 10);

      const otherSupplier = await userRepo.save({
        email: 'other-supplier@test.local',
        passwordHash: hash,
        role: Role.Supplier,
      });

      const jwtSecret = process.env.JWT_SECRET || 'dev-jwt-secret';
      const otherToken = jwt.sign({ sub: otherSupplier.id, role: Role.Supplier }, jwtSecret);

      await request(app.getHttpServer())
        .post(`/bids/${bidId}/seal`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          coiDeclaration: { company: 'Other Ltd' },
        })
        .expect(403);
    });
  });

  describe('GET /bids/my-bids (supplier own bids)', () => {
    it('should return supplier\'s own bids', async () => {
      const response = await request(app.getHttpServer())
        .get('/bids/my-bids')
        .set('Authorization', `Bearer ${supplierToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      response.body.forEach((bid: any) => {
        expect(bid.supplierId).toBe(supplierId);
      });
    });

    it('should reject non-suppliers from viewing all bids', async () => {
      await request(app.getHttpServer())
        .get('/bids/my-bids')
        .set('Authorization', `Bearer ${pmuToken}`)
        .expect(403);
    });
  });

  describe('GET /bids/:id (get specific bid with access control)', () => {
    let bidId: string;

    beforeAll(async () => {
      // Create a sealed bid
      const response = await request(app.getHttpServer())
        .post('/bids')
        .set('Authorization', `Bearer ${supplierToken}`)
        .send({
          tenderId,
          amount: 88000,
        })
        .expect(201);

      bidId = response.body.id;

      // Seal it
      await request(app.getHttpServer())
        .post(`/bids/${bidId}/seal`)
        .set('Authorization', `Bearer ${supplierToken}`)
        .send({
          coiDeclaration: { company: 'Test Supplier Ltd' },
        })
        .expect(200);
    });

    it('should allow supplier to view own sealed bid', async () => {
      const response = await request(app.getHttpServer())
        .get(`/bids/${bidId}`)
        .set('Authorization', `Bearer ${supplierToken}`)
        .expect(200);

      expect(response.body.id).toBe(bidId);
      expect(response.body.status).toBe(BidStatus.Sealed);
    });

    it('should reject PMU viewing sealed bid before deadline', async () => {
      await request(app.getHttpServer())
        .get(`/bids/${bidId}`)
        .set('Authorization', `Bearer ${pmuToken}`)
        .expect(403);
    });

    // Time-lock test would require manipulating system time or using a past-deadline tender
    // Deferred to integration tests with time mocking
  });
});
