'use client';

import { useState, useMemo, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { CATEGORIES } from '@/data/catalog';
import { fetchProducts, type Product } from '@/lib/api';

const t = {
  ro: {
    title: 'Catalog Produse',
    subtitle: 'Toată gama de materiale stomatologice premium',
    allCat: 'Toate categoriile',
    filters: 'Categorii',
    sort: 'Sortare',
    sortOptions: ['Relevanță', 'Preț crescător', 'Preț descrescător', 'Cod produs'],
    resultsPrefix: 'Se afișează',
    resultsSuffix: 'produse',
    noResults: 'Niciun produs găsit pentru filtrele selectate.',
    searchLabel: 'Caută în catalog',
  },
  en: {
    title: 'Product Catalog',
    subtitle: 'Full range of premium dental materials',
    allCat: 'All categories',
    filters: 'Categories',
    sort: 'Sort by',
    sortOptions: ['Relevance', 'Price: low to high', 'Price: high to low', 'Product code'],
    resultsPrefix: 'Showing',
    resultsSuffix: 'products',
    noResults: 'No products found for the selected filters.',
    searchLabel: 'Search catalog',
  },
};

function CatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lang, setLang] = useState<'ro' | 'en'>('ro');
  const [sortBy, setSortBy] = useState('relevance');
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const activeCategory = searchParams.get('cat') ?? 'all';
  const queryQ = searchParams.get('q') ?? '';

  const setActiveCategory = (cat: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat === 'all') {
      params.delete('cat');
    } else {
      params.set('cat', cat);
    }
    router.push(`/catalog?${params.toString()}`);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    // Sync with URL for back-button and sharing
    const params = new URLSearchParams(searchParams.toString());
    if (val.trim()) {
      params.set('q', val);
    } else {
      params.delete('q');
    }
    // Folosim replace pentru a nu aglomera istoricul la fiecare tastă
    router.replace(`/catalog?${params.toString()}`, { scroll: false });
  };

  const txt = t[lang];

  useEffect(() => {
    setSearch(queryQ);
  }, [queryQ]);

  useEffect(() => {
    setLoadingProducts(true);
    // Fetch products based on search query only, so category counts remain accurate across all categories
    fetchProducts({ q: queryQ })
      .then(setAllProducts)
      .catch(console.error)
      .finally(() => setLoadingProducts(false));
  }, [queryQ]);

  const filtered = useMemo(() => {
    let list = [...allProducts];
    
    // Filtrare după categoria activă pe front-end pentru a nu pierde contorizarea celorlalte categorii în sidebar
    if (activeCategory !== 'all') {
      list = list.filter(p => p.category === activeCategory);
    }
    
    if (sortBy === 'price-asc') list.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') list.sort((a, b) => b.price - a.price);
    if (sortBy === 'code') list.sort((a, b) => a.code.localeCompare(b.code));
    return list;
  }, [allProducts, activeCategory, sortBy]);

  const catCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allProducts.length };
    CATEGORIES.forEach(cat => {
      counts[cat.id] = allProducts.filter(p => p.category === cat.id).length;
    });
    return counts;
  }, [allProducts]);

  return (
    <>
      <Header lang={lang} onLangChange={setLang} />
      <main style={{ padding: '32px 0 0' }}>
        <div className="container">
          <div style={{ marginBottom: '28px' }}>
            <span className="section-eyebrow">{txt.title}</span>
            <h1 className="section-title" style={{ fontSize: '1.8rem', marginTop: '4px' }}>
              {txt.subtitle}
            </h1>
          </div>

          <div style={{ marginBottom: '24px', maxWidth: '500px' }}>
            <div className="search-input-wrap">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                id="catalog-search"
                type="text"
                className="search-input"
                placeholder={txt.searchLabel}
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
              />
            </div>
          </div>

          <div className="catalog-layout">
            <aside className="sidebar">
              <div className="sidebar-title">{txt.filters}</div>
              <ul className="filter-list">
                <li
                  className={`filter-item ${activeCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('all')}
                  id="filter-all"
                >
                  <span>{txt.allCat}</span>
                  <span className="filter-count">{catCounts.all}</span>
                </li>
                {CATEGORIES.map(cat => (
                  <li
                    key={cat.id}
                    className={`filter-item ${activeCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat.id)}
                    id={`filter-${cat.id}`}
                  >
                    <span>{cat.icon} {cat.name[lang]}</span>
                    <span className="filter-count">{catCounts[cat.id] ?? 0}</span>
                  </li>
                ))}
              </ul>
            </aside>

            <div>
              <div className="catalog-toolbar">
                <span className="catalog-count">
                  {txt.resultsPrefix} <strong>{loadingProducts ? '...' : filtered.length}</strong> {txt.resultsSuffix}
                </span>
                <select
                  id="catalog-sort"
                  className="sort-select"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                >
                  {['relevance', 'price-asc', 'price-desc', 'code'].map((v, i) => (
                    <option key={v} value={v}>{txt.sortOptions[i]}</option>
                  ))}
                </select>
              </div>

              {loadingProducts ? (
                <div className="products-grid">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="product-card" style={{ minHeight: 280, background: 'var(--surface-2)' }} />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                  <p>{txt.noResults}</p>
                </div>
              ) : (
                <div className="products-grid">
                  {filtered.map(product => (
                    <ProductCard key={product.id} product={product} lang={lang} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer lang={lang} />
    </>
  );
}

export default function CatalogPage() {
  return (
    <Suspense>
      <CatalogContent />
    </Suspense>
  );
}
