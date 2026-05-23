'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { useCart } from '@/contexts/CartContext';
import { CATEGORIES } from '@/data/catalog';
import CartDrawer from './CartDrawer';
import { fetchSiteSettings, type SiteSettings } from '@/lib/api';

interface HeaderProps {
  lang: 'ro' | 'en';
  onLangChange: (l: 'ro' | 'en') => void;
}

const t = {
  ro: {
    phone: '(+4) 0330 111 222',
    email: 'dentaltdsupply@gmail.com',
    search: 'Caută produse, coduri, categorii...',
    login: 'Conectare B2B',
    logout: 'Deconectare',
    myAccount: 'Contul meu',
    catalog: 'Catalog',
  },
  en: {
    phone: '(+4) 0330 111 222',
    email: 'dentaltdsupply@gmail.com',
    search: 'Search products, codes, categories...',
    login: 'B2B Login',
    logout: 'Sign out',
    myAccount: 'My account',
    catalog: 'Catalog',
  },
};

function HeaderContent({ lang, onLangChange }: HeaderProps) {
  const txt = t[lang];
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, logout, loading } = useUser();
  const { count, openDrawer } = useCart();
  const router = useRouter();
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    fetchSiteSettings()
      .then(setSettings)
      .catch(() => {});
  }, []);

  // Sync search input with URL
  useEffect(() => {
    setSearch(searchParams.get('q') ?? '');
  }, [searchParams]);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  function handleLogout() {
    logout();
    setUserMenuOpen(false);
    router.push('/');
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    const params = new URLSearchParams(searchParams.toString());
    
    if (q) {
      params.set('q', q);
    } else {
      params.delete('q');
    }

    if (pathname === '/catalog') {
      router.replace(`/catalog?${params.toString()}`);
    } else {
      router.push(`/catalog?${params.toString()}`);
    }
  }

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div className="container">
          <div className="topbar-left">
            <a href={`tel:${settings?.phone ?? txt.phone}`} className="topbar-contact">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.77 1.22 2 2 0 012.76 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.73a16 16 0 006.29 6.29l1.09-1.09a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
              </svg>
              {settings?.phone ?? txt.phone}
            </a>
            <a href={`mailto:${settings?.email ?? txt.email}`} className="topbar-contact">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              {settings?.email ?? txt.email}
            </a>
          </div>
          <div className="topbar-right">
            <div className="lang-switcher">
              <button className={`lang-btn ${lang === 'ro' ? 'active' : ''}`} onClick={() => onLangChange('ro')}>RO</button>
              <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => onLangChange('en')}>EN</button>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="header">
        <div className="container">
          <div className="header-inner">
            <Link href="/" className="header-logo">
              <img src="/logo-td-supply.png" alt="TD Supply" />
            </Link>

            <form className="header-search" onSubmit={handleSearchSubmit}>
              <div className="search-input-wrap">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input
                  id="search-input"
                  type="text"
                  className="search-input"
                  placeholder={txt.search}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </form>

            <div className="header-actions">
              {/* Cart button */}
              <button
                className="btn-cart"
                aria-label="Coș"
                onClick={openDrawer}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.98-1.67l1.38-9.39H6"/>
                </svg>
                <span className="cart-badge">{count}</span>
              </button>

              {/* User auth button */}
              {loading ? null : user ? (
                /* ─── Utilizator logat ─── */
                <div className="user-menu-wrap" style={{ position: 'relative' }} ref={userMenuRef}>
                  <button
                    id="btn-user-menu"
                    className="btn-user-logged"
                    onClick={() => setUserMenuOpen(v => !v)}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                  >
                    <div className="user-avatar-sm">
                      {user.email[0].toUpperCase()}
                    </div>
                    <span className="user-name-sm">
                      {user.name ?? user.email.split('@')[0]}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                      style={{ transition: 'transform .2s', transform: userMenuOpen ? 'rotate(180deg)' : 'none' }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>

                  {userMenuOpen && (
                    <div className="user-dropdown">
                      <div className="user-dropdown-info">
                        <div className="user-dropdown-email">{user.email}</div>
                        <div className="user-dropdown-role">Client B2B</div>
                      </div>
                      <div className="user-dropdown-divider" />
                      <button className="user-dropdown-item logout" id="btn-logout" onClick={handleLogout}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                          <polyline points="16 17 21 12 16 7"/>
                          <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        {txt.logout}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* ─── Neautentificat ─── */
                <Link href="/autentificare" className="btn-login" id="btn-header-login">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  {txt.login}
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="nav-bar">
        <div className="container">
          <div className="nav-inner">
            <Link href="/catalog" className="nav-item" style={{fontWeight: 700}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
              {txt.catalog}
            </Link>
            {CATEGORIES.map((cat) => (
              <Link key={cat.id} href={`/catalog?cat=${cat.id}`} className="nav-item">
                <span className="nav-icon">{cat.icon}</span>
                {cat.name[lang]}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <CartDrawer lang={lang} />
    </>
  );
}

export default function Header(props: HeaderProps) {
  return (
    <Suspense fallback={
      <header className="header" style={{ minHeight: '80px', display: 'flex', alignItems: 'center' }}>
        <div className="container">
          <div className="header-inner">
            <Link href="/" className="header-logo">
              <img src="/logo-td-supply.png" alt="TD Supply" />
            </Link>
            <div style={{ flex: 1 }} />
          </div>
        </div>
      </header>
    }>
      <HeaderContent {...props} />
    </Suspense>
  );
}
