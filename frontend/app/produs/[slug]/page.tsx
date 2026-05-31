import type { Metadata } from 'next';
import ProductPageClient from './ProductPageClient';
import { fetchProductBySlug } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await fetchProductBySlug(slug);
    return {
      title: `${product.name.ro} | TD Supply`,
      description: product.description.ro.length > 160
        ? `${product.description.ro.substring(0, 157)}...`
        : product.description.ro,
      openGraph: {
        title: product.name.ro,
        description: product.description.ro,
        images: product.image ? [{ url: product.image }] : [],
      },
    };
  } catch {
    return {
      title: 'Detalii Produs | TD Supply',
      description: 'Echipamente și consumabile stomatologice premium cu livrare rapidă în toată România.',
    };
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProductPageClient slug={slug} />;
}
