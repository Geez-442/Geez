import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnomalyService } from './anomaly.service';
import { AnomalyFlag } from './anomaly-flag.entity';
import { AuditLog } from '../audit/audit.entity';
import { generateSyntheticAuditEvents } from './synthetic-audit-generator';

describe('AnomalyService', () => {
  let service: AnomalyService;
  let mockAuditRepo: any;
  let mockFlagRepo: any;

  beforeEach(async () => {
    mockFlagRepo = {
      create: jest.fn((data) => ({ ...data, id: 'flag-123' })),
      save: jest.fn((data) => Promise.resolve(Array.isArray(data) ? data : [data])),
    };

    mockAuditRepo = {
      find: jest.fn(),
      save: jest.fn((data) => Promise.resolve(data)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnomalyService,
        { provide: getRepositoryToken(AuditLog), useValue: mockAuditRepo },
        { provide: getRepositoryToken(AnomalyFlag), useValue: mockFlagRepo },
      ],
    }).compile();

    service = module.get<AnomalyService>(AnomalyService);
  });

  it('should flag repeated bid creations', async () => {
    mockAuditRepo.find.mockResolvedValue(generateSyntheticAuditEvents({ includeAnomalies: true }));
    const result = await service.scan('praz-1', 'PRAZ_Regulator', 72);

    const repeated = result.flags.find((f) => f.type === 'REPEATED_BID_CREATIONS');
    expect(repeated).toBeDefined();
  });

  it('should flag off-hours official access', async () => {
    mockAuditRepo.find.mockResolvedValue(generateSyntheticAuditEvents({ includeAnomalies: true }));
    const result = await service.scan('praz-1', 'PRAZ_Regulator', 72);

    const offHours = result.flags.find((f) => f.type === 'OFF_HOURS_OFFICIAL_ACCESS');
    expect(offHours).toBeDefined();
  });

  it('should flag single-bidder awards', async () => {
    mockAuditRepo.find.mockResolvedValue(generateSyntheticAuditEvents({ includeAnomalies: true }));
    const result = await service.scan('praz-1', 'PRAZ_Regulator', 72);

    const single = result.flags.find((f) => f.type === 'SINGLE_BIDDER_AWARD');
    expect(single).toBeDefined();
  });

  it('should flag rapid bid sealing', async () => {
    mockAuditRepo.find.mockResolvedValue(generateSyntheticAuditEvents({ includeAnomalies: true }));
    const result = await service.scan('praz-1', 'PRAZ_Regulator', 72);

    const rapid = result.flags.find((f) => f.type === 'RAPID_BID_SEALING');
    expect(rapid).toBeDefined();
  });

  it('should produce no flags for clean data', async () => {
    const clean = generateSyntheticAuditEvents({ includeAnomalies: false });
    // With anomalies disabled, there should still be normal audit events but no rule triggers
    mockAuditRepo.find.mockResolvedValue(clean);
    const result = await service.scan('praz-1', 'PRAZ_Regulator', 72);

    expect(result.flags.length).toBe(0);
  });
});
