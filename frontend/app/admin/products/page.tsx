'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { adminGetProducts, adminDeleteProduct, adminImportProducts } from '@/lib/adminApi';
import { formatCurrency, type Product } from '@/lib/api';

const CATEGORIES_FILTER = [
  { id: 'all', label: 'Toate' },
  { id: 'implanturi', label: 'Implanturi' },
  { id: 'componente-protetice', label: 'Protetice' },
  { id: 'chirurgie', label: 'Chirurgie' },
  { id: 'instrumente', label: 'Instrumente' },
  { id: 'estetica-dentara', label: 'Estetică' },
  { id: 'protectie-sterilizare', label: 'Sterilizare' },
];

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState('');

  // XLSX Import States
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!importFile) return;
    setImporting(true);
    try {
      const res = await adminImportProducts(importFile);
      setToast(`Import reușit: ${res.importedCount} produse procesate.`);
      setTimeout(() => setToast(''), 4000);
      setShowImportModal(false);
      setImportFile(null);
      loadProducts();
    } catch (e) {
      console.error(e);
      setToast('Eroare la importul fișierului.');
      setTimeout(() => setToast(''), 4000);
    } finally {
      setImporting(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const data = await adminGetProducts();
      setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    let list = products;
    if (catFilter !== 'all') list = list.filter(p => p.category === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.ro.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, catFilter, search]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminDeleteProduct(deleteTarget.id);
      setProducts(prev => prev.filter(p => p.id !== deleteTarget.id));
      setToast(`"${deleteTarget.name.ro}" a fost șters.`);
      setTimeout(() => setToast(''), 3000);
    } catch (e) {
      setToast('Eroare la ștergere.');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <AdminLayout title="Gestionare Produse">
      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <svg className="admin-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            id="admin-product-search"
            className="admin-search-input"
            type="text"
            placeholder="Caută cod, nume..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="admin-filter-chips">
          {CATEGORIES_FILTER.map(c => (
            <button
              key={c.id}
              className={`admin-chip ${catFilter === c.id ? 'active' : ''}`}
              onClick={() => setCatFilter(c.id)}
            >{c.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            type="button" 
            className="admin-btn-secondary" 
            onClick={() => setShowImportModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, color: 'var(--text)' }}
          >
            📊 Import XLSX
          </button>
          <Link href="/admin/products/new" className="admin-btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Adaugă produs
          </Link>
        </div>
      </div>

      {/* Count */}
      <div className="admin-results-count">
        {filtered.length} produs{filtered.length !== 1 ? 'e' : ''}
      </div>

      {/* Table */}
      <div className="admin-card">
        {loading ? (
          <div className="admin-loading">
            <div className="login-spinner" style={{ width: 28, height: 28, borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Cod</th>
                  <th>Produs</th>
                  <th>Categorie</th>
                  <th>Preț (USD)</th>
                  <th>Stoc</th>
                  <th>Featured</th>
                  <th style={{ textAlign: 'right' }}>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      Niciun produs găsit.
                    </td>
                  </tr>
                )}
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td><code className="admin-code">{p.code}</code></td>
                    <td>
                      <div className="admin-product-name">{p.name.ro}</div>
                      <div className="admin-product-slug">/{p.slug}</div>
                    </td>
                    <td><span className="admin-badge">{p.category}</span></td>
                    <td><strong>{formatCurrency(p.price, p.currency)}</strong><small> /{p.unit}</small></td>
                    <td>
                      <span className={`admin-badge ${p.inStock ? 'badge-ok' : 'badge-err'}`}>
                        {p.inStock ? '✓ Stoc' : '✗ Epuizat'}
                      </span>
                    </td>
                    <td>
                      {p.featured
                        ? <span className="admin-badge badge-warn">⭐ Da</span>
                        : <span style={{ color: 'var(--text-light)', fontSize: 12 }}>—</span>
                      }
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <Link
                          href={`/produs/${p.slug}`}
                          target="_blank"
                          className="admin-action-icon-btn"
                          title="Vezi produs"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </Link>
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="admin-action-icon-btn edit"
                          title="Editează"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </Link>
                        <button
                          className="admin-action-icon-btn delete"
                          title="Șterge"
                          onClick={() => setDeleteTarget(p)}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="admin-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-icon">🗑️</div>
            <h3 className="admin-modal-title">Confirmi ștergerea?</h3>
            <p className="admin-modal-text">
              Produsul <strong>„{deleteTarget.name.ro}"</strong> ({deleteTarget.code}) va fi șters permanent.
            </p>
            <div className="admin-modal-actions">
              <button className="admin-btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Se șterge...' : 'Da, șterge'}
              </button>
              <button className="admin-btn-ghost" onClick={() => setDeleteTarget(null)}>
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import products modal */}
      {showImportModal && (
        <div className="admin-modal-overlay" onClick={() => { if (!importing) setShowImportModal(false); }}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="admin-modal-icon">📊</div>
            <h3 className="admin-modal-title">Import Bulk Produse</h3>
            <p className="admin-modal-text" style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              Încarcă catalogul în format Excel. Sistemul va citi automat produsele din toate cele 5 secțiuni: Zirconia, Glass Ceramic, Mașini de frezat, PEEK/PMMA/Wax, Scannere/Imprimante și Compozite.
            </p>
            <form onSubmit={handleImport}>
              <div style={{ border: '2px dashed var(--border)', padding: '24px 16px', borderRadius: 8, textAlign: 'center', background: 'var(--background)', marginBottom: 20 }}>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) setImportFile(file);
                  }}
                  required
                  style={{ display: 'none' }}
                  id="excel-file-upload"
                  disabled={importing}
                />
                <label htmlFor="excel-file-upload" style={{ cursor: 'pointer', display: 'block' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
                  <span style={{ fontWeight: 600, color: 'var(--accent)', display: 'block', marginBottom: 4 }}>
                    {importFile ? importFile.name : 'Selectează fișierul Excel'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {importFile ? `${(importFile.size / 1024 / 1024).toFixed(2)} MB` : 'Sunt acceptate doar fișiere .xlsx sau .xls'}
                  </span>
                </label>
              </div>
              <div className="admin-modal-actions">
                <button type="submit" className="admin-btn-primary" disabled={importing || !importFile} style={{ minWidth: 120 }}>
                  {importing ? 'Se importă...' : 'Pornește Importul'}
                </button>
                <button type="button" className="admin-btn-ghost" onClick={() => setShowImportModal(false)} disabled={importing}>
                  Anulează
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="admin-toast">{toast}</div>}
    </AdminLayout>
  );
}
