import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('settings')
export class SettingsEntity {
  @PrimaryColumn({ type: 'int', default: 1 })
  id: number;

  @Column({ default: '(+4) 0330 111 222' })
  phone: string;

  @Column({ default: 'comenzi@tdsupply.ro' })
  email: string;

  @Column({ default: 'București, România' })
  address: string;

  @Column({ default: 'Luni - Vineri: 09:00 - 18:00' })
  workingHours: string;

  @Column({ default: '' })
  facebookUrl: string;

  @Column({ default: '' })
  instagramUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
