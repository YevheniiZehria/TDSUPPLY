import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export interface OrderItem {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
}

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  userEmail: string;

  @Column()
  userName: string;

  @Column('jsonb')
  items: OrderItem[];

  @Column('decimal', { precision: 10, scale: 2, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value),
  }})
  total: number;

  @Column()
  currency: string;

  @Column('jsonb', { nullable: true })
  deliveryAddress?: {
    strada: string;
    bloc?: string;
    oras: string;
    judet: string;
    codPostal: string;
    observatii?: string;
  };

  @Column({ default: 'pending' })
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
