import { MetadataRoute } from 'next';
import { fetchProducts } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tdsupply.ro';

  // Base routes
  const routes = [
    '',
    '/catalog',
    '/autentificare',
    '/cos',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Dynamic product routes
  try {
    const products = await fetchProducts();
    const productRoutes = products.map((p) => ({
      url: `${baseUrl}/produs/${p.slug}`,
      lastModified: new Date(p.updatedAt || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
    return [...routes, ...productRoutes];
  } catch {
    return routes;
  }
}
