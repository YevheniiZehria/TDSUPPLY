'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { fetchProductBySlug, formatCurrency, getProductImageUrl, getProductVideoUrl, type Product } from '@/lib/api';
import { CATEGORIES } from '@/data/catalog';
import { useUser } from '@/contexts/UserContext';
import { useCart } from '@/contexts/CartContext';

const t = {
  ro: {
    breadcrumbHome: 'Acasă', breadcrumbCatalog: 'Catalog',
    inStock: '✓ În stoc', outOfStock: '✗ Stoc epuizat',
    code: 'Cod produs', category: 'Categorie', unit: 'Unitate',
    tags: 'Tag-uri', price: 'Preț',
    addCart: 'Adaugă în coș', requestOffer: 'Solicită ofertă',
    back: 'Înapoi la catalog',
    notFound: 'Produsul nu a fost găsit.',
    loading: 'Se încarcă produsul...',
    featured: 'Recomandat',
  },
  en: {
    breadcrumbHome: 'Home', breadcrumbCatalog: 'Catalog',
    inStock: '✓ In stock', outOfStock: '✗ Out of stock',
    code: 'Product code', category: 'Category', unit: 'Unit',
    tags: 'Tags', price: 'Price',
    addCart: 'Add to cart', requestOffer: 'Request offer',
    back: 'Back to catalog',
    notFound: 'Product not found.',
    loading: 'Loading product...',
    featured: 'Featured',
  },
};

