import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity, OrderItem } from './order.entity';
import { MailService } from '../mail/mail.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    private readonly mailService: MailService,
    private readonly productsService: ProductsService,
  ) {}

  async findAll(): Promise<OrderEntity[]> {
    return this.orderRepo.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findByUser(userId: string): Promise<OrderEntity[]> {
    return this.orderRepo.find({
      where: { userId },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findById(id: string): Promise<OrderEntity> {
    const o = await this.orderRepo.findOne({ where: { id } });
    if (!o) throw new NotFoundException(`Comanda ${id} nu există.`);
    return o;
  }

  async create(orderData: {
    userId: string;
    userEmail: string;
    userName: string;
    items: { id: string; quantity: number }[];
    deliveryAddress: {
      strada: string;
      bloc?: string;
      oras: string;
      judet: string;
      codPostal: string;
      observatii?: string;
    };
  }): Promise<OrderEntity> {
    // Recalculare total și validare produse pe backend (Securitate)
    let calculatedTotal = 0;
    let currency = 'RON';
    const verifiedItems: OrderItem[] = [];

    for (const item of orderData.items) {
      const product = await this.productsService.findById(item.id);
      if (!product) {
        throw new BadRequestException(`Produsul ${item.id} nu mai există.`);
      }
      if (!product.inStock && item.quantity > 0) {
        throw new BadRequestException(`Produsul ${product.name.ro} nu mai este în stoc.`);
      }

      currency = product.currency; // Presupunem aceeași monedă pentru toate produsele
      calculatedTotal += product.price * item.quantity;

      verifiedItems.push({
        id: product.id,
        slug: product.slug,
        name: product.name.ro,
        price: product.price,
        currency: product.currency,
        quantity: item.quantity,
      });
    }

    const newOrder = this.orderRepo.create({
      userId: orderData.userId,
      userEmail: orderData.userEmail,
      userName: orderData.userName,
      items: verifiedItems,
      total: calculatedTotal,
      currency,
      status: 'pending',
      deliveryAddress: orderData.deliveryAddress,
    });

    const savedOrder = await this.orderRepo.save(newOrder);

    // Trimitem email-uri asincron
    void this.mailService.sendOrderConfirmation({
      to: savedOrder.userEmail,
      userName: savedOrder.userName,
      orderId: savedOrder.id,
      total: savedOrder.total,
      currency: savedOrder.currency,
      items: savedOrder.items,
      deliveryAddress: savedOrder.deliveryAddress,
    }).catch(err => this.logger.error(`Eroare la trimiterea emailului de confirmare pentru comanda ${savedOrder.id}:`, err));

    void this.mailService.sendAdminOrderNotification({
      orderId: savedOrder.id,
      userName: savedOrder.userName,
      userEmail: savedOrder.userEmail,
      total: savedOrder.total,
      currency: savedOrder.currency,
      items: savedOrder.items,
      deliveryAddress: savedOrder.deliveryAddress,
    }).catch(err => this.logger.error(`Eroare la trimiterea notificării admin pentru comanda ${savedOrder.id}:`, err));

    return savedOrder;
  }

  async updateStatus(id: string, status: OrderEntity['status']): Promise<OrderEntity> {
    const order = await this.findById(id);
    order.status = status;
    return this.orderRepo.save(order);
  }
}
