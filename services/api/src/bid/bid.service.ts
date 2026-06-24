import { Injectable, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bid, BidStatus } from './bid.entity';
import { Tender } from '../tender/tender.entity';
import { AuditLog } from '../audit/audit.entity';
import { encrypt, decrypt } from '../crypto/encryption';
import { computeChainHash } from '../crypto/hash-chain';
import { Role } from '../auth.stub';

/**
 * BidService handles secure bid management with encryption, time-lock sealing,
 * COI declarations, and append-only audit trail.
 * 
 * Security constraints enforced:
 * - Only Supplier can create/seal their own bids
 * - PMU/PRAZ can view sealed bids only after tender deadline (time-lock)
 * - Public_Observer sees anonymized summaries only
 * - All sensitive fields encrypted with AES-256
 * - COI declarations immutable once bid is sealed
 */
@Injectable()
export class BidService {
  constructor(
    @InjectRepository(Bid) private bidRepo: Repository<Bid>,
    @InjectRepository(Tender) private tenderRepo: Repository<Tender>,
    @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
  ) {}

  /**
   * Create a draft bid (Supplier only).
   * Encrypts amount and documents metadata.
   */
  async createDraft(tenderId: string, supplierId: string, amount: number, coiData?: any): Promise<Bid> {
    const tender = await this.tenderRepo.findOne({ where: { id: tenderId } });
    if (!tender) throw new NotFoundException('Tender not found');

    const encryptionSecret = process.env.ENCRYPTION_KEY || 'dev-encryption-secret';
    const encryptedAmount = encrypt(amount.toString(), encryptionSecret);

    const bid = this.bidRepo.create({
      tenderId,
      supplierId,
      encryptedAmount,
      status: BidStatus.Draft,
      coiDeclaration: coiData || null,
    });
    const saved = await this.bidRepo.save(bid);

    // Log create event with hash chain
    const previousAudit = await this.auditRepo.findOne({
      where: { targetType: 'Bid', targetId: saved.id },
      order: { timestamp: 'DESC' },
    });
    const previousHash = previousAudit?.hash || '';
    const eventPayload = `BID_CREATE:${saved.id}:${supplierId}`;
    const newHash = computeChainHash(previousHash, eventPayload);

    await this.auditRepo.save({
      actorId: supplierId,
      actorRole: Role.Supplier,
      actionType: 'CREATE_BID',
      targetType: 'Bid',
      targetId: saved.id,
      payload: { tenderId, status: BidStatus.Draft },
      hash: newHash,
    });

    return saved;
  }

  /**
   * Seal a bid (Supplier only). Encrypts and locks bid amount.
   * Requires COI declaration and validates time-lock (bid cannot be sealed after tender deadline).
   */
  async sealBid(bidId: string, supplierId: string, coiDeclaration: any): Promise<Bid> {
    const bid = await this.bidRepo.findOne({ where: { id: bidId } });
    if (!bid) throw new NotFoundException('Bid not found');
    if (bid.supplierId !== supplierId) throw new ForbiddenException('Can only seal own bid');
    if (bid.status !== BidStatus.Draft) throw new BadRequestException('Only Draft bids can be sealed');

    const tender = await this.tenderRepo.findOne({ where: { id: bid.tenderId } });
    if (tender?.deadline && new Date() > tender.deadline) {
      throw new BadRequestException('Cannot seal bid after tender deadline');
    }

    // COI declaration is mandatory and immutable
    if (!coiDeclaration || typeof coiDeclaration !== 'object') {
      throw new BadRequestException('Valid COI declaration required');
    }

    bid.status = BidStatus.Sealed;
    bid.sealedAt = new Date();
    bid.coiDeclaration = coiDeclaration;
    const saved = await this.bidRepo.save(bid);

    // Log seal event with hash chain
    const previousAudit = await this.auditRepo
      .createQueryBuilder('audit')
      .where('audit.targetType = :type AND audit.targetId = :id', { type: 'Bid', id: bidId })
      .orderBy('audit.timestamp', 'DESC')
      .limit(1)
      .getOne();

    const previousHash = previousAudit?.hash || '';
    const eventPayload = `BID_SEAL:${saved.id}:${supplierId}:${JSON.stringify(coiDeclaration)}`;
    const newHash = computeChainHash(previousHash, eventPayload);

    await this.auditRepo.save({
      actorId: supplierId,
      actorRole: Role.Supplier,
      actionType: 'SEAL_BID',
      targetType: 'Bid',
      targetId: saved.id,
      payload: { status: BidStatus.Sealed, coiDeclarationGiven: true },
      hash: newHash,
    });

    return saved;
  }

