// Catalog de produse TD Supply — date statice extrase din YP Dental 2026.05
// Imaginile vor fi adăugate manual în /public/products/

export type Lang = 'ro' | 'en';

export interface Product {
  id: string;
  slug: string;
  code: string;
  name: { ro: string; en: string };
  category: string;
  description: { ro: string; en: string };
  price: number; // USD
  currency: string;
  unit: string;
  image: string; // path în /public/products/
  inStock: boolean;
  featured?: boolean;
  tags: string[];
}

export interface Category {
  id: string;
  slug: string;
  name: { ro: string; en: string };
  icon: string;
  description: { ro: string; en: string };
  count: number;
}

export const CATEGORIES: Category[] = [
  {
    id: 'zirconia',
    slug: 'zirconia',
    name: { ro: 'Discuri Zirconia', en: 'Zirconia Discs' },
    icon: '💿',
    description: {
      ro: 'Discuri din zirconia de înaltă calitate pentru frezare CAD/CAM.',
      en: 'High-quality zirconia discs for CAD/CAM milling.',
    },
    count: 9,
  },
  {
    id: 'glass-ceramic',
    slug: 'glass-ceramic',
    name: { ro: 'Glass Ceramică', en: 'Glass Ceramic' },
    icon: '✨',
    description: {
      ro: 'Materiale ceramice de sticlă și press ingots premium.',
      en: 'Premium glass-ceramic materials and press ingots.',
    },
    count: 7,
  },
  {
    id: 'milling-machines',
    slug: 'milling-machines',
    name: { ro: 'Mașini de Frezat & Cuptoare', en: 'Milling Machines & Furnaces' },
    icon: '⚙️',
    description: {
      ro: 'Echipamente CAD/CAM profesionale: mașini de frezat și cuptoare.',
      en: 'Professional CAD/CAM equipment: milling machines and furnaces.',
    },
    count: 16,
  },
  {
    id: 'scanners-printers',
    slug: 'scanners-printers',
    name: { ro: 'Scannere & Imprimante', en: 'Scanners & Printers' },
    icon: '🖨️',
    description: {
      ro: 'Scannere intraorale/de laborator și imprimante 3D.',
      en: 'Intraoral/laboratory scanners and 3D printers.',
    },
    count: 18,
  },
  {
    id: 'peek-pmma-wax',
    slug: 'peek-pmma-wax',
    name: { ro: 'PEEK, PMMA & Wax', en: 'PEEK, PMMA & Wax' },
    icon: '💿',
    description: {
      ro: 'Discuri CAD/CAM din PEEK, PMMA și ceară pentru laborator.',
      en: 'CAD/CAM discs made of PEEK, PMMA and wax for dental labs.',
    },
    count: 9,
  },
  {
    id: 'composite-materials',
    slug: 'composite-materials',
    name: { ro: 'Materiale Compozite', en: 'Composite Materials' },
    icon: '🧪',
    description: {
      ro: 'Materiale compozite și blocuri flexibile de înaltă rezistență.',
      en: 'High-strength composite materials and flexible blocks.',
    },
    count: 6,
  },
];

