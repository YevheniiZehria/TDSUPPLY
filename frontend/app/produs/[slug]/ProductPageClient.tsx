'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { fetchProductBySlug, formatCurrency, getProductImageUrl, getProductVideoUrl, type Product, type ProductVariant } from '@/lib/api';
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
    selectDimension: 'Selectează dimensiunea',
    dimension: 'Dimensiune',
    selectColor: 'Selectează nuanța',
    color: 'Nuanță',
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
    selectDimension: 'Select dimension',
    dimension: 'Dimension',
    selectColor: 'Select shade',
    color: 'Shade',
  },
};

export default function ProductPageClient({ slug }: { slug: string }) {
  const { user } = useUser();
  const { addItem } = useCart();
  const router = useRouter();

  const [lang, setLang] = useState<'ro' | 'en'>('ro');
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [added, setAdded] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');

  const txt = t[lang];

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(false);
    fetchProductBySlug(slug)
      .then((p) => {
        // Sortează variantele în ordine crescătoare după dimensiune
        if (p.variants && p.variants.length > 0) {
          p.variants = [...p.variants].sort((a, b) => {
            const numRegex = /[-+]?[0-9]*\.?[0-9]+/;
            const aMatch = a.label.match(numRegex);
            const bMatch = b.label.match(numRegex);

            if (aMatch && bMatch) {
              const aNum = parseFloat(aMatch[0]);
              const bNum = parseFloat(bMatch[0]);
              if (aNum !== bNum) {
                return aNum - bNum;
              }
            } else if (aMatch) {
              return -1;
            } else if (bMatch) {
              return 1;
            }
            return a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' });
          });
          const firstInStock = p.variants.find(v => v.inStock !== false) || p.variants[0];
          setSelectedVariant(firstInStock);
        } else {
          setSelectedVariant(null);
        }
        setProduct(p);
        setShowImage(Boolean(p.image));
        setActiveImage(p.image ?? '');
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const category = product
    ? CATEGORIES.find(c => c.id === product.category)
    : null;

  // Prețul afișat: varianta selectată sau prețul de bază
  const displayPrice = selectedVariant ? selectedVariant.price : product?.price ?? 0;
  const hasVariants = product?.variants && product.variants.length > 0;
  const hasColors = product?.colors && product.colors.length > 0;

  function handleAddCart() {
    if (!product) return;
    if (hasColors && !selectedColor) return;
    addItem(product, lang, selectedVariant, selectedColor);
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
                  {showImage && activeImage ? (
                    // Folosim <img> simplu (nu Next.js <Image>) deoarece imaginile
                    // uploadate sunt servite prin rewrite-ul Next.js /public/:path* → backend.
                    // Next.js <Image> cu URL relativ caută fişierul în /public local şi eşuează.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getProductImageUrl(activeImage)}
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
                  ) : product.isPreorder ? (
                    <span className="product-detail-badge" style={{ top: product.featured ? 48 : 12, background: '#FFF7ED', color: '#EA580C', border: '1px solid #FED7AA' }}>
                      {lang === 'ro' ? 'Precomandă' : 'Pre-order'}
                    </span>
                  ) : (
                    <span className="product-detail-badge badge-unavailable" style={{ top: product.featured ? 48 : 12, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                      {lang === 'ro' ? '✗ Indisponibil' : '✗ Out of stock'}
                    </span>
                  )}
                </div>

                {/* Galerie miniaturi */}
                {(() => {
                  const galleryImages = [product.image, ...(product.images ?? [])].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
                  if (galleryImages.length <= 1) return null;
                  return (
                    <div style={{ display: 'flex', gap: 10, marginTop: 12, overflowX: 'auto', paddingBottom: 4 }}>
                      {galleryImages.map((imgUrl) => (
                        <button
                          key={imgUrl}
                          type="button"
                          onClick={() => {
                            setActiveImage(imgUrl);
                            setShowImage(true);
                          }}
                          onMouseEnter={() => {
                            setActiveImage(imgUrl);
                            setShowImage(true);
                          }}
                          style={{
                            width: 70,
                            height: 70,
                            borderRadius: 8,
                            border: activeImage === imgUrl ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                            padding: 2,
                            background: 'var(--background)',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            flexShrink: 0,
                            transition: 'border-color 0.2s, transform 0.15s',
                            transform: activeImage === imgUrl ? 'scale(1.05)' : 'scale(1)',
                            outline: 'none',
                          }}
                        >
                          <img
                            src={getProductImageUrl(imgUrl)}
                            alt="Thumbnail"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }}
                          />
                        </button>
                      ))}
                    </div>
                  );
                })()}
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

                {/* Selector variante dimensiune */}
                {hasVariants && (
                  <div className="product-variants-section">
                    <p className="product-variants-label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6, verticalAlign: 'middle' }}>
                        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                      </svg>
                      {txt.selectDimension}:
                    </p>
                    <div className="product-variants-grid">
                      {product.variants!.map((v) => {
                        const isUnavailable = v.inStock === false && v.isPreorder === false;
                        const isPreorder = v.inStock === false && v.isPreorder === true;
                        return (
                          <button
                            key={v.label}
                            type="button"
                            className={`product-variant-btn ${selectedVariant?.label === v.label ? 'selected' : ''}`}
                            onClick={() => !isUnavailable && setSelectedVariant(v)}
                            disabled={isUnavailable}
                            style={isUnavailable ? {
                              opacity: 0.4,
                              cursor: 'not-allowed',
                            } : undefined}
                          >
                            <span className="variant-label" style={isUnavailable ? { textDecoration: 'line-through' } : undefined}>{v.label}</span>
                            <span className="variant-price" style={isUnavailable ? { textDecoration: 'line-through' } : undefined}>
                              {formatCurrency(v.price, product.currency, lang === 'ro' ? 'ro-RO' : 'en-US')}
                            </span>
                            {isUnavailable ? (
                              <span style={{ fontSize: 9, display: 'block', marginTop: 2, color: 'var(--danger)' }}>
                                {lang === 'ro' ? 'indisponibil' : 'unavailable'}
                              </span>
                            ) : isPreorder ? (
                              <span style={{ fontSize: 9, display: 'block', marginTop: 2, color: '#EA580C' }}>
                                {lang === 'ro' ? 'precomandă' : 'pre-order'}
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Selector culori */}
                {hasColors && (
                  <div className="product-variants-section" style={{ marginTop: 24 }}>
                    <p className="product-variants-label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6, verticalAlign: 'middle' }}>
                        <circle cx="12" cy="12" r="10"/>
                        <circle cx="12" cy="12" r="6"/>
                        <circle cx="12" cy="12" r="2"/>
                      </svg>
                      {txt.selectColor}:
                    </p>
                    <div className="product-variants-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))' }}>
                      {product.colors!.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={`product-variant-btn ${selectedColor === c ? 'selected' : ''}`}
                          onClick={() => setSelectedColor(c)}
                          style={{ padding: '8px 12px' }}
                        >
                          <span className="variant-label">{c}</span>
                        </button>
                      ))}
                    </div>
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
                  {hasVariants && selectedVariant && (
                    <div className="product-meta-row">
                      <span>{txt.dimension}</span>
                      <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{selectedVariant.label}</span>
                    </div>
                  )}
                  {hasColors && selectedColor && (
                    <div className="product-meta-row">
                      <span>{txt.color}</span>
                      <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{selectedColor}</span>
                    </div>
                  )}
                  <div className="product-meta-row">
                    <span>{txt.price}</span>
                    <span className="product-meta-price" style={{ transition: 'color 0.2s' }}>
                      {formatCurrency(displayPrice, product.currency, lang === 'ro' ? 'ro-RO' : 'en-US')} <small>/ {product.unit}</small>
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <div className="product-detail-ctas">
                  <button
                    className={`product-cta-primary ${added ? 'added' : ''}`}
                    onClick={handleAddCart}
                    disabled={(selectedVariant ? (selectedVariant.inStock === false && selectedVariant.isPreorder === false) : (!product.inStock && !product.isPreorder)) || (hasColors && !selectedColor)}
                    style={{ opacity: ((selectedVariant ? (selectedVariant.inStock === false && selectedVariant.isPreorder === false) : (!product.inStock && !product.isPreorder)) || (hasColors && !selectedColor)) ? 0.5 : 1, cursor: ((selectedVariant ? (selectedVariant.inStock === false && selectedVariant.isPreorder === false) : (!product.inStock && !product.isPreorder)) || (hasColors && !selectedColor)) ? 'not-allowed' : 'pointer' }}
                  >
                    {added ? (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                        {lang === 'ro' ? 'Adăugat!' : 'Added!'}
                      </>
                    ) : (selectedVariant ? (selectedVariant.inStock === false && selectedVariant.isPreorder === false) : (!product.inStock && !product.isPreorder)) ? (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                          <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.98-1.67l1.38-9.39H6"/>
                        </svg>
                        {lang === 'ro' ? 'Indisponibil' : 'Unavailable'}
                      </>
                    ) : (selectedVariant ? (selectedVariant.inStock === false && selectedVariant.isPreorder === true) : (!product.inStock && product.isPreorder)) ? (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                          <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.98-1.67l1.38-9.39H6"/>
                        </svg>
                        {lang === 'ro' ? 'Precomandă' : 'Pre-order'}
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                          <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.98-1.67l1.38-9.39H6"/>
                        </svg>
                        {txt.addCart}
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
