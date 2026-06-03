import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from './category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dtos/category.dto';
import { ProductEntity } from '../products/product.entity';

// Funcție utilitară pentru slug
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepo: Repository<CategoryEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
  ) {}

  async findAll(): Promise<CategoryEntity[]> {
    return this.categoryRepo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<CategoryEntity> {
    const cat = await this.categoryRepo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('Categoria nu a fost găsită');
    return cat;
  }

  async create(dto: CreateCategoryDto): Promise<CategoryEntity> {
    const slug = slugify(dto.name.en);
    const id = slug; // Folosim slug-ul ca id, ca și la cele vechi
    
    const existing = await this.categoryRepo.findOne({ where: [{ id }, { slug }] });
    if (existing) {
      throw new BadRequestException('O categorie cu acest nume / slug există deja.');
    }

    const cat = this.categoryRepo.create({
      id,
      slug,
      name: dto.name,
    });
    return this.categoryRepo.save(cat);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryEntity> {
    const cat = await this.findOne(id);
    cat.name = dto.name;
    // Nu schimbăm ID-ul/slug-ul ca să nu rupem legătura cu produsele
    return this.categoryRepo.save(cat);
  }

  async remove(id: string): Promise<void> {
    const cat = await this.findOne(id);
    
    // Verificăm dacă există produse asociate cu această categorie
    const productCount = await this.productRepo.count({ where: { category: id } });
    if (productCount > 0) {
      throw new BadRequestException(`Nu poți șterge această categorie deoarece există ${productCount} produse asociate cu ea. Mută produsele în altă categorie mai întâi.`);
    }

    await this.categoryRepo.remove(cat);
  }
}
