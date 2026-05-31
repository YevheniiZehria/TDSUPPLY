import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PdfService } from './pdf.service';
import { ProductsModule } from '../products/products.module';
import { OrderEntity } from './order.entity';
import { UserEntity } from '../user-auth/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity, UserEntity]),
    ProductsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, PdfService],
  exports: [OrdersService],
})
export class OrdersModule {}
