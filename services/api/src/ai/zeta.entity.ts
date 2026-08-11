import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { Role } from '../auth.stub';

/**
 * Audit record for every ZETA advisory interaction.
 * Ensures AI advice is explainable, traceable, and auditable.
 */
@Entity('zeta_interactions')
export class ZetaInteraction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  actorId!: string;

  @Column()
  actorRole!: Role;

  @Column({ type: 'text' })
  query!: string;

  @Column({ type: 'text' })
  response!: string;

  @Column({ type: 'simple-array', nullable: true })
  sources!: string[] | null;

  @Column({ type: 'simple-array', nullable: true })
  matchedEntryIds!: string[] | null;

  @Column({ default: false })
  insufficientData!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: any;

  @CreateDateColumn()
  createdAt!: Date;
}
