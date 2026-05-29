const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface ProductName { ro: string; en: string; }
export interface Product {
  id: string; slug: string; code: string;
  name: ProductName; category: string;
  description: ProductName;
  price: number; currency: string; unit: string;
  image: string; video?: string; inStock: boolean; featured: boolean;
  tags: string[]; createdAt: string; updatedAt: string;
}
export interface ProductStats {
  total: number; inStock: number; outOfStock: number;
  featured: number; byCategory: Record<string, number>;
}

export function formatCurrency(
  amount: number,
  currency: string,
  locale: string = 'ro-RO',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getProductImageUrl(imagePath?: string | null): string {
  if (!imagePath) return '';
  // URL-uri externe absolute (http/https) — returnăm neatinse
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  // Cale relativă (ex: /public/products/img.jpg) — returnăm relativ, Next.js rewrite
  // /public/:path* → http://localhost:3001/public/:path* se va ocupa de redirecționare.
  // Evităm Next.js <Image> optimization care dă 400 din cauza remotePatterns.
  return imagePath;
}

// Video-urile au nevoie de HTTP Range Requests pentru streaming/seeking.
// Proxy-ul Next.js (rewrites) nu le suportă corect, deci folosim URL-ul direct al backend-ului.
const BACKEND_DIRECT = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function getProductVideoUrl(videoPath?: string | null): string {
  if (!videoPath) return '';
  // URL-uri externe (YouTube, https) — le returnăm neatinse
  if (videoPath.startsWith('http://') || videoPath.startsWith('https://')) return videoPath;
  // Cale relativă (ex: /public/products/file.mp4) — construim URL direct la backend
  return `${BACKEND_DIRECT}${videoPath}`;
}

export async function fetchProducts(params?: { category?: string; featured?: boolean; q?: string }): Promise<Product[]> {
  const qs = new URLSearchParams();
  if (params?.category) qs.set('category', params.category);
  if (params?.featured !== undefined) qs.set('featured', String(params.featured));
  if (params?.q) qs.set('q', params.q);
  const res = await fetch(`${BASE}/products?${qs}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json() as Promise<Product[]>;
}

export async function fetchProductBySlug(slug: string): Promise<Product> {
  const res = await fetch(`${BASE}/products/${slug}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Product not found');
  return res.json() as Promise<Product>;
}

export async function fetchProductById(id: string): Promise<Product> {
  const res = await fetch(`${BASE}/products/id/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Product not found');
  return res.json() as Promise<Product>;
}

/** Comenzi */
export async function createOrder(data: {
  items: { id: string; quantity: number }[];
  deliveryAddress: {
    strada: string;
    bloc?: string;
    oras: string;
    judet: string;
    codPostal: string;
    observatii?: string;
  };
}): Promise<any> {
  const token = localStorage.getItem('user_token');
  const payload = {
    items: data.items.map(item => ({
      id: item.id,
      quantity: item.quantity,
    })),
    deliveryAddress: data.deliveryAddress,
  };

  const res = await fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create order');
  return res.json();
}

export async function fetchMyOrders(): Promise<any[]> {
  const token = localStorage.getItem('user_token');
  const res = await fetch(`${BASE}/orders/my`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

export interface SiteSettings {
  phone: string;
  email: string;
  address: string;
  workingHours: string;
  facebookUrl: string;
  instagramUrl: string;
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const res = await fetch(`${BASE}/settings`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json() as Promise<SiteSettings>;
}

export interface SiteStats {
  totalProducts: number;
  inStock: number;
  totalUsers: number;
}

export async function fetchSiteStats(): Promise<SiteStats> {
  try {
    const [statsRes, usersRes] = await Promise.all([
      fetch(`${BASE}/products/stats`, { cache: 'no-store' }),
      fetch(`${BASE}/auth/stats`, { cache: 'no-store' }),
    ]);
    const productStats = statsRes.ok ? (await statsRes.json() as ProductStats) : null;
    const userStats = usersRes.ok ? (await usersRes.json() as { totalUsers: number }) : null;
    return {
      totalProducts: productStats?.total ?? 0,
      inStock: productStats?.inStock ?? 0,
      totalUsers: userStats?.totalUsers ?? 0,
    };
  } catch {
    return { totalProducts: 0, inStock: 0, totalUsers: 0 };
  }
}

