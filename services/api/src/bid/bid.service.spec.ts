import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BidService } from './bid.service';
import { Bid, BidStatus } from './bid.entity';
import { Tender } from '../tender/tender.entity';
import { AuditLog } from '../audit/audit.entity';
import { Role } from '../auth.stub';
import { encrypt, decrypt } from '../crypto/encryption';
import { computeChainHash } from '../crypto/hash-chain';

describe('BidService', () => {
  let service: BidService;
  let mockBidRepo: any;
  let mockTenderRepo: any;
  let mockAuditRepo: any;

  beforeEach(async () => {
    mockBidRepo = {
      create: jest.fn((data) => ({ ...data, id: 'bid-123' })),
      save: jest.fn((data) => Promise.resolve({ ...data, id: 'bid-123', createdAt: new Date() })),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    mockTenderRepo = {
      findOne: jest.fn(),
    };

    mockAuditRepo = {
      save: jest.fn((data) => Promise.resolve(data)),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BidService,
        { provide: getRepositoryToken(Bid), useValue: mockBidRepo },
        { provide: getRepositoryToken(Tender), useValue: mockTenderRepo },
        { provide: getRepositoryToken(AuditLog), useValue: mockAuditRepo },
      ],
    }).compile();

    service = module.get<BidService>(BidService);
  });

  describe('Encryption/Decryption', () => {
    it('should encrypt and decrypt amount correctly', () => {
      const secret = 'test-secret-key-12345';
      const originalAmount = '45000';
      const encrypted = encrypt(originalAmount, secret);
      const decrypted = decrypt(encrypted, secret);
      expect(decrypted).toBe(originalAmount);
    });

    it('should produce different ciphertexts for same plaintext (IV randomization)', () => {
      const secret = 'test-secret-key-12345';
      const amount = '50000';
      const enc1 = encrypt(amount, secret);
      const enc2 = encrypt(amount, secret);
      expect(enc1).not.toBe(enc2); // Different IVs
      expect(decrypt(enc1, secret)).toBe(amount);
      expect(decrypt(enc2, secret)).toBe(amount);
    });
  });

  describe('Hash Chain', () => {
    it('should compute consistent hash chains', () => {
      const payload1 = 'BID_CREATE:bid-123:supplier-1';
      const payload2 = 'BID_SEAL:bid-123:supplier-1:{...}';

      const hash1 = computeChainHash('', payload1);
      const hash2 = computeChainHash(hash1, payload2);

      // Re-compute to verify consistency
      const hash1_again = computeChainHash('', payload1);
      const hash2_again = computeChainHash(hash1_again, payload2);

      expect(hash1).toBe(hash1_again);
      expect(hash2).toBe(hash2_again);
    });

    it('should detect hash chain tampering', () => {
      const payload1 = 'BID_CREATE:bid-123:supplier-1';
      const payload2 = 'BID_SEAL:bid-123:supplier-1:{...}';
      const tamperedPayload2 = 'BID_SEAL:bid-123:supplier-1:{tampered}';

      const hash1 = computeChainHash('', payload1);
      const hash2 = computeChainHash(hash1, payload2);
      const tamperedHash2 = computeChainHash(hash1, tamperedPayload2);

      expect(hash2).not.toBe(tamperedHash2);
    });
  });

  describe('createDraft', () => {
    it('should create a draft bid with encrypted amount', async () => {
      const tender = { id: 'tender-1', deadline: new Date(Date.now() + 24 * 60 * 60 * 1000) };
      mockTenderRepo.findOne.mockResolvedValue(tender);

      const result = await service.createDraft('tender-1', 'supplier-1', 45000);

      expect(mockBidRepo.create).toHaveBeenCalled();
      expect(mockBidRepo.save).toHaveBeenCalled();
      expect(result.status).toBe(BidStatus.Draft);
      expect(result.encryptedAmount).toBeDefined();
      expect(mockAuditRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent tender', async () => {
      mockTenderRepo.findOne.mockResolvedValue(null);

      await expect(service.createDraft('tender-missing', 'supplier-1', 45000)).rejects.toThrow(
        'Tender not found',
      );
    });
  });

  describe('sealBid', () => {
    it('should seal a bid and require COI declaration', async () => {
      const bid = {
        id: 'bid-1',
        status: BidStatus.Draft,
        supplierId: 'supplier-1',
        tenderId: 'tender-1',
      };
      const tender = { id: 'tender-1', deadline: new Date(Date.now() + 24 * 60 * 60 * 1000) };

      mockBidRepo.findOne.mockResolvedValue(bid);
      mockTenderRepo.findOne.mockResolvedValue(tender);

      const coiDeclaration = { company: 'ABC Ltd', conflicts: 'None' };
      const result = await service.sealBid('bid-1', 'supplier-1', coiDeclaration);

      expect(result.status).toBe(BidStatus.Sealed);
      expect(result.coiDeclaration).toEqual(coiDeclaration);
      expect(result.sealedAt).toBeDefined();
      expect(mockAuditRepo.save).toHaveBeenCalled();
    });

    it('should reject sealing after tender deadline', async () => {
      const bid = {
        id: 'bid-1',
        status: BidStatus.Draft,
        supplierId: 'supplier-1',
        tenderId: 'tender-1',
      };
      const tender = { id: 'tender-1', deadline: new Date(Date.now() - 1000) }; // Past deadline

      mockBidRepo.findOne.mockResolvedValue(bid);
      mockTenderRepo.findOne.mockResolvedValue(tender);

      await expect(
        service.sealBid('bid-1', 'supplier-1', { company: 'ABC' }),
      ).rejects.toThrow('Cannot seal bid after tender deadline');
    });

    it('should require COI declaration', async () => {
      const bid = {
        id: 'bid-1',
        status: BidStatus.Draft,
        supplierId: 'supplier-1',
        tenderId: 'tender-1',
      };
      const tender = { id: 'tender-1', deadline: new Date(Date.now() + 24 * 60 * 60 * 1000) };

      mockBidRepo.findOne.mockResolvedValue(bid);
      mockTenderRepo.findOne.mockResolvedValue(tender);

      await expect(service.sealBid('bid-1', 'supplier-1', null)).rejects.toThrow(
        'Valid COI declaration required',
      );
    });
  });

  describe('Role-based Access Control', () => {
    it('should prevent supplier from viewing another supplier\'s bid', async () => {
      const bid = { id: 'bid-1', status: BidStatus.Draft, supplierId: 'supplier-2' };
      mockBidRepo.findOne.mockResolvedValue(bid);

      await expect(
        service.getBidForViewing('bid-1', 'supplier-1', Role.Supplier),
      ).rejects.toThrow('Can only view own bid');
    });

    it('should prevent PMU from viewing sealed bid before deadline', async () => {
      const bid = { id: 'bid-1', status: BidStatus.Sealed, supplierId: 'supplier-1' };
      const tender = { id: 'tender-1', deadline: new Date(Date.now() + 24 * 60 * 60 * 1000) };

      mockBidRepo.findOne.mockResolvedValue(bid);
      mockTenderRepo.findOne.mockResolvedValue(tender);

      await expect(
        service.getBidForViewing('bid-1', 'pmu-1', Role.PMU_Officer),
      ).rejects.toThrow('Can only view sealed bids after tender deadline');
    });

    it('should allow PMU to view sealed bid after deadline', async () => {
      const bid = { id: 'bid-1', status: BidStatus.Sealed, supplierId: 'supplier-1' };
      const tender = { id: 'tender-1', deadline: new Date(Date.now() - 1000) }; // Past deadline

      mockBidRepo.findOne.mockResolvedValue(bid);
      mockTenderRepo.findOne.mockResolvedValue(tender);

      const result = await service.getBidForViewing('bid-1', 'pmu-1', Role.PMU_Officer);

      expect(result.id).toBe('bid-1');
      expect(mockAuditRepo.save).toHaveBeenCalled(); // View attempt logged
    });

    it('should deny Public_Observer access to bid details', async () => {
      const bid = { id: 'bid-1', status: BidStatus.Sealed, supplierId: 'supplier-1' };
      mockBidRepo.findOne.mockResolvedValue(bid);

      await expect(
        service.getBidForViewing('bid-1', 'observer-1', Role.Public_Observer),
      ).rejects.toThrow('Public observers cannot view bid details');
    });
  });
});
