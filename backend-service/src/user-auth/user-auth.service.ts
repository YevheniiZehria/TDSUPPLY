import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserEntity } from './user.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class UserAuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwt: JwtService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.userRepo.findOne({
      where: { email: email.toLowerCase() },
    });
    if (!user) throw new UnauthorizedException('Email sau parolă incorectă.');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Email sau parolă incorectă.');

    if (!user.isVerified) {
      throw new UnauthorizedException('Contul dumneavoastră nu a fost activat. Vă rugăm să verificați email-ul pentru link-ul de confirmare.');
    }

    const payload = { sub: user.id, email: user.email, name: user.name, role: user.role };
    const accessToken = await this.jwt.signAsync(payload);
    return {
      accessToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  private getFrontendUrl(origin?: string): string {
    if (origin) {
      try {
        const url = new URL(origin);
        if (url.protocol.startsWith('http')) {
          return url.origin;
        }
      } catch {}
    }

    const frontendUrl = this.config.get<string>('FRONTEND_URL');
    if (frontendUrl && frontendUrl !== 'http://localhost:3000') {
      return frontendUrl;
    }

    const apiUrl = this.config.get<string>('NEXT_PUBLIC_API_URL');
    if (apiUrl) {
      try {
        const url = new URL(apiUrl);
        if (url.port === '3001') {
          url.port = '3000';
        }
        return url.origin;
      } catch {}
    }

    return 'http://localhost:3000';
  }

  async register(email: string, password: string, name: string, origin?: string) {
    const emailLower = email.toLowerCase();
    const existing = await this.userRepo.findOne({ where: { email: emailLower } });
    if (existing) {
      throw new BadRequestException('Utilizatorul cu acest email există deja.');
    }
    const hash = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(32).toString('hex');
    const user = this.userRepo.create({
      email: emailLower,
      name,
      passwordHash: hash,
      role: 'user',
      isVerified: false,
      verificationToken: token,
    });
    const saved = await this.userRepo.save(user);
    
    const frontendUrl = this.getFrontendUrl(origin);
    const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

    // Trimite email de verificare asincron
    void this.mailService.sendVerificationEmail(saved.email, saved.name, verificationLink).catch(err => {
      this.userRepo.manager.connection.logger.log('log', `Eroare trimitere email verificare: ${err.message}`);
    });

    const { passwordHash, ...rest } = saved;
    return rest;
  }

  async verifyEmail(token: string, origin?: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { verificationToken: token } });
    if (!user) {
      throw new BadRequestException('Token de verificare invalid sau expirat.');
    }

    user.isVerified = true;
    user.verificationToken = null;
    await this.userRepo.save(user);

    const frontendUrl = this.getFrontendUrl(origin);

    // Trimite email de bun venit asincron după activare
    void this.mailService.sendWelcomeEmail(user.email, user.name, frontendUrl).catch(err => {
      this.userRepo.manager.connection.logger.log('log', `Eroare trimitere email bun venit: ${err.message}`);
    });

    return { message: 'Contul a fost activat cu succes! Acum te poți autentifica.' };
  }

  async findById(id: string): Promise<Omit<UserEntity, 'passwordHash'> | null> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) return null;
    const { passwordHash, ...rest } = user;
    return rest;
  }

  async requestPasswordReset(email: string, origin?: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({
      where: { email: email.toLowerCase() },
    });

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      user.resetToken = token;
      user.resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
      await this.userRepo.save(user);

      const frontendUrl = this.getFrontendUrl(origin);
      const resetLink = `${frontendUrl}/reseteaza-parola?token=${token}`;
      
      void this.mailService.sendPasswordReset(user.email, resetLink);
    }

    return {
      message: 'Dacă adresa de email există în sistem, a fost trimis un link de resetare a parolei.',
    };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({
      where: {
        resetToken: token,
        resetTokenExpiry: MoreThan(new Date()),
      },
    });

    if (!user) {
      throw new BadRequestException('Token de resetare invalid sau expirat.');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await this.userRepo.save(user);

    return { message: 'Parola a fost actualizată cu succes.' };
  }

  async getStats(): Promise<{ totalUsers: number; recentUsers: number }> {
    const totalUsers = await this.userRepo.count();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = await this.userRepo
      .createQueryBuilder('user')
      .where('user.createdAt >= :date', { date: thirtyDaysAgo })
      .getCount();
    return { totalUsers, recentUsers };
  }
}
