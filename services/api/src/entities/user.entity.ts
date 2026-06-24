import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { Role } from '../auth.stub';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ type: 'text', nullable: true })
  displayName!: string | null;

  @Column({ type: 'text', nullable: true })
  passwordHash!: string | null;

  @Column({ type: 'text' })
  role!: Role;

  @Column({ type: 'text', nullable: true })
  prazVendorNumber!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
