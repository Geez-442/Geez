import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tender } from '../tender/tender.entity';
import { User } from '../entities/user.entity';

export enum BidStatus {
  Draft = 'Draft',
  Sealed = 'Sealed',
  Submitted = 'Submitted',
  Opened = 'Opened', // After tender deadline
}

/**
 * Bid entity representing a supplier's response to a tender.
 * Sensitive fields (amount, documents) are encrypted server-side using AES-256.
 * COI declarations are mandatory and immutable once sealed.
 */
@Entity('bids')
export class Bid {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Tender, { nullable: false })
  @JoinColumn({ name: 'tenderId' })
  tender!: Tender;

  @Column()
  tenderId!: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'supplierId' })
  supplier!: User;

  @Column()
  supplierId!: string;

  // Encrypted amount (stored as iv:ciphertext). Decrypted in service layer.
  @Column({ type: 'text', nullable: false })
  encryptedAmount!: string;

  @Column({ default: 'ZWL' })
  currency!: string;

  // Encrypted documents metadata (array of MinIO keys / URLs). Decrypted in service layer.
  @Column({ type: 'text', nullable: true })
  encryptedDocuments!: string | null;

  @Column({ type: 'text' })
  status!: BidStatus;

  // Conflict-of-Interest declaration (required before sealing). Stored as JSON string, immutable once sealed.
  @Column({ type: 'jsonb', nullable: true })
  coiDeclaration!: any;

  // Timestamps for time-lock logic
  @Column({ type: 'timestamp', nullable: true })
  sealedAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  openedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
