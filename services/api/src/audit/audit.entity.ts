import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  actorId!: string;

  @Column()
  actorRole!: string;

  @Column()
  actionType!: string;

  @Column()
  targetType!: string;

  @Column({ nullable: true })
  targetId!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  payload!: any;

  @CreateDateColumn()
  timestamp!: Date;

  @Column({ nullable: true })
  hash!: string | null;
}
