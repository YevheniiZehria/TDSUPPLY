import {
  Body, Controller, Delete, Get, Param, Post, Put,
  Query, UseGuards, HttpCode, HttpStatus,
  UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../admin/jwt-auth.guard';
import { RolesGuard } from '../admin/roles.guard';
import { Roles } from '../admin/decorators/roles.decorator';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /** ─── Public routes ──────────────────────────────────────────── */

  @Get()
  @ApiOperation({ summary: 'Lista produse (public)' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'featured', required: false, type: Boolean })
  @ApiQuery({ name: 'q', required: false, description: 'Căutare după nume, cod sau tag-uri' })
  findAll(
    @Query('category') category?: string,
    @Query('featured') featured?: string,
    @Query('q') q?: string,
  ) {
    const featuredBool = featured === 'true' ? true : featured === 'false' ? false : undefined;
    return this.productsService.findAll(category, featuredBool, q);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistici produse (public pentru homepage)' })
  getStats() {
    return this.productsService.getStats();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Detalii produs după slug (public)' })
  findOne(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Get('id/:id')
  @ApiOperation({ summary: 'Detalii produs după id (public)' })
  findById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  /** ─── Protected routes (JWT + Role) ─────────────────────────── */

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Adaugă produs (admin)' })
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Post('import')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Importă produse din XLSX (admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async importProducts(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Niciun fișier încărcat.');
    }
    return this.productsService.importFromXlsx(file.buffer);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Editează produs (admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Șterge produs (admin)' })
  async remove(@Param('id') id: string) {
    await this.productsService.remove(id);
  }
}
