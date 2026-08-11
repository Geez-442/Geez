import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ZetaService } from './zeta.service';
import { ZetaInteraction } from './zeta.entity';
import { AuditLog } from '../audit/audit.entity';
import { Role } from '../auth.stub';

describe('ZetaService', () => {
  let service: ZetaService;
  let mockInteractionRepo: any;
  let mockAuditRepo: any;

  beforeEach(async () => {
    mockInteractionRepo = {
      save: jest.fn((data) => Promise.resolve({ ...data, id: 'interaction-1' })),
    };
    mockAuditRepo = {
      save: jest.fn((data) => Promise.resolve(data)),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      })),
      find: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ZetaService,
        { provide: getRepositoryToken(ZetaInteraction), useValue: mockInteractionRepo },
        { provide: getRepositoryToken(AuditLog), useValue: mockAuditRepo },
      ],
    }).compile();

    service = module.get<ZetaService>(ZetaService);
  });

  it('should return a grounded answer for a supplier eligibility question', async () => {
    const result = await service.ask({ role: Role.Supplier, actorId: 'supplier-1', query: 'How do I check eligibility?' });

    expect(result.insufficientData).toBe(false);
    expect(result.matchedEntryIds.length).toBeGreaterThan(0);
    expect(result.answer.toLowerCase()).toContain('eligibility');
    expect(result.advisory).toBe(true);
  });

  it('should return INSUFFICIENT_DATA for an unrelated query', async () => {
    const result = await service.ask({ role: Role.Supplier, actorId: 'supplier-1', query: 'What is the weather today?' });

    expect(result.insufficientData).toBe(true);
    expect(result.answer.toUpperCase()).toContain('INSUFFICIENT DATA');
  });

  it('should reject invalid role', async () => {
    await expect(service.ask({ role: 'Hacker' as Role, actorId: 'x', query: 'Can I see sealed bids?' })).rejects.toThrow('Invalid role');
  });

  it('should allow PMU to request audit summary', async () => {
    const result = await service.auditSummary('pmu-1', Role.PMU_Officer);
    expect(result.advisory).toBe(true);
    expect(result.summary.totalEvents).toBe(0);
  });

  it('should deny audit summary to suppliers', async () => {
    await expect(service.auditSummary('supplier-1', Role.Supplier)).rejects.toThrow('Only PRAZ/PMU can request audit summaries');
  });

  it('should persist every interaction', async () => {
    await service.ask({ role: Role.Supplier, actorId: 'supplier-1', query: 'register' });
    expect(mockInteractionRepo.save).toHaveBeenCalled();
    expect(mockAuditRepo.save).toHaveBeenCalled();
  });
});
