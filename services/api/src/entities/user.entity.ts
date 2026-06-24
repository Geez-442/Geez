import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { Role } from '../../services/api/src/auth.stub';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  displayName: string;

  @Column({ nullable: true })
  passwordHash: string;

  @Column({ type: 'text' })
  role: Role;

  @Column({ nullable: true })
  prazVendorNumber: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
