import { Injectable, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '../auth.stub';

@Injectable()
export class AuthServiceNest {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

  /**
   * Verify that a PRAZ vendor/entity number is structurally valid.
   * In production this would call the PRAZ e-registration API.
   */
  verifyPrazVendorNumber(role: Role, prazVendorNumber?: string): boolean {
    if (role === Role.Public_Observer) return true;
    if (!prazVendorNumber || prazVendorNumber.trim().length < 5) return false;
    return /^[A-Z0-9-]+$/i.test(prazVendorNumber.trim());
  }

  async register(email: string, password: string, role: Role, displayName?: string, prazVendorNumber?: string) {
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) throw new Error('User already exists');

    if (!this.verifyPrazVendorNumber(role, prazVendorNumber)) {
      throw new BadRequestException(`A valid PRAZ vendor/entity number is required for ${role}`);
    }

    const hash = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({ email, passwordHash: hash, role, displayName, prazVendorNumber: prazVendorNumber?.trim() });
    await this.userRepo.save(user);
    return { id: user.id, email: user.email, role: user.role, prazVendorNumber: user.prazVendorNumber };
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
