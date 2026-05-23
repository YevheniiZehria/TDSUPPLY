'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { adminGetStats, adminGetProducts, adminGetOrders } from '@/lib/adminApi';
import { formatCurrency, type ProductStats, type Product } from '@/lib/api';

const REFRESH_INTERVAL = 30_000; // 30 secunde

export default function AdminDashboard() {
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [recent, setRecent] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isInitial = false) => {
    if (!isInitial) setRefreshing(true);
    try {
      const [s, products, orderList] = await Promise.all([
        adminGetStats(),
        adminGetProducts(),
        adminGetOrders().catch(() => []),
      ]);
      setStats(s);
      setRecent(products.slice(0, 5));
      setOrders(orderList.slice(0, 5));
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      if (isInitial) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => loadData(false), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [loadData]);

  const statCards = stats ? [
    { label: 'Total produse', value: stats.total, color: 'var(--primary)', icon: '📦' },
    { label: 'În stoc', value: stats.inStock, color: '#16a34a', icon: '✅' },
    { label: 'Stoc epuizat', value: stats.outOfStock, color: '#dc2626', icon: '❌' },
    { label: 'Recomandate', value: stats.featured, color: '#d97706', icon: '⭐' },
  ] : [];

  const orderStatusColor: Record<string, string> = {
    pending: '#d97706',
    confirmed: '#2563eb',
    shipped: '#7c3aed',
    delivered: '#16a34a',
    cancelled: '#dc2626',
  };

  return (
    <AdminLayout title="Dashboard">
      {loading ? (
        <div className="admin-loading">
          <div className="login-spinner" style={{ width: 32, height: 32, borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
        </div>
      ) : (
        <>
          {/* Header cu status live */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted)' }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: refreshing ? '#d97706' : '#16a34a',
                display: 'inline-block',
                boxShadow: refreshing ? '0 0 0 3px rgba(217,119,6,0.2)' : '0 0 0 3px rgba(22,163,74,0.2)',
                animation: refreshing ? 'pulse 1s ease infinite' : 'none',
              }} />
              {refreshing ? 'Se actualizează...' : `Actualizat: ${lastUpdated?.toLocaleTimeString('ro-RO') ?? '—'}`}
            </div>
            <button
              onClick={() => loadData(false)}
              disabled={refreshing}
              style={{
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '6px 14px', fontSize: 13,
                color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>
                <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
              Reîmprospătează
            </button>
          </div>

          {/* Stat cards */}
          <div className="admin-stats-grid">
            {statCards.map(card => (
              <div key={card.label} className="admin-stat-card">
                <div className="admin-stat-icon">{card.icon}</div>
                <div className="admin-stat-value" style={{ color: card.color }}>{card.value}</div>
                <div className="admin-stat-label">{card.label}</div>
              </div>
            ))}
          </div>

          {/* By category */}
          {stats && (
            <div className="admin-card" style={{ marginTop: 24 }}>
              <div className="admin-card-header">
                <h2 className="admin-card-title">Distribuție pe categorii</h2>
              </div>
              <div className="admin-category-bars">
                {Object.entries(stats.byCategory).map(([cat, count]) => (
                  <div key={cat} className="admin-cat-bar-row">
                    <span className="admin-cat-bar-label">{cat}</span>
                    <div className="admin-cat-bar-track">
                      <div
                        className="admin-cat-bar-fill"
                        style={{ width: `${(count / stats.total) * 100}%` }}
                      />
                    </div>
                    <span className="admin-cat-bar-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comenzi recente */}
          {orders.length > 0 && (
            <div className="admin-card" style={{ marginTop: 24 }}>
              <div className="admin-card-header">
                <h2 className="admin-card-title">Comenzi recente</h2>
                <Link href="/admin/orders" className="admin-card-link">Vezi toate →</Link>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Total</th><th>Status</th><th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o: any) => (
                    <tr key={o.id}>
                      <td><code style={{ fontSize: 11 }}>{o.id?.slice(0, 8)}...</code></td>
                      <td><strong>{formatCurrency(o.total ?? 0, o.currency ?? 'RON')}</strong></td>
                      <td>
                        <span className="admin-badge" style={{ color: orderStatusColor[o.status] ?? 'var(--text)' }}>
                          {o.status ?? 'pending'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {o.createdAt ? new Date(o.createdAt).toLocaleDateString('ro-RO') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Recent products */}
          <div className="admin-card" style={{ marginTop: 24 }}>
            <div className="admin-card-header">
              <h2 className="admin-card-title">Produse recente</h2>
              <Link href="/admin/products" className="admin-card-link">Vezi toate →</Link>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Cod</th><th>Nume</th><th>Categorie</th><th>Preț</th><th>Stoc</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(p => (
                  <tr key={p.id}>
                    <td><code>{p.code}</code></td>
                    <td>{p.name.ro}</td>
                    <td><span className="admin-badge">{p.category}</span></td>
                    <td><strong>{formatCurrency(p.price, p.currency)}</strong></td>
                    <td>
                      <span className={`admin-badge ${p.inStock ? 'badge-ok' : 'badge-err'}`}>
                        {p.inStock ? 'În stoc' : 'Epuizat'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quick actions */}
          <div className="admin-quick-actions" style={{ marginTop: 24 }}>
            <Link href="/admin/products/new" className="admin-action-btn primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              Adaugă produs nou
            </Link>
            <Link href="/admin/products" className="admin-action-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
              </svg>
              Gestionează produsele
            </Link>
            <Link href="/" target="_blank" className="admin-action-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Vezi site-ul
            </Link>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
