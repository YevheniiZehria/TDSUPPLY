import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
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

    const payload = { sub: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone };
    const accessToken = await this.jwt.signAsync(payload);
    return {
      accessToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone },
    };
  }

  private getFrontendUrl(): string {
    return this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
  }

  async register(email: string, password: string, name: string, phone?: string, birthDate?: string, country?: string) {
    const emailLower = email.toLowerCase();
    const existing = await this.userRepo.findOne({ where: { email: emailLower } });
    if (existing) {
      throw new BadRequestException('Utilizatorul cu acest email există deja.');
    }

    if (birthDate) {
      const birth = new Date(birthDate);
      if (isNaN(birth.getTime())) {
        throw new BadRequestException('Data de naștere este invalidă.');
      }
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      if (age < 18) {
        throw new BadRequestException('Trebuie să aveți cel puțin 18 ani pentru a vă înregistra.');
      }
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
      phone: phone ?? null,
      birthDate: birthDate ?? null,
      country: country ?? null,
    });
    const saved = await this.userRepo.save(user);
    
    const frontendUrl = this.getFrontendUrl();
    const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

    // Trimite email de verificare asincron
    void this.mailService.sendVerificationEmail(saved.email, saved.name, verificationLink).catch(err => {
      this.userRepo.manager.connection.logger.log('log', `Eroare trimitere email verificare: ${err.message}`);
    });

    const { passwordHash, ...rest } = saved;
    return rest;
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { verificationToken: token } });
    if (!user) {
      throw new BadRequestException('Token de verificare invalid sau expirat.');
    }

    user.isVerified = true;
    user.verificationToken = null;
    await this.userRepo.save(user);

    const frontendUrl = this.getFrontendUrl();

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

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({
      where: { email: email.toLowerCase() },
    });

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      user.resetToken = token;
      user.resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
      await this.userRepo.save(user);

      const frontendUrl = this.getFrontendUrl();
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

  // ─── Metode Admin ────────────────────────────────────────────────────────────

  async adminGetAllUsers(): Promise<Array<Omit<UserEntity, 'passwordHash' | 'resetToken' | 'verificationToken'> & { orderCount: number }>> {
    const users = await this.userRepo.find({ order: { createdAt: 'DESC' } });

    // Numărăm comenzile per user folosind un query raw (evităm dependința circulară cu OrdersModule)
    const userIds = users.map(u => u.id);
    let orderCounts: Record<string, number> = {};

    if (userIds.length > 0) {
      const rows: Array<{ userId: string; count: string }> = await this.userRepo.manager
        .query(
          `SELECT "userId", COUNT(*)::int as count FROM orders WHERE "userId" = ANY($1) GROUP BY "userId"`,
          [userIds],
        );
      for (const row of rows) {
        orderCounts[row.userId] = Number(row.count);
      }
    }

    return users.map(({ passwordHash, resetToken, verificationToken, ...rest }) => ({
      ...rest,
      orderCount: orderCounts[rest.id] ?? 0,
    }));
  }

  async adminChangePassword(userId: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilizatorul nu a fost găsit.');
    if (newPassword.length < 6) throw new BadRequestException('Parola trebuie să aibă minim 6 caractere.');
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);
    return { message: 'Parola a fost actualizată cu succes.' };
  }

  async adminDeleteUser(userId: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilizatorul nu a fost găsit.');
    await this.userRepo.remove(user);
    return { message: 'Contul a fost șters cu succes.' };
  }

  async adminToggleActive(userId: string): Promise<{ message: string; isVerified: boolean }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilizatorul nu a fost găsit.');
    user.isVerified = !user.isVerified;
    await this.userRepo.save(user);
    return {
      message: user.isVerified ? 'Contul a fost activat.' : 'Contul a fost dezactivat.',
      isVerified: user.isVerified,
    };
  }
}
