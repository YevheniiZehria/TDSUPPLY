import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useUser } from '@/contexts/UserContext';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency, getProductImageUrl, type Product } from '@/lib/api';

interface ProductCardProps {
  product: Product;
  lang: 'ro' | 'en';
}

export default function ProductCard({ product, lang }: ProductCardProps) {
  const name = product.name[lang];
  const desc = product.description[lang];
  const router = useRouter();
  const { user } = useUser();
  const { addItem } = useCart();
  const [showImage, setShowImage] = useState(Boolean(product.image));
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setShowImage(Boolean(product.image));
  }, [product.image]);

  function handleAddToCart(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push(`/autentificare?redirect=/produs/${product.slug}`);
      return;
    }

    addItem(product, lang);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <Link href={`/produs/${product.slug}`} className="product-card">
      {/* Image */}
      <div className="product-image-wrap">
        {showImage ? (
          <Image
            src={getProductImageUrl(product.image)}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="product-image"
            style={{ objectFit: 'cover' }}
            onError={() => setShowImage(false)}
          />
        ) : (
          <div className="product-image-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span>Imagine produs</span>
          </div>
        )}

        {product.inStock && (
          <span className="product-badge badge-stock">
            {lang === 'ro' ? '✓ În stoc' : '✓ In stock'}
          </span>
        )}
        {product.featured && (
          <span className="product-badge badge-featured">
            {lang === 'ro' ? 'Recomandat' : 'Featured'}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="product-body">
        <span className="product-code">{product.code}</span>
        <h3 className="product-name">{name}</h3>
        <p className="product-desc">{desc}</p>
      </div>

      {/* Footer */}
      <div className="product-footer">
        <div className="product-price">
          <span className="price-value">{formatCurrency(product.price, product.currency, lang === 'ro' ? 'ro-RO' : 'en-US')}</span>
          <span className="price-unit">/{product.unit}</span>
        </div>
        <button
          className="btn-add-cart"
          onClick={handleAddToCart}
          aria-label={lang === 'ro' ? 'Adaugă în coș' : 'Add to cart'}
          disabled={!product.inStock}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.98-1.67l1.38-9.39H6"/>
          </svg>
          {added ? (lang === 'ro' ? 'Adăugat' : 'Added') : (lang === 'ro' ? 'Adaugă' : 'Add')}
        </button>
      </div>
    </Link>
  );
}
