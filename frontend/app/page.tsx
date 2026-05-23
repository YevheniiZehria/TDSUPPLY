'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { CATEGORIES } from '@/data/catalog';
import { fetchProducts, fetchSiteStats, type Product, type SiteStats } from '@/lib/api';

const t = {
  ro: {
    heroBadge: 'Distribuitor B2B Certificat',
    h1a: 'Furnizor Premium de',
    h1b: 'Materiale Dentare',
    sub: 'Implanturi, instrumente chirurgicale și materiale de restaurare de cea mai înaltă calitate pentru cabinete și clinici stomatologice din România.',
    cta1: 'Explorează Catalogul',
    cta2: 'Contactează-ne',
    stat1l: 'Produse în catalog',
    stat2l: 'Parteneri înregistrați',
    stat3n: '15', stat3l: 'Ani experiență',
    stat4n: '48h', stat4l: 'Livrare medie',
    categoriesEyebrow: 'Categorii',
    categoriesTitle: 'Toată gama de produse',
    categoriesSub: 'De la implanturi la materiale de restaurare — tot ce ai nevoie',
    viewAll: 'Vezi toate',
    featuredEyebrow: 'Produse recomandate',
    featuredTitle: 'Selecția editorială',
    featuredSub: 'Cele mai comandate produse din catalogul nostru',
    trustDelivery: 'Livrare Rapidă',
    trustDeliveryDesc: '48h în toată România',
    trustCert: 'Produse Certificate',
    trustCertDesc: 'CE, ISO 13485',
    trustSupport: 'Suport Tehnic',
    trustSupportDesc: 'Consultanță specializată',
    trustReturn: 'Returnare 30 zile',
    trustReturnDesc: 'Fără complicații',
    logoTagline: 'Dental Solutions',
  },
  en: {
    heroBadge: 'Certified B2B Distributor',
    h1a: 'Premium Supplier of',
    h1b: 'Dental Materials',
    sub: 'Implants, surgical instruments and restorative materials of the highest quality for dental offices and clinics.',
    cta1: 'Explore Catalog',
    cta2: 'Contact Us',
    stat1l: 'Products in catalog',
    stat2l: 'Registered partners',
    stat3n: '15', stat3l: 'Years experience',
    stat4n: '48h', stat4l: 'Average delivery',
    categoriesEyebrow: 'Categories',
    categoriesTitle: 'Full product range',
    categoriesSub: 'From implants to restorative materials — everything you need',
    viewAll: 'View all',
    featuredEyebrow: 'Featured products',
    featuredTitle: 'Editorial selection',
    featuredSub: 'Most ordered products from our catalog',
    trustDelivery: 'Fast Delivery',
    trustDeliveryDesc: '48h across Romania',
    trustCert: 'Certified Products',
    trustCertDesc: 'CE, ISO 13485',
    trustSupport: 'Technical Support',
    trustSupportDesc: 'Specialized consulting',
    trustReturn: '30-day Returns',
    trustReturnDesc: 'No complications',
    logoTagline: 'Dental Solutions',
  },
};

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) return;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, duration]);

  return count;
}

function AnimatedStat({ value, suffix = '' }: { value: number; suffix?: string }) {
  const count = useCountUp(value);
  return <>{count > 0 ? `${count}${suffix}` : '—'}</>;
}

