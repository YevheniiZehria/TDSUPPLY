import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AdminEntity } from './admin.entity';

@Injectable()
export class AdminSeedService {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    @InjectRepository(AdminEntity)
    private readonly adminRepo: Repository<AdminEntity>,
  ) {}

  async onModuleInit() {
    const saltRoundsRaw = process.env.ADMIN_BCRYPT_SALT_ROUNDS;
    const saltRounds = saltRoundsRaw ? Number(saltRoundsRaw) : 10;

    const envEmail = process.env.ADMIN_EMAIL;
    const envPassword = process.env.ADMIN_PASSWORD;
    const envRole = process.env.ADMIN_ROLE ?? 'admin';

    if (envEmail && envPassword) {
      const emailLower = envEmail.toLowerCase();
      const existing = await this.adminRepo.findOne({ where: { email: emailLower } });
      if (!existing) {
        const passwordHash = await bcrypt.hash(envPassword, saltRounds);
        const admin = this.adminRepo.create({
          email: emailLower,
          role: envRole,
          passwordHash,
        });
        await this.adminRepo.save(admin);
        this.logger.log(`Admin configurat din .env: ${envEmail}`);
      }
    } else {
      const count = await this.adminRepo.count();
      if (count === 0) {
        this.logger.warn(
          'Nu există admin configurabil! Setează ADMIN_EMAIL și ADMIN_PASSWORD în fișierul .env',
        );
      }
    }
  }
}
