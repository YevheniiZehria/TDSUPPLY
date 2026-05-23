import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('products')
export class ProductEntity {
  @PrimaryColumn()
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column({ unique: true })
  code: string;

  @Column('jsonb')
  name: { ro: string; en: string };

  @Column()
  category: string;

  @Column('jsonb')
  description: { ro: string; en: string };

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column()
  unit: string;

  @Column({ nullable: true })
  image: string;

  @Column({ default: true })
  inStock: boolean;

  @Column({ default: false })
  featured: boolean;

  @Column('text', { array: true, default: [] })
  tags: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
