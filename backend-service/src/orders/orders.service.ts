import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity, OrderItem } from './order.entity';
import { MailService } from '../mail/mail.service';
import { ProductsService } from '../products/products.service';
import { UserEntity } from '../user-auth/user.entity';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
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
    items: { id: string; quantity: number; color?: string; variantLabel?: string }[];
    deliveryAddress: {
      strada: string;
      bloc?: string;
      oras: string;
      judet: string;
      codPostal: string;
      observatii?: string;
      telefon: string;
    };
  }): Promise<OrderEntity> {
    // Recalculare total și validare produse pe backend (Securitate)
    let calculatedTotal = 0;
    let currency = 'RON';
    const verifiedItems: OrderItem[] = [];

    for (const item of orderData.items) {
      const productId = item.id;
      const variantLabel = item.variantLabel || null;

      let product: any;
      try {
        product = await this.productsService.findById(productId);
      } catch {
        // Fallback: try to find by slug if id lookup fails
        try {
          product = await this.productsService.findBySlug(productId);
        } catch {
          throw new BadRequestException(`Produsul cu id "${productId}" nu mai există.`);
        }
      }

      let itemPrice = product.price;
      let itemName = product.name.ro;
      let itemInStock = product.inStock;
      let itemIsPreorder = product.isPreorder;

      if (variantLabel && product.variants) {
        const variant = product.variants.find(v => v.label === variantLabel);
        if (variant) {
          itemPrice = variant.price;
          itemName = `${product.name.ro} (${variant.label})`;
          itemInStock = variant.inStock !== false && product.inStock; // Dacă varianta e explicitly inStock: false
          itemIsPreorder = variant.isPreorder ?? product.isPreorder;
        }
      }

      // Validare Stoc
      if (!itemInStock && !itemIsPreorder) {
        throw new BadRequestException(`Produsul "${itemName}" nu mai este în stoc. Vă rugăm să-l eliminați din coș pentru a continua.`);
      }

      // Validare Culori (Nuanțe)
      if (product.colors && product.colors.length > 0) {
        if (!item.color) {
          throw new BadRequestException(`Produsul "${itemName}" necesită selectarea unei nuanțe/culori.`);
        }
        if (!product.colors.includes(item.color)) {
          throw new BadRequestException(`Nuanța "${item.color}" pentru produsul "${itemName}" este invalidă.`);
        }
      }

      if (item.color) {
        itemName += ` - Culoare: ${item.color}`;
      }

      if (!currency || currency === 'RON') currency = product.currency; // Prima monedă non-default câștigă
      calculatedTotal += itemPrice * item.quantity;

      verifiedItems.push({
        id: item.id,
        slug: product.slug,
        name: itemName,
        price: itemPrice,
        currency: product.currency,
        quantity: item.quantity,
        color: item.color,
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

    // Sincronizare număr de telefon în profilul utilizatorului dacă diferă sau e gol
    try {
      const user = await this.userRepo.findOne({ where: { id: orderData.userId } });
      if (user && orderData.deliveryAddress.telefon && user.phone !== orderData.deliveryAddress.telefon) {
        user.phone = orderData.deliveryAddress.telefon;
        await this.userRepo.save(user);
        this.logger.log(`Updated phone number for user ${user.id} to ${user.phone}`);
      }
    } catch (err) {
      this.logger.error(`Eroare la actualizarea numărului de telefon al utilizatorului: ${err.message}`);
    }

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
