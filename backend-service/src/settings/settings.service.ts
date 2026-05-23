import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SettingsEntity } from './settings.entity';

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    @InjectRepository(SettingsEntity)
    private readonly settingsRepo: Repository<SettingsEntity>,
  ) {}

  async onModuleInit() {
    const exists = await this.settingsRepo.findOne({ where: { id: 1 } });
    if (!exists) {
      const defaultSettings = this.settingsRepo.create({
        id: 1,
        phone: '(+4) 0330 111 222',
        email: 'comenzi@tdsupply.ro',
        address: 'București, România',
        workingHours: 'Luni - Vineri: 09:00 - 18:00',
        facebookUrl: 'https://facebook.com',
        instagramUrl: 'https://instagram.com',
      });
      await this.settingsRepo.save(defaultSettings);
    }
  }

  async getSettings(): Promise<SettingsEntity> {
    let settings = await this.settingsRepo.findOne({ where: { id: 1 } });
    if (!settings) {
      settings = this.settingsRepo.create({
        id: 1,
        phone: '(+4) 0330 111 222',
        email: 'comenzi@tdsupply.ro',
        address: 'București, România',
        workingHours: 'Luni - Vineri: 09:00 - 18:00',
        facebookUrl: 'https://facebook.com',
        instagramUrl: 'https://instagram.com',
      });
      await this.settingsRepo.save(settings);
    }
    return settings;
  }

  async updateSettings(dto: Partial<Omit<SettingsEntity, 'id' | 'createdAt' | 'updatedAt'>>): Promise<SettingsEntity> {
    const settings = await this.getSettings();
    Object.assign(settings, dto);
    settings.id = 1; // ne asigurăm că id-ul rămâne mereu 1
    return this.settingsRepo.save(settings);
  }
}
