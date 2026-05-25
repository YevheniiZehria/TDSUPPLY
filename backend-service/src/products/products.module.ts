import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { UploadsController } from './uploads.controller';
import { ProductsService } from './products.service';
import { UploadsService } from './uploads.service';
import { ProductEntity } from './product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductEntity])],
  controllers: [ProductsController, UploadsController],
  providers: [ProductsService, UploadsService],
  exports: [ProductsService],
})
export class ProductsModule {}