export const PRODUCTS: Product[] = [
  // --- IMPLANTURI ---
  {
    id: 'impl-001',
    slug: 'implant-bone-level-rc-4-1',
    code: 'YP-BL-RC-4.1',
    name: { ro: 'Implant Bone Level RC ø4.1mm', en: 'Bone Level Implant RC ø4.1mm' },
    category: 'implanturi',
    description: {
      ro: 'Implant din titan grad IV cu conexiune internă Roxolid. Suprafață SLActive pentru osteointegrare rapidă.',
      en: 'Grade IV titanium implant with internal Roxolid connection. SLActive surface for rapid osseointegration.',
    },
    price: 48.5,
    currency: 'USD',
    unit: 'buc',
    image: '/products/implant-bone-level-rc.jpg',
    inStock: true,
    featured: true,
    tags: ['implant', 'bone-level', 'titan', 'SLActive'],
  },
  {
    id: 'impl-002',
    slug: 'implant-bone-level-nc-3-3',
    code: 'YP-BL-NC-3.3',
    name: { ro: 'Implant Bone Level NC ø3.3mm', en: 'Bone Level Implant NC ø3.3mm' },
    category: 'implanturi',
    description: {
      ro: 'Implant narrow cross-section pentru spații reduse. Titan grad V (Ti-6Al-4V).',
      en: 'Narrow cross-section implant for reduced spaces. Grade V titanium (Ti-6Al-4V).',
    },
    price: 46.0,
    currency: 'USD',
    unit: 'buc',
    image: '/products/implant-bone-level-nc.jpg',
    inStock: true,
    featured: true,
    tags: ['implant', 'narrow', 'bone-level'],
  },
  {
    id: 'impl-003',
    slug: 'implant-tissue-level-rn-4-1',
    code: 'YP-TL-RN-4.1',
    name: { ro: 'Implant Tissue Level RN ø4.1mm', en: 'Tissue Level Implant RN ø4.1mm' },
    category: 'implanturi',
    description: {
      ro: 'Implant tissue level cu gât neted 2.8mm. Ideal pentru zone estetice anterioare.',
      en: 'Tissue level implant with 2.8mm polished neck. Ideal for anterior aesthetic zones.',
    },
    price: 44.0,
    currency: 'USD',
    unit: 'buc',
    image: '/products/implant-tissue-level.jpg',
    inStock: true,
    featured: false,
    tags: ['implant', 'tissue-level', 'estetic'],
  },
  {
    id: 'impl-004',
    slug: 'implant-conical-sc-4-5',
    code: 'YP-CS-4.5',
    name: { ro: 'Implant Conic Standard ø4.5mm', en: 'Conical Standard Implant ø4.5mm' },
    category: 'implanturi',
    description: {
      ro: 'Design conic cu suprafață sandblasted și acid-etched. Potrivit pentru orice tip de os.',
      en: 'Conical design with sandblasted and acid-etched surface. Suitable for any bone type.',
    },
    price: 39.0,
    currency: 'USD',
    unit: 'buc',
    image: '/products/implant-conical.jpg',
    inStock: true,
    featured: false,
    tags: ['implant', 'conic', 'SLA'],
  },
  // --- COMPONENTE PROTETICE ---
  {
    id: 'prot-001',
    slug: 'pilon-drept-rc-gh-1',
    code: 'YP-ABT-RC-1.0',
    name: { ro: 'Pilon drept RC GH 1.0mm', en: 'Straight Abutment RC GH 1.0mm' },
    category: 'componente-protetice',
    description: {
      ro: 'Pilon protetic drept pentru conexiune RC. Înălțime gingivală 1mm. Titan grad IV.',
      en: 'Straight prosthetic abutment for RC connection. 1mm gingival height. Grade IV titanium.',
    },
    price: 22.0,
    currency: 'USD',
    unit: 'buc',
    image: '/products/pilon-drept-rc.jpg',
    inStock: true,
    featured: true,
    tags: ['pilon', 'abutment', 'RC', 'protetic'],
  },
  {
    id: 'prot-002',
    slug: 'pilon-angulat-17-nc',
    code: 'YP-ABT-17-NC',
    name: { ro: 'Pilon angulat 17° NC', en: 'Angled Abutment 17° NC' },
    category: 'componente-protetice',
    description: {
      ro: 'Pilon angulat 17° pentru corectarea axelor de inserție. Conexiune NC.',
      en: '17° angled abutment for insertion axis correction. NC connection.',
    },
    price: 26.5,
    currency: 'USD',
    unit: 'buc',
    image: '/products/pilon-angulat.jpg',
    inStock: true,
    featured: false,
    tags: ['pilon', 'angulat', 'NC'],
  },
  {
    id: 'prot-003',
    slug: 'capac-de-vindecare-rc-5',
    code: 'YP-HC-RC-5',
    name: { ro: 'Capac de vindecare RC ø5mm', en: 'Healing Cap RC ø5mm' },
    category: 'componente-protetice',
    description: {
      ro: 'Capac de vindecare pentru ghidarea țesutului gingival după montarea implantului.',
      en: 'Healing cap for guiding gingival tissue formation after implant placement.',
    },
    price: 8.5,
    currency: 'USD',
    unit: 'buc',
    image: '/products/capac-vindecare.jpg',
    inStock: true,
    featured: false,
    tags: ['healing-cap', 'vindecare', 'gingival'],
  },
  // --- CHIRURGIE & REGENERARE ---
  {
    id: 'chir-001',
    slug: 'membrana-colagen-resorb-30x40',
    code: 'YP-MEM-30x40',
    name: { ro: 'Membrană Colagen Resorbabilă 30×40mm', en: 'Resorbable Collagen Membrane 30×40mm' },
    category: 'chirurgie',
    description: {
      ro: 'Membrană bioresorbabilă pentru regenerare osoasă ghidată (GBR). Origine bovină purificată.',
      en: 'Bioresorbable membrane for guided bone regeneration (GBR). Purified bovine origin.',
    },
    price: 85.0,
    currency: 'USD',
    unit: 'buc',
    image: '/products/membrana-colagen.jpg',
    inStock: true,
    featured: true,
    tags: ['membrana', 'GBR', 'regenerare', 'colagen'],
  },
  {
    id: 'chir-002',
    slug: 'grefa-osoasa-sintetica-0-5-1-0',
    code: 'YP-BONE-SYN-0.5',
    name: { ro: 'Grefă Osoasă Sintetică 0.25g (0.5–1.0mm)', en: 'Synthetic Bone Graft 0.25g (0.5–1.0mm)' },
    category: 'chirurgie',
    description: {
      ro: 'Hidroxiapatită sintetică bifazică (HA/TCP). Granule 0.5–1.0mm pentru augmentare osoasă.',
      en: 'Biphasic synthetic hydroxyapatite (HA/TCP). 0.5–1.0mm granules for bone augmentation.',
    },
    price: 55.0,
    currency: 'USD',
    unit: 'flacon',
    image: '/products/grefa-sintetica.jpg',
    inStock: true,
    featured: false,
    tags: ['grefa', 'hidroxiapatita', 'augmentare'],
  },
  // --- INSTRUMENTE ---
  {
    id: 'instr-001',
    slug: 'kit-chirurgical-implant-complet',
    code: 'YP-KIT-SURG-01',
    name: { ro: 'Kit Chirurgical Implant — Complet', en: 'Complete Implant Surgical Kit' },
    category: 'instrumente',
    description: {
      ro: 'Set complet de instrumente chirurgicale pentru montarea implanturilor. Include freze, chei și indicatori.',
      en: 'Complete surgical instrument set for implant placement. Includes drills, wrenches and indicators.',
    },
    price: 320.0,
    currency: 'USD',
    unit: 'set',
    image: '/products/kit-chirurgical.jpg',
    inStock: true,
    featured: true,
    tags: ['kit', 'instrumente', 'chirurgical', 'freze'],
  },
  {
    id: 'instr-002',
    slug: 'freza-pilota-2-0',
    code: 'YP-DR-PILOT-2.0',
    name: { ro: 'Freză Pilot ø2.0mm', en: 'Pilot Drill ø2.0mm' },
    category: 'instrumente',
    description: {
      ro: 'Freză pilot din oțel inoxidabil chirurgical. Compatibilă cu toate sistemele standard.',
      en: 'Pilot drill from surgical stainless steel. Compatible with all standard systems.',
    },
    price: 12.0,
    currency: 'USD',
    unit: 'buc',
    image: '/products/freza-pilot.jpg',
    inStock: true,
    featured: false,
    tags: ['freza', 'pilot', 'chirurgical'],
  },
  // --- ESTETICA ---
  {
    id: 'est-001',
    slug: 'composite-nano-a2-4g',
    code: 'YP-COMP-A2-4G',
    name: { ro: 'Composite Nano A2 — 4g', en: 'Nano Composite A2 — 4g' },
    category: 'estetica-dentara',
    description: {
      ro: 'Material composite nanometric pentru restaurări anterioare și posterioare. Nuanță A2.',
      en: 'Nanometric composite material for anterior and posterior restorations. Shade A2.',
    },
    price: 18.5,
    currency: 'USD',
    unit: 'seringă',
    image: '/products/composite-nano.jpg',
    inStock: true,
    featured: false,
    tags: ['composite', 'estetic', 'restaurare', 'nano'],
  },
  // --- STERILIZARE ---
  {
    id: 'ster-001',
    slug: 'pungi-sterilizare-90x260-200buc',
    code: 'YP-STE-BAG-200',
    name: { ro: 'Pungi Sterilizare 90×260mm — 200 buc', en: 'Sterilization Pouches 90×260mm — 200 pcs' },
    category: 'protectie-sterilizare',
    description: {
      ro: 'Pungi autoclav cu indicator de sterilizare integrat. Compatibile cu toate autoclavele clasa B.',
      en: 'Autoclave pouches with integrated sterilization indicator. Compatible with all class B autoclaves.',
    },
    price: 14.0,
    currency: 'USD',
    unit: 'cutie',
    image: '/products/pungi-sterilizare.jpg',
    inStock: true,
    featured: false,
    tags: ['sterilizare', 'autoclave', 'pungi'],
  },
];

export const FEATURED_PRODUCTS = PRODUCTS.filter((p) => p.featured);
