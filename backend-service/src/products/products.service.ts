import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as xlsx from 'xlsx';
import { ProductEntity } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

// ─── Seed data (din catalogul static YP Dental 2026) ────────────────────────
const SEED_PRODUCTS = [
  // IMPLANTURI
  {
    id: 'impl-001', slug: 'implant-bone-level-rc-4-1', code: 'YP-BL-RC-4.1',
    name: { ro: 'Implant Bone Level RC ø4.1mm', en: 'Bone Level Implant RC ø4.1mm' },
    category: 'implanturi',
    description: { ro: 'Implant din titan grad IV cu conexiune internă Roxolid. Suprafață SLActive pentru osteointegrare rapidă.', en: 'Grade IV titanium implant with internal Roxolid connection. SLActive surface for rapid osseointegration.' },
    price: 48.5, currency: 'USD', unit: 'buc', image: '/products/implant-bone-level-rc.jpg',
    inStock: true, featured: true, tags: ['implant', 'bone-level', 'titan', 'SLActive'],
  },
  {
    id: 'impl-002', slug: 'implant-bone-level-nc-3-3', code: 'YP-BL-NC-3.3',
    name: { ro: 'Implant Bone Level NC ø3.3mm', en: 'Bone Level Implant NC ø3.3mm' },
    category: 'implanturi',
    description: { ro: 'Implant narrow cross-section pentru spații reduse. Titan grad V (Ti-6Al-4V).', en: 'Narrow cross-section implant for reduced spaces. Grade V titanium (Ti-6Al-4V).' },
    price: 46.0, currency: 'USD', unit: 'buc', image: '/products/implant-bone-level-nc.jpg',
    inStock: true, featured: true, tags: ['implant', 'narrow', 'bone-level'],
  },
  {
    id: 'impl-003', slug: 'implant-tissue-level-rn-4-1', code: 'YP-TL-RN-4.1',
    name: { ro: 'Implant Tissue Level RN ø4.1mm', en: 'Tissue Level Implant RN ø4.1mm' },
    category: 'implanturi',
    description: { ro: 'Implant tissue level cu gât neted 2.8mm. Ideal pentru zone estetice anterioare.', en: 'Tissue level implant with 2.8mm polished neck. Ideal for anterior aesthetic zones.' },
    price: 44.0, currency: 'USD', unit: 'buc', image: '/products/implant-tissue-level.jpg',
    inStock: true, featured: false, tags: ['implant', 'tissue-level', 'estetic'],
  },
  {
    id: 'impl-004', slug: 'implant-conical-sc-4-5', code: 'YP-CS-4.5',
    name: { ro: 'Implant Conic Standard ø4.5mm', en: 'Conical Standard Implant ø4.5mm' },
    category: 'implanturi',
    description: { ro: 'Design conic cu suprafată sandblasted și acid-etched. Potrivit pentru orice tip de os.', en: 'Conical design with sandblasted and acid-etched surface. Suitable for any bone type.' },
    price: 39.0, currency: 'USD', unit: 'buc', image: '/products/implant-conical.jpg',
    inStock: true, featured: false, tags: ['implant', 'conic', 'SLA'],
  },
  // COMPONENTE PROTETICE
  {
    id: 'prot-001', slug: 'pilon-drept-rc-gh-1', code: 'YP-ABT-RC-1.0',
    name: { ro: 'Pilon drept RC GH 1.0mm', en: 'Straight Abutment RC GH 1.0mm' },
    category: 'componente-protetice',
    description: { ro: 'Pilon protetic drept pentru conexiune RC. Înălțime gingivală 1mm. Titan grad IV.', en: 'Straight prosthetic abutment for RC connection. 1mm gingival height. Grade IV titanium.' },
    price: 22.0, currency: 'USD', unit: 'buc', image: '/products/pilon-drept-rc.jpg',
    inStock: true, featured: true, tags: ['pilon', 'abutment', 'RC', 'protetic'],
  },
  {
    id: 'prot-002', slug: 'pilon-angulat-17-nc', code: 'YP-ABT-17-NC',
    name: { ro: 'Pilon angulat 17° NC', en: 'Angled Abutment 17° NC' },
    category: 'componente-protetice',
    description: { ro: 'Pilon angulat 17° pentru corectarea axelor de inserție. Conexiune NC.', en: '17° angled abutment for insertion axis correction. NC connection.' },
    price: 26.5, currency: 'USD', unit: 'buc', image: '/products/pilon-angulat.jpg',
    inStock: true, featured: false, tags: ['pilon', 'angulat', 'NC'],
  },
  {
    id: 'prot-003', slug: 'capac-de-vindecare-rc-5', code: 'YP-HC-RC-5',
    name: { ro: 'Capac de vindecare RC ø5mm', en: 'Healing Cap RC ø5mm' },
    category: 'componente-protetice',
    description: { ro: 'Capac de vindecare pentru ghidarea țesutului gingival după montarea implantului.', en: 'Healing cap for guiding gingival tissue formation after implant placement.' },
    price: 8.5, currency: 'USD', unit: 'buc', image: '/products/capac-vindecare.jpg',
    inStock: true, featured: false, tags: ['healing-cap', 'vindecare', 'gingival'],
  },
  // CHIRURGIE & REGENERARE
  {
    id: 'chir-001', slug: 'membrana-colagen-resorb-30x40', code: 'YP-MEM-30x40',
    name: { ro: 'Membrană Colagen Resorbabilă 30×40mm', en: 'Resorbable Collagen Membrane 30×40mm' },
    category: 'chirurgie',
    description: { ro: 'Membrană bioresorbabilă pentru regenerare osoasă ghidată (GBR). Origine bovină purificată.', en: 'Bioresorbable membrane for guided bone regeneration (GBR). Purified bovine origin.' },
    price: 85.0, currency: 'USD', unit: 'buc', image: '/products/membrana-colagen.jpg',
    inStock: true, featured: true, tags: ['membrana', 'GBR', 'regenerare', 'colagen'],
  },
  {
    id: 'chir-002', slug: 'grefa-osoasa-sintetica-0-5-1-0', code: 'YP-BONE-SYN-0.5',
    name: { ro: 'Grefă Osoasă Sintetică 0.25g (0.5–1.0mm)', en: 'Synthetic Bone Graft 0.25g (0.5–1.0mm)' },
    category: 'chirurgie',
    description: { ro: 'Hidroxiapatită sintetică bifazică (HA/TCP). Granule 0.5–1.0mm pentru augmentare osoasă.', en: 'Biphasic synthetic hydroxyapatite (HA/TCP). 0.5–1.0mm granules for bone augmentation.' },
    price: 55.0, currency: 'USD', unit: 'flacon', image: '/products/grefa-sintetica.jpg',
    inStock: true, featured: false, tags: ['grefa', 'hidroxiapatita', 'augmentare'],
  },
  // INSTRUMENTE
  {
    id: 'instr-001', slug: 'kit-chirurgical-implant-complet', code: 'YP-KIT-SURG-01',
    name: { ro: 'Kit Chirurgical Implant — Complet', en: 'Complete Implant Surgical Kit' },
    category: 'instrumente',
    description: { ro: 'Set complet de instrumente chirurgicale pentru montarea implanturilor. Include freze, chei și indicatori.', en: 'Complete surgical instrument set for implant placement. Includes drills, wrenches and indicators.' },
    price: 320.0, currency: 'USD', unit: 'set', image: '/products/kit-chirurgical.jpg',
    inStock: true, featured: true, tags: ['kit', 'instrumente', 'chirurgical', 'freze'],
  },
  {
    id: 'instr-002', slug: 'freza-pilota-2-0', code: 'YP-DR-PILOT-2.0',
    name: { ro: 'Freză Pilot ø2.0mm', en: 'Pilot Drill ø2.0mm' },
    category: 'instrumente',
    description: { ro: 'Freză pilot din oțel inoxidabil chirurgical. Compatibilă cu toate sistemele standard.', en: 'Pilot drill from surgical stainless steel. Compatible with all standard systems.' },
    price: 12.0, currency: 'USD', unit: 'buc', image: '/products/freza-pilot.jpg',
    inStock: true, featured: false, tags: ['freza', 'pilot', 'chirurgical'],
  },
  // ESTETICA
  {
    id: 'est-001', slug: 'composite-nano-a2-4g', code: 'YP-COMP-A2-4G',
    name: { ro: 'Composite Nano A2 — 4g', en: 'Nano Composite A2 — 4g' },
    category: 'estetica-dentara',
    description: { ro: 'Material composite nanometric pentru restaurări anterioare și posterioare. Nuanță A2.', en: 'Nanometric composite material for anterior and posterior restorations. Shade A2.' },
    price: 18.5, currency: 'USD', unit: 'seringă', image: '/products/composite-nano.jpg',
    inStock: true, featured: false, tags: ['composite', 'estetic', 'restaurare', 'nano'],
  },
  // STERILIZARE
  {
    id: 'ster-001', slug: 'pungi-sterilizare-90x260-200buc', code: 'YP-STE-BAG-200',
    name: { ro: 'Pungi Sterilizare 90×260mm — 200 buc', en: 'Sterilization Pouches 90×260mm — 200 pcs' },
    category: 'protectie-sterilizare',
    description: { ro: 'Pungi autoclav cu indicator de sterilizare integrat. Compatibile cu toate autoclavele clasa B.', en: 'Autoclave pouches with integrated sterilization indicator. Compatible with all class B autoclaves.' },
    price: 14.0, currency: 'USD', unit: 'cutie', image: '/products/pungi-sterilizare.jpg',
    inStock: true, featured: false, tags: ['sterilizare', 'autoclave', 'pungi'],
  },
];

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function newId(): string {
  return `prod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

@Injectable()
export class ProductsService implements OnModuleInit {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
  ) {}

  async onModuleInit() {
    // Am dezactivat auto-seeding la pornire ca adminul sa adauge singur produsele.
    this.logger.log('Sistemul de produse inițializat. Auto-seeding-ul de demo este dezactivat.');
  }

  async seedInitialProducts() {
    // Metodă păstrată dar neapelată automat
    for (const p of SEED_PRODUCTS) {
      const product = this.productRepo.create(p);
      await this.productRepo.save(product);
    }
  }

  async findAll(category?: string, featured?: boolean, q?: string): Promise<ProductEntity[]> {
    const qb = this.productRepo.createQueryBuilder('product');

    if (category && category !== 'all') {
      qb.andWhere('product.category = :category', { category });
    }

    if (featured !== undefined) {
      qb.andWhere('product.featured = :featured', { featured });
    }

    if (q) {
      const search = `%${q.toLowerCase()}%`;
      qb.andWhere(
        `(LOWER(product.name->>'ro') LIKE :search OR 
          LOWER(product.name->>'en') LIKE :search OR 
          LOWER(product.code) LIKE :search OR 
          LOWER(product.tags::text) LIKE :search)`,
        { search },
      );
    }

    // Ordonează alfabetic după nume.ro
    qb.orderBy("product.name->>'ro'", 'ASC');

    return qb.getMany();
  }

  async findById(id: string): Promise<ProductEntity> {
    const p = await this.productRepo.findOne({ where: { id } });
    if (!p) throw new NotFoundException(`Produsul cu id "${id}" nu există.`);
    return p;
  }

  async findBySlug(slug: string): Promise<ProductEntity> {
    const p = await this.productRepo.findOne({ where: { slug } });
    if (!p) throw new NotFoundException(`Produsul cu slug "${slug}" nu există.`);
    return p;
  }

  async create(dto: CreateProductDto): Promise<ProductEntity> {
    const slug = toSlug(dto.name.ro);
    const id = newId();
    const product = this.productRepo.create({
      ...dto,
      id,
      slug,
      currency: dto.currency ?? 'USD',
      image: dto.image ?? '',
      video: dto.video ?? '',
      inStock: dto.inStock ?? true,
      featured: dto.featured ?? false,
      tags: dto.tags ?? [],
    });
    return this.productRepo.save(product);
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductEntity> {
    const existing = await this.findById(id);

    if (dto.name) {
      existing.name = { ...existing.name, ...dto.name };
      existing.slug = toSlug(existing.name.ro);
    }
    if (dto.description) {
      existing.description = { ...existing.description, ...dto.description };
    }

    const { name, description, ...otherProps } = dto;
    Object.assign(existing, otherProps);

    return this.productRepo.save(existing);
  }

  async remove(id: string): Promise<void> {
    const p = await this.findById(id);
    await this.productRepo.remove(p);
  }

  async getStats() {
    const all = await this.productRepo.find();
    const byCategory: Record<string, number> = {};
    for (const p of all) {
      byCategory[p.category] = (byCategory[p.category] ?? 0) + 1;
    }
    return {
      total: all.length,
      inStock: all.filter(p => p.inStock).length,
      outOfStock: all.filter(p => !p.inStock).length,
      featured: all.filter(p => p.featured).length,
      byCategory,
    };
  }

  async importFromXlsx(buffer: Buffer): Promise<{ importedCount: number }> {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const parsedProducts: any[] = [];

    const cleanString = (str: any) => {
      if (!str) return '';
      return String(str).replace(/\r?\n|\r/g, ' ').trim();
    };

    const extractPrice = (priceVal: any) => {
      if (typeof priceVal === 'number') return priceVal;
      if (!priceVal) return 0;
      const match = String(priceVal).match(/[\d.,]+/);
      if (match) {
        return parseFloat(match[0].replace(',', ''));
      }
      return 0;
    };

    const toSlug = (text: string): string => {
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    };

    // 1. Zirconia + Glass Ceramic
    if (workbook.Sheets['Zirconia +Glass Ceramic']) {
      const sheet = workbook.Sheets['Zirconia +Glass Ceramic'];
      const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as any[];
      let currentModel = '';
      for (let i = 4; i < rows.length; i++) {
        const row = rows[i];
        if (!row) continue;
        if (row[0]) currentModel = cleanString(row[0]);
        const spec = row[2];
        const thickness = row[3];
        const zirconiaPrice = extractPrice(row[6] || row[5]);

        if (currentModel && spec && thickness && zirconiaPrice) {
          parsedProducts.push({
            code: `ZIRC-${currentModel}-${spec}-${thickness}`.replace(/\s+/g, '-').toUpperCase(),
            name: {
              ro: `Zirconia ${currentModel} ø${spec}mm grosime ${thickness}mm`,
              en: `Zirconia ${currentModel} ø${spec}mm thickness ${thickness}mm`,
            },
            category: 'zirconia',
            price: zirconiaPrice,
            currency: 'USD',
            unit: 'buc',
            description: {
              ro: `Disc Zirconia de înaltă calitate model ${currentModel}, diametru ${spec}mm, grosime ${thickness}mm.`,
              en: `High-quality Zirconia disc model ${currentModel}, diameter ${spec}mm, thickness ${thickness}mm.`,
            },
            inStock: true,
            featured: false,
            tags: ['zirconia', currentModel.toLowerCase()],
          });
        }

        const glassModel = row[8];
        const glassPrice = extractPrice(row[11] || row[10]);
        if (glassModel && glassPrice) {
          const modelClean = cleanString(glassModel);
          parsedProducts.push({
            code: `GLASS-${modelClean.substring(0, 15)}`.replace(/[^a-zA-Z0-9]/g, '-').toUpperCase(),
            name: { ro: modelClean, en: modelClean },
            category: 'glass-ceramic',
            price: glassPrice,
            currency: 'USD',
            unit: 'cutie',
            description: {
              ro: `Ceramică de sticlă / press ingot de înaltă calitate: ${modelClean}.`,
              en: `High-quality Glass Ceramic / Press Ingot: ${modelClean}.`,
            },
            inStock: true,
            featured: false,
            tags: ['glass-ceramic'],
          });
        }
      }
    }

    // 2. milling machine+furnace
    if (workbook.Sheets['milling machine+furnace']) {
      const sheet = workbook.Sheets['milling machine+furnace'];
      const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as any[];
      for (let i = 4; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !row[0]) continue;
        const model = cleanString(row[0]);
        const price = extractPrice(row[1]);
        const remarks = cleanString(row[2]);
        if (price) {
          parsedProducts.push({
            code: `MILL-${model}`.replace(/[^a-zA-Z0-9]/g, '-').toUpperCase(),
            name: {
              ro: `Mașină de frezat / Cuptor ${model}`,
              en: `Milling Machine / Furnace ${model}`,
            },
            category: 'milling-machines',
            price: price,
            currency: 'USD',
            unit: 'buc',
            description: {
              ro: `Echipament profesional CAD/CAM: Mașină de frezat / Cuptor model ${model}. ${remarks ? 'Observații: ' + remarks : ''}`,
              en: `Professional CAD/CAM Equipment: Milling Machine / Furnace model ${model}. ${remarks ? 'Remarks: ' + remarks : ''}`,
            },
            inStock: true,
            featured: false,
            tags: ['milling-machine', 'furnace', 'cad-cam'],
          });
        }
      }
    }

    // 3. PEEK+PMMA+WAX
    if (workbook.Sheets['PEEK+PMMA+WAX']) {
      const sheet = workbook.Sheets['PEEK+PMMA+WAX'];
      const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as any[];
      let currentType = '';
      for (let i = 4; i < rows.length; i++) {
        const row = rows[i];
        if (!row) continue;
        if (row[0]) currentType = cleanString(row[0]);
        const spec = row[2];
        const thickness = row[3];
        const shade = row[4];
        const price = extractPrice(row[5]);

        if (currentType && spec && thickness && price) {
          const shadeStr = shade ? ` (${cleanString(shade)})` : '';
          parsedProducts.push({
            code: `CAD-${currentType}-${spec}-${thickness}`.replace(/[^a-zA-Z0-9]/g, '-').toUpperCase(),
            name: {
              ro: `${currentType} ø${spec}mm grosime ${thickness}mm${shadeStr}`,
              en: `${currentType} ø${spec}mm thickness ${thickness}mm${shadeStr}`,
            },
            category: 'peek-pmma-wax',
            price: price,
            currency: 'USD',
            unit: 'buc',
            description: {
              ro: `Disc CAD/CAM din ${currentType}, diametru ${spec}mm, grosime ${thickness}mm${shadeStr ? ', nuanță ' + shadeStr : ''}.`,
              en: `CAD/CAM disc of ${currentType}, diameter ${spec}mm, thickness ${thickness}mm${shadeStr ? ', shade ' + shadeStr : ''}.`,
            },
            inStock: true,
            featured: false,
            tags: ['cad-cam', currentType.toLowerCase().replace(/\s+/g, '-')],
          });
        }
      }
    }

    // 4. scanner+printer
    if (workbook.Sheets['scanner+printer']) {
      const sheet = workbook.Sheets['scanner+printer'];
      const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as any[];
      for (let i = 2; i < rows.length; i++) {
        const row = rows[i];
        if (!row) continue;
        const name = row[0] ? cleanString(row[0]) : '';
        const model = row[1] ? cleanString(row[1]) : '';
        const price = extractPrice(row[3] || row[2]);
        if ((name || model) && price && name !== 'Product name' && model !== 'Model') {
          const fullName = name && model ? `${name} ${model}` : (name || model);
          parsedProducts.push({
            code: `SCAN-${fullName.substring(0, 15)}`.replace(/[^a-zA-Z0-9]/g, '-').toUpperCase(),
            name: { ro: fullName, en: fullName },
            category: 'scanners-printers',
            price: price,
            currency: 'USD',
            unit: 'buc',
            description: {
              ro: `Echipament de scanare/imprimare 3D stomatologic: ${fullName}.`,
              en: `Dental scanning/3D printing equipment: ${fullName}.`,
            },
            inStock: true,
            featured: false,
            tags: ['scanner', 'printer'],
          });
        }
      }
    }

    // 5. Composite+Flexible material
    if (workbook.Sheets['Composite+Flexible material']) {
      const sheet = workbook.Sheets['Composite+Flexible material'];
      const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as any[];
      for (let i = 4; i < rows.length; i++) {
        const row = rows[i];
        if (!row) continue;
        const name = row[0] ? cleanString(row[0]) : '';
        const spec = row[2] ? cleanString(row[2]) : '';
        const color = row[3] ? cleanString(row[3]) : '';
        const price = extractPrice(row[4]);
        if (name && price && name !== 'Product name') {
          const fullName = `${name} ${spec} ${color}`.trim();
          parsedProducts.push({
            code: `COMP-${fullName.substring(0, 15)}`.replace(/[^a-zA-Z0-9]/g, '-').toUpperCase(),
            name: { ro: fullName, en: fullName },
            category: 'composite-materials',
            price: price,
            currency: 'USD',
            unit: 'buc',
            description: {
              ro: `Material compozit / flexibil utilizat în laboratorul dentar: ${fullName}.`,
              en: `Composite / flexible material used in the dental laboratory: ${fullName}.`,
            },
            inStock: true,
            featured: false,
            tags: ['composite', 'flexible'],
          });
        }
      }
    }

    // Fetch all existing products to check code and slug in memory (prevents N+1 database queries)
    const allProducts = await this.productRepo.find();
    const existingMap = new Map<string, ProductEntity>(
      allProducts
        .filter(p => p && p.code)
        .map(p => [p.code.toUpperCase(), p])
    );
    const slugSet = new Set<string>(
      allProducts
        .filter(p => p && p.slug)
        .map(p => p.slug.toLowerCase())
    );

    const productsToSaveMap = new Map<string, ProductEntity>();
    let importedCount = 0;

    for (const p of parsedProducts) {
      const upperCode = p.code.toUpperCase();
      const existing = existingMap.get(upperCode);
      let productToSave: ProductEntity;

      if (!existing) {
        const slug = toSlug(p.name.ro);
        let finalSlug = slug;
        let count = 1;
        while (slugSet.has(finalSlug.toLowerCase())) {
          finalSlug = `${slug}-${count}`;
          count++;
        }
        // Rezervă slug-ul pentru a preveni coliziuni în cadrul aceluiași import
        slugSet.add(finalSlug.toLowerCase());

        const id = `prod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        productToSave = this.productRepo.create({
          code: p.code,
          name: p.name,
          category: p.category,
          price: p.price,
          currency: p.currency,
          unit: p.unit,
          description: p.description,
          tags: p.tags,
          id,
          slug: finalSlug,
        });

        // Adaugă produsul nou creat în mapă pentru a preveni inserări duplicate 
        // dacă în Excel există rânduri duplicate cu același cod
        existingMap.set(upperCode, productToSave);
      } else {
        productToSave = existing;
        Object.assign(productToSave, {
          name: p.name,
          category: p.category,
          price: p.price,
          currency: p.currency,
          unit: p.unit,
          description: p.description,
          tags: p.tags,
        });
      }
      productsToSaveMap.set(upperCode, productToSave);
      importedCount++;
    }

    const productsToSave = Array.from(productsToSaveMap.values());

    // Salvează toate produsele în mod eficient într-o singură operație bulk / tranzacție
    if (productsToSave.length > 0) {
      await this.productRepo.save(productsToSave);
    }

    return { importedCount };
  }
}
