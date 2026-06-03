import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryEntity } from './category.entity';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { ProductEntity } from '../products/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryEntity, ProductEntity])],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
