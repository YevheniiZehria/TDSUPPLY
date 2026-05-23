'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { adminGetMe } from '@/lib/adminApi';

interface AdminInfo { email: string; role: string; }

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  )},
  { href: '/admin/products', label: 'Produse', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  )},
  { href: '/admin/products/new', label: '+ Produs nou', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  ), accent: true },
  { href: '/admin/orders', label: 'Comenzi', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
    </svg>
  )},
  { href: '/admin/settings', label: 'Setări site', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  )},
];

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    adminGetMe()
      .then(info => {
        // Verificare suplimentară de rol pentru securitate pe frontend
        if (info.role !== 'admin' && info.role !== 'superadmin') {
          throw new Error('UNAUTHORIZED');
        }
        setAdmin(info);
      })
      .catch(err => {
        const msg = (err as Error).message;
        if (msg === 'UNAUTHORIZED' || msg.includes('403') || msg.includes('401')) {
          localStorage.removeItem('admin_token');
          router.push('/login');
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  function handleLogout() {
    localStorage.removeItem('admin_token');
    router.push('/login');
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0f172a' }}>
        <div className="login-spinner" style={{ width: 36, height: 36, borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#38bdf8' }} />
      </div>
    );
  }

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="admin-sidebar-header">
          <Link href="/" className="admin-logo-link">
            <img src="/logo-td-supply.png" alt="TD Supply" className="admin-logo" />
          </Link>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle sidebar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>

        <nav className="admin-nav">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-item ${pathname === item.href ? 'active' : ''} ${item.accent ? 'accent' : ''}`}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="admin-nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <Link href="/" className="admin-nav-item" style={{ opacity: 0.6 }}>
            <span className="admin-nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              </svg>
            </span>
            {sidebarOpen && <span className="admin-nav-label">Mergi la site</span>}
          </Link>
          <button onClick={handleLogout} className="admin-nav-item admin-logout">
            <span className="admin-nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </span>
            {sidebarOpen && <span className="admin-nav-label">Deconectare</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main">
        {/* Topbar */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            {title && <h1 className="admin-page-title">{title}</h1>}
          </div>
          <div className="admin-topbar-right">
            <div className="admin-user-chip">
              <div className="admin-user-avatar">
                {admin?.email?.[0]?.toUpperCase() ?? 'A'}
              </div>
              <div className="admin-user-info">
                <span className="admin-user-email">{admin?.email}</span>
                <span className="admin-user-role">{admin?.role}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="admin-content">
          {children}
        </div>
      </div>
    </div>
  );
}