  /**
   * Get bid for Supplier (own bid) or authorized PMU/PRAZ after deadline.
   * Decrypts sensitive fields on retrieval.
   */
  async getBidForViewing(bidId: string, userId: string, userRole: Role): Promise<Bid> {
    const bid = await this.bidRepo.findOne({ where: { id: bidId } });
    if (!bid) throw new NotFoundException('Bid not found');

    const tender = await this.tenderRepo.findOne({ where: { id: bid.tenderId } });
    const isAfterDeadline = tender?.deadline && new Date() > tender.deadline;

    // Authorization: supplier sees own bid, PMU/PRAZ see sealed bids after deadline
    if (userRole === Role.Supplier) {
      if (bid.supplierId !== userId) throw new ForbiddenException('Can only view own bid');
    } else if (userRole === Role.PMU_Officer || userRole === Role.PRAZ_Regulator) {
      if (bid.status !== BidStatus.Sealed || !isAfterDeadline) {
        throw new ForbiddenException('Can only view sealed bids after tender deadline');
      }
    } else if (userRole === Role.Public_Observer) {
      throw new ForbiddenException('Public observers cannot view bid details');
    } else {
      throw new ForbiddenException('Unauthorized');
    }

    // Log view attempt (for anomaly detection)
    const previousAudit = await this.auditRepo
      .createQueryBuilder('audit')
      .where('audit.targetType = :type AND audit.targetId = :id', { type: 'Bid', id: bidId })
      .orderBy('audit.timestamp', 'DESC')
      .limit(1)
      .getOne();

    const previousHash = previousAudit?.hash || '';
    const eventPayload = `BID_VIEW:${bidId}:${userId}:${userRole}`;
    const newHash = computeChainHash(previousHash, eventPayload);

    await this.auditRepo.save({
      actorId: userId,
      actorRole: userRole,
      actionType: 'VIEW_BID',
      targetType: 'Bid',
      targetId: bidId,
      payload: { status: bid.status },
      hash: newHash,
    });

    return bid;
  }

  /**
   * Get all own bids (Supplier only).
   */
  async getOwnBids(supplierId: string): Promise<Bid[]> {
    return this.bidRepo.find({ where: { supplierId } });
  }

  /**
   * Decrypt bid amount (internal use only — never expose raw amount to ZETA).
   */
  async decryptAmount(bid: Bid): Promise<number> {
    const secret = process.env.ENCRYPTION_KEY || 'dev-encryption-secret';
    try {
      const decrypted = decrypt(bid.encryptedAmount, secret);
      return parseFloat(decrypted);
    } catch (e) {
      throw new BadRequestException('Failed to decrypt bid amount');
    }
  }

  /**
   * Stub: Decrypt documents (for MinIO integration).
   */
  async decryptDocuments(bid: Bid): Promise<any> {
    if (!bid.encryptedDocuments) return null;
    const secret = process.env.ENCRYPTION_KEY || 'dev-encryption-secret';
    try {
      const decrypted = decrypt(bid.encryptedDocuments, secret);
      return JSON.parse(decrypted);
    } catch (e) {
      throw new BadRequestException('Failed to decrypt documents');
    }
  }
}
