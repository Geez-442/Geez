import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum TenderType {
  Goods = 'Goods',
  Services = 'Services',
  Works = 'Works',
  Consultancy = 'Consultancy',
  IT = 'IT',
}

export enum TenderStatus {
  Draft = 'Draft',
  Published = 'Published',
  Closed = 'Closed',
  Awarded = 'Awarded',
}

@Entity('tenders')
export class Tender {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'text' })
  tenderType!: TenderType;

  @Column()
  procuringEntity!: string;

  @Column({ type: 'numeric', nullable: true })
  budget!: number | null;

  @Column({ default: 'ZWL' })
  currency!: string;

  @Column({ type: 'timestamp', nullable: true })
  deadline!: Date | null;

  @Column({ type: 'text', default: TenderStatus.Draft })
  status!: TenderStatus;

  @Column({ nullable: true })
  publishedBy!: string | null;

  @Column({ nullable: true })
  awardedBidId!: string | null;

  @Column({ type: 'text', nullable: true })
  awardDecisionNote!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  awardedAt!: Date | null;

  @Column({ default: false })
  awardAnnounced!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
