import { Injectable, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tender, TenderStatus } from '../tender/tender.entity';
import { Bid, BidStatus } from '../bid/bid.entity';
import { AuditLog } from '../audit/audit.entity';
import { BidService } from '../bid/bid.service';
import { computeChainHash } from '../crypto/hash-chain';
import { Role } from '../auth.stub';

@Injectable()
export class EvaluationService {
  constructor(
    @InjectRepository(Tender) private tenderRepo: Repository<Tender>,
    @InjectRepository(Bid) private bidRepo: Repository<Bid>,
    @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
    private bidService: BidService,
  ) {}

  private async appendAudit(
    actorId: string,
    actorRole: string,
    actionType: string,
    targetType: string,
    targetId: string,
    payload: any,
  ) {
    const previous = await this.auditRepo
      .createQueryBuilder('audit')
      .where('audit.targetType = :type AND audit.targetId = :id', { type: targetType, id: targetId })
      .orderBy('audit.timestamp', 'DESC')
      .limit(1)
      .getOne();
    const hash = computeChainHash(previous?.hash || '', `${actionType}:${targetId}:${actorId}`);
    await this.auditRepo.save({
      actorId,
      actorRole,
      actionType,
      targetType,
      targetId,
      payload,
      hash,
    });
  }

  async reviewBid(bidId: string, userId: string, userRole: Role) {
    if (userRole !== Role.PMU_Officer && userRole !== Role.PRAZ_Regulator) {
      throw new ForbiddenException('Only PMU/PRAZ can review bids');
    }

    const bid = await this.bidService.getBidForViewing(bidId, userId, userRole);
    const amount = await this.bidService.decryptAmount(bid);
    const tender = await this.tenderRepo.findOne({ where: { id: bid.tenderId } });

    await this.appendAudit(userId, userRole, 'REVIEW_BID', 'Bid', bidId, {
      status: bid.status,
      amountRevealed: true,
    });

    return {
      id: bid.id,
      tenderId: bid.tenderId,
      tenderTitle: tender?.title,
      supplierId: bid.supplierId,
      status: bid.status,
      sealedAt: bid.sealedAt,
      coiDeclaration: bid.coiDeclaration,
      amount,
      currency: bid.currency,
      advisory: {
        note: 'ZETA advisory only — do not treat decrypted amount guidance as an award decision.',
        coiPresent: Boolean(bid.coiDeclaration),
      },
    };
  }

  async reviewTender(tenderId: string, userId: string, userRole: Role) {
    if (userRole !== Role.PMU_Officer && userRole !== Role.PRAZ_Regulator) {
      throw new ForbiddenException('Only PMU/PRAZ can review tenders');
    }

    const tender = await this.tenderRepo.findOne({ where: { id: tenderId } });
    if (!tender) throw new NotFoundException('Tender not found');

    const isAfterDeadline = tender.deadline && new Date() > tender.deadline;
    if (!isAfterDeadline && tender.status !== TenderStatus.Awarded) {
      throw new ForbiddenException('Can only review bids after tender deadline');
    }

    const sealedBids = await this.bidRepo.find({
      where: { tenderId, status: BidStatus.Sealed },
    });

    const bids = [];
    for (const bid of sealedBids) {
      const amount = await this.bidService.decryptAmount(bid);
      bids.push({
        id: bid.id,
        supplierId: bid.supplierId,
        status: bid.status,
        sealedAt: bid.sealedAt,
        coiDeclaration: bid.coiDeclaration,
        amount,
        currency: bid.currency,
      });
    }

    bids.sort((a, b) => a.amount - b.amount);

    await this.appendAudit(userId, userRole, 'REVIEW_TENDER', 'Tender', tenderId, {
      sealedBidCount: bids.length,
    });

    return {
      tender,
      bids,
      recommendation:
        bids.length > 0
          ? `Lowest sealed bid is ${bids[0].amount} ${bids[0].currency} (advisory ranking only).`
          : 'No sealed bids available.',
    };
  }

  async awardTender(
    tenderId: string,
    userId: string,
    userRole: Role,
    awardedBidId: string,
    awardDecisionNote: string,
  ) {
    if (userRole !== Role.PMU_Officer) {
      throw new ForbiddenException('Only PMU officers can award tenders');
    }
    if (!awardedBidId || !awardDecisionNote?.trim()) {
      throw new BadRequestException('awardedBidId and awardDecisionNote required');
    }

    const tender = await this.tenderRepo.findOne({ where: { id: tenderId } });
    if (!tender) throw new NotFoundException('Tender not found');

    const bid = await this.bidRepo.findOne({ where: { id: awardedBidId, tenderId } });
    if (!bid || bid.status !== BidStatus.Sealed) {
      throw new BadRequestException('Awarded bid must be a sealed bid for this tender');
    }

    const isAfterDeadline = tender.deadline && new Date() > tender.deadline;
    if (!isAfterDeadline) {
      throw new ForbiddenException('Cannot award before tender deadline');
    }

    tender.status = TenderStatus.Awarded;
    tender.awardedBidId = awardedBidId;
    tender.awardDecisionNote = awardDecisionNote;
    tender.awardedAt = new Date();
    tender.awardAnnounced = false;
    const saved = await this.tenderRepo.save(tender);

    await this.appendAudit(userId, userRole, 'AWARD_TENDER', 'Tender', tenderId, {
      awardedBidId,
      awardDecisionNote,
    });

    return saved;
  }

  async announceAward(tenderId: string, userId: string, userRole: Role) {
    if (userRole !== Role.PMU_Officer) {
      throw new ForbiddenException('Only PMU officers can announce awards');
    }

    const tender = await this.tenderRepo.findOne({ where: { id: tenderId } });
    if (!tender) throw new NotFoundException('Tender not found');
    if (tender.status !== TenderStatus.Awarded || !tender.awardedBidId) {
      throw new BadRequestException('Tender must be awarded before announcement');
    }

    tender.awardAnnounced = true;
    await this.tenderRepo.save(tender);

    const subject = `Award notice: ${tender.title}`;
    const body = `Procuring entity ${tender.procuringEntity} announces award for tender ${tender.id}. Decision note: ${tender.awardDecisionNote}`;

    await this.appendAudit(userId, userRole, 'ANNOUNCE_AWARD', 'Tender', tenderId, {
      channels: ['email', 'portal'],
      subject,
    });

    return {
      tenderId,
      channels: {
        email: { subject, body, status: 'queued' },
        portal: { status: 'published' },
      },
    };
  }
}