export default function ProductPage() {
  const params = useParams();
  const { user } = useUser();
  const { addItem } = useCart();
  const router = useRouter();
  const slug = params?.slug as string;

  const [lang, setLang] = useState<'ro' | 'en'>('ro');
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [added, setAdded] = useState(false);
  const [showImage, setShowImage] = useState(false);

  const txt = t[lang];

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(false);
    fetchProductBySlug(slug)
      .then((p) => {
        setProduct(p);
        setShowImage(Boolean(p.image));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const category = product
    ? CATEGORIES.find(c => c.id === product.category)
    : null;

  function handleAddCart() {
    if (!product) return;
    if (!user) {
      // Redirect la login cu returnare la acest produs
      router.push(`/autentificare?redirect=/produs/${slug}`);
      return;
    }
    addItem(product, lang);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <>
      <Header lang={lang} onLangChange={setLang} />
      <main style={{ minHeight: '60vh', paddingBottom: 64 }}>
        <div className="container" style={{ paddingTop: 32 }}>

          {/* Breadcrumb */}
          <nav className="breadcrumb" aria-label="breadcrumb">
            <Link href="/">{txt.breadcrumbHome}</Link>
            <span className="breadcrumb-sep">›</span>
            <Link href="/catalog">{txt.breadcrumbCatalog}</Link>
            {category && (
              <>
                <span className="breadcrumb-sep">›</span>
                <Link href={`/catalog?cat=${category.slug}`}>{category.name[lang]}</Link>
              </>
            )}
            {product && (
              <>
                <span className="breadcrumb-sep">›</span>
                <span className="breadcrumb-current">{product.name[lang]}</span>
              </>
            )}
          </nav>

          {/* Loading */}
          {loading && (
            <div className="product-detail-loading">
              <div className="login-spinner" style={{ width: 36, height: 36, borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
              <p>{txt.loading}</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="product-detail-error">
              <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
              <h1>{txt.notFound}</h1>
              <Link href="/catalog" className="btn-primary" style={{ display: 'inline-flex', marginTop: 24, color: 'var(--primary)', background: 'var(--surface-2)' }}>
                ← {txt.back}
              </Link>
            </div>
          )}

          {/* Product detail */}
          {product && !loading && (
            <>
              <div className="product-detail-grid">
              {/* Left — imagine */}
              <div className="product-detail-image-col">
                <div className="product-detail-image-wrap">
                  {showImage ? (
                    // Folosim <img> simplu (nu Next.js <Image>) deoarece imaginile
                    // uploadate sunt servite prin rewrite-ul Next.js /public/:path* → backend.
                    // Next.js <Image> cu URL relativ caută fişierul în /public local şi eşuează.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getProductImageUrl(product.image)}
                      alt={product.name[lang]}
                      className="product-detail-image"
                      style={{ objectFit: 'cover', width: '100%', height: '100%', position: 'absolute', inset: 0 }}
                      onError={() => setShowImage(false)}
                    />
                  ) : (
                    <div className="product-detail-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                      <span>{product.name[lang]}</span>
                    </div>
                  )}
                  {product.featured && (
                    <span className="product-detail-badge badge-featured">{txt.featured}</span>
                  )}
                  {product.inStock ? (
                    <span className="product-detail-badge badge-stock" style={{ top: product.featured ? 48 : 12 }}>{txt.inStock}</span>
                  ) : (
                    <span className="product-detail-badge" style={{ top: product.featured ? 48 : 12, background: '#FEF2F2', color: 'var(--danger)' }}>{txt.outOfStock}</span>
                  )}
                </div>
              </div>

              {/* Right — info */}
              <div className="product-detail-info-col">
                <span className="section-eyebrow">{category?.name[lang]}</span>
                <h1 className="product-detail-title">{product.name[lang]}</h1>
                <p className="product-detail-code">{txt.code}: <strong>{product.code}</strong></p>
                <p className="product-detail-desc">{product.description[lang]}</p>

                {/* Tags */}
                {product.tags.length > 0 && (
                  <div className="product-detail-tags">
                    {product.tags.map(tag => (
                      <span key={tag} className="product-tag">{tag}</span>
                    ))}
                  </div>
                )}

                {/* Meta table */}
                <div className="product-detail-meta">
                  <div className="product-meta-row">
                    <span>{txt.category}</span>
                    <span>{category?.name[lang] ?? product.category}</span>
                  </div>
                  <div className="product-meta-row">
                    <span>{txt.unit}</span>
                    <span>{product.unit}</span>
                  </div>
                  <div className="product-meta-row">
                    <span>{txt.price}</span>
                    <span className="product-meta-price">
                      {formatCurrency(product.price, product.currency, lang === 'ro' ? 'ro-RO' : 'en-US')} <small>/ {product.unit}</small>
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <div className="product-detail-ctas">
                  <button
                    className={`product-cta-primary ${added ? 'added' : ''}`}
                    onClick={handleAddCart}
                    disabled={!product.inStock}
                    title={!user ? 'Trebuie să fii autentificat pentru a comanda' : ''}
                  >
                    {added ? (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                        Adăugat!
                      </>
                    ) : user ? (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                          <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.98-1.67l1.38-9.39H6"/>
                        </svg>
                        {txt.addCart}
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/>
                          <polyline points="10 17 15 12 10 7"/>
                          <line x1="15" y1="12" x2="3" y2="12"/>
                        </svg>
                        Autentifică-te pentru a comanda
                      </>
                    )}
                  </button>
                  <a href="mailto:dentaltdsupply@gmail.com" className="product-cta-secondary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    {txt.requestOffer}
                  </a>
                </div>

                <Link href="/catalog" className="product-detail-back">
                  ← {txt.back}
                </Link>
              </div>
            </div>

            {/* Video Prezentare */}
            {product.video && (
              <div className="product-video-section animate-in">
                <h2 className="product-video-title">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--primary)', marginRight: 8 }}>
                    <polygon points="23 7 16 12 23 17 23 7"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                  {lang === 'ro' ? 'Prezentare Video' : 'Video Presentation'}
                </h2>
                <div className="product-video-wrapper">
                  {product.video.includes('youtube.com') || product.video.includes('youtu.be') ? (
                    (() => {
                      let videoId = '';
                      if (product.video.includes('youtu.be/')) {
                        videoId = product.video.split('youtu.be/')[1]?.split(/[?#]/)[0] || '';
                      } else if (product.video.includes('embed/')) {
                        videoId = product.video.split('embed/')[1]?.split(/[?#]/)[0] || '';
                      } else if (product.video.includes('v=')) {
                        videoId = product.video.split('v=')[1]?.split(/[&?#]/)[0] || '';
                      }
                      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
                      return (
                        <iframe
                          src={embedUrl}
                          title="YouTube video player"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          style={{ width: '100%', height: '100%' }}
                        />
                      );
                    })()
                  ) : (
                    <video
                      src={getProductVideoUrl(product.video)}
                      controls
                      preload="metadata"
                      className="product-video-element"
                    />
                  )}
                </div>
              </div>
            )}
          </>
        )}
        </div>
      </main>
      <Footer lang={lang} />
    </>
  );
}
