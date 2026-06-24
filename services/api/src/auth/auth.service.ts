import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../data-source';
import { Role } from '../../auth.stub';

// Minimal AuthService for Sprint 1. Replace with NestJS providers in Sprint 2.
export class AuthService {
  private userRepo: Repository<User>;

  constructor() {
    this.userRepo = AppDataSource.getRepository(User);
  }

  async register(email: string, password: string, role: Role, displayName?: string, prazVendorNumber?: string) {
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) throw new Error('User already exists');

    const hash = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({ email, passwordHash: hash, role, displayName, prazVendorNumber });
    await this.userRepo.save(user);
    return { id: user.id, email: user.email, role: user.role };
  }

  async validateUser(email: string, password: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user || !user.passwordHash) return null;
    const ok = await bcrypt.compare(password, user.passwordHash);
    return ok ? user : null;
  }

  generateJwt(user: User) {
    const secret = process.env.JWT_SECRET || 'dev_jwt_secret';
    const payload = { sub: user.id, role: user.role };
    const token = jwt.sign(payload, secret, { expiresIn: '2h' });
    return token;
  }
}