export default function HomePage() {
  const [lang, setLang] = useState<'ro' | 'en'>('ro');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [siteStats, setSiteStats] = useState<SiteStats | null>(null);
  const txt = t[lang];

  useEffect(() => {
    fetchProducts()
      .then((products) => {
        setAllProducts(products);
        const feat = products.filter((product) => product.featured);
        setFeatured(feat.length > 0 ? feat.slice(0, 4) : products.slice(0, 4));
      })
      .catch(() => {/* fallback silențios */});

    // Statistici în timp real
    const loadStats = () => fetchSiteStats().then(setSiteStats).catch(() => {});
    loadStats();
    const interval = setInterval(loadStats, 60_000);
    return () => clearInterval(interval);
  }, []);

  const categoryCounts = allProducts.reduce<Record<string, number>>((counts, product) => {
    counts[product.category] = (counts[product.category] ?? 0) + 1;
    return counts;
  }, {});

  return (
    <>
      <Header lang={lang} onLangChange={setLang} />

      <main>
        {/* ── HERO ─────────────────────────────────────────── */}
        <section className="hero">
          <div className="container">
            <div className="hero-inner">
              <div className="hero-content animate-in">
                <div className="hero-badge">
                  <span className="hero-badge-dot"></span>
                  {txt.heroBadge}
                </div>
                <h1>
                  {txt.h1a}<br />
                  <span>{txt.h1b}</span>
                </h1>
                <p className="hero-sub">{txt.sub}</p>
                <div className="hero-ctas">
                  <Link href="/catalog" className="btn-primary" id="cta-catalog">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                    </svg>
                    {txt.cta1}
                  </Link>
                  <a href="#contact" className="btn-ghost" id="cta-contact">
                    {txt.cta2}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </a>
                </div>

                <div className="hero-stats">
                  <div className="stat-item">
                    <div className="stat-number">
                      {siteStats ? <AnimatedStat value={siteStats.totalProducts} /> : '—'}
                    </div>
                    <div className="stat-label">{txt.stat1l}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">
                      {siteStats ? <AnimatedStat value={siteStats.totalUsers} /> : '—'}
                    </div>
                    <div className="stat-label">{txt.stat2l}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{txt.stat3n}</div>
                    <div className="stat-label">{txt.stat3l}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{txt.stat4n}</div>
                    <div className="stat-label">{txt.stat4l}</div>
                  </div>
                </div>
              </div>

              {/* Logo float */}
              <div className="hero-visual animate-in animate-in-delay-2">
                <div className="hero-logo-wrap">
                  <img src="/logo-td-supply.png" alt="TD Supply" />
                  <span className="hero-logo-tagline">{txt.logoTagline}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── TRUST BAR ────────────────────────────────────── */}
        <div className="trust-bar">
          <div className="container">
            <div className="trust-grid">
              {[
                {
                  label: txt.trustDelivery, desc: txt.trustDeliveryDesc,
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
                },
                {
                  label: txt.trustCert, desc: txt.trustCertDesc,
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
                },
                {
                  label: txt.trustSupport, desc: txt.trustSupportDesc,
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
                },
                {
                  label: txt.trustReturn, desc: txt.trustReturnDesc,
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>,
                },
              ].map((item, i) => (
                <div className="trust-item" key={i}>
                  <div className="trust-icon">{item.icon}</div>
                  <div>
                    <div className="trust-label">{item.label}</div>
                    <div className="trust-desc">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CATEGORIES ───────────────────────────────────── */}
        <section className="section">
          <div className="container">
            <div className="section-header">
              <div className="section-title-group">
                <span className="section-eyebrow">{txt.categoriesEyebrow}</span>
                <h2 className="section-title">{txt.categoriesTitle}</h2>
                <p className="section-sub">{txt.categoriesSub}</p>
              </div>
              <Link href="/catalog" className="view-all-link" id="categories-view-all">
                {txt.viewAll}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>

            <div className="categories-grid">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/catalog?cat=${cat.slug}`}
                  className="category-card"
                  id={`cat-${cat.slug}`}
                >
                  <span className="category-icon">{cat.icon}</span>
                  <div className="category-name">{cat.name[lang]}</div>
                  <div className="category-count">
                    {categoryCounts[cat.id] ?? 0} {lang === 'ro' ? 'produse' : 'products'}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURED PRODUCTS ────────────────────────────── */}
        <section className="section" style={{ background: 'var(--card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="container">
            <div className="section-header">
              <div className="section-title-group">
                <span className="section-eyebrow">{txt.featuredEyebrow}</span>
                <h2 className="section-title">{txt.featuredTitle}</h2>
                <p className="section-sub">{txt.featuredSub}</p>
              </div>
              <Link href="/catalog" className="view-all-link" id="featured-view-all">
                {txt.viewAll}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>

            <div className="products-grid products-grid-4">
              {featured.length === 0
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="product-card" style={{ minHeight: 280, background: 'var(--surface-2)', animation: 'pulse 1.5s ease infinite' }} />
                  ))
                : featured.map((product) => (
                    <ProductCard key={product.id} product={product} lang={lang} />
                  ))
              }
            </div>
          </div>
        </section>
      </main>

      <Footer lang={lang} />
    </>
  );
}
