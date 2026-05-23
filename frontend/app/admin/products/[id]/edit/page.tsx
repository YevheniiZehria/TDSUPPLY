'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { adminGetProductById, adminUpdateProduct, adminDeleteProduct, adminUploadImage } from '@/lib/adminApi';
import type { Product } from '@/lib/api';

const CATEGORIES = [
  { id: 'zirconia', label: 'Discuri Zirconia' },
  { id: 'glass-ceramic', label: 'Glass Ceramică' },
  { id: 'milling-machines', label: 'Mașini de Frezat & Cuptoare' },
  { id: 'scanners-printers', label: 'Scannere & Imprimante' },
  { id: 'peek-pmma-wax', label: 'PEEK, PMMA & Wax' },
  { id: 'composite-materials', label: 'Materiale Compozite' },
];

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState('');

  const [form, setForm] = useState({
    code: '', nameRo: '', nameEn: '',
    category: 'zirconia',
    descRo: '', descEn: '',
    price: '', currency: 'USD', unit: 'buc',
    image: '', inStock: true, featured: false,
    tags: '',
  });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    adminGetProductById(id)
      .then(p => {
        setProduct(p);
        setForm({
          code: p.code, nameRo: p.name.ro, nameEn: p.name.en,
          category: p.category,
          descRo: p.description.ro, descEn: p.description.en,
          price: String(p.price), currency: p.currency, unit: p.unit,
          image: p.image, inStock: p.inStock, featured: p.featured ?? false,
          tags: p.tags.join(', '),
        });
      })
      .catch((err) => {
        console.error(err);
        setError('Produsul nu a fost găsit sau eroare de rețea.');
        setTimeout(() => router.push('/admin/products'), 2000);
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  function set(field: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const { url } = await adminUploadImage(file);
      set('image', url);
    } catch (err) {
      setError('Eroare la încărcarea imaginii.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await adminUpdateProduct(id, {
        code: form.code,
        name: { ro: form.nameRo, en: form.nameEn },
        category: form.category,
        description: { ro: form.descRo, en: form.descEn },
        price: parseFloat(form.price),
        currency: form.currency,
        unit: form.unit,
        image: form.image,
        inStock: form.inStock,
        featured: form.featured,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      setToast('Produs actualizat cu succes!');
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      setError((err as Error).message || 'Eroare la salvare.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await adminDeleteProduct(id);
      router.push('/admin/products');
    } catch (err) {
      setError((err as Error).message || 'Eroare la ștergere.');
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Editare produs">
        <div className="admin-loading">
          <div className="login-spinner" style={{ width: 32, height: 32, borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Editare: ${product?.name.ro ?? '...'}`}>
      <div className="admin-form-wrap">
        <form className="admin-form" onSubmit={handleSubmit} noValidate>
          {error && <div className="admin-form-error">{error}</div>}

          <div className="admin-form-section">
            <h3 className="admin-form-section-title">Identificare</h3>
            <div className="admin-form-row">
              <div className="admin-field">
                <label className="admin-label">Cod produs *</label>
                <input className="admin-input" value={form.code} onChange={e => set('code', e.target.value)} required />
              </div>
              <div className="admin-field">
                <label className="admin-label">Categorie *</label>
                <select className="admin-input" value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="admin-form-section">
            <h3 className="admin-form-section-title">Denumire</h3>
            <div className="admin-field">
              <label className="admin-label">Nume (Română) *</label>
              <input className="admin-input" value={form.nameRo} onChange={e => set('nameRo', e.target.value)} required />
            </div>
            <div className="admin-field">
              <label className="admin-label">Nume (Engleză) *</label>
              <input className="admin-input" value={form.nameEn} onChange={e => set('nameEn', e.target.value)} required />
            </div>
          </div>

          <div className="admin-form-section">
            <h3 className="admin-form-section-title">Descriere</h3>
            <div className="admin-field">
              <label className="admin-label">Descriere (Română) *</label>
              <textarea className="admin-input admin-textarea" value={form.descRo} onChange={e => set('descRo', e.target.value)} required />
            </div>
            <div className="admin-field">
              <label className="admin-label">Descriere (Engleză) *</label>
              <textarea className="admin-input admin-textarea" value={form.descEn} onChange={e => set('descEn', e.target.value)} required />
            </div>
          </div>

          <div className="admin-form-section">
            <h3 className="admin-form-section-title">Preț & Disponibilitate</h3>
            <div className="admin-form-row">
              <div className="admin-field">
                <label className="admin-label">Preț *</label>
                <input className="admin-input" type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} required />
              </div>
              <div className="admin-field">
                <label className="admin-label">Monedă</label>
                <select className="admin-input" value={form.currency} onChange={e => set('currency', e.target.value)}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="RON">RON</option>
                </select>
              </div>
              <div className="admin-field">
                <label className="admin-label">Unitate</label>
                <input className="admin-input" value={form.unit} onChange={e => set('unit', e.target.value)} />
              </div>
            </div>
            <div className="admin-form-row">
              <label className="admin-checkbox-label">
                <input type="checkbox" checked={form.inStock} onChange={e => set('inStock', e.target.checked)} />
                <span>În stoc</span>
              </label>
              <label className="admin-checkbox-label">
                <input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)} />
                <span>Produs recomandat (featured)</span>
              </label>
            </div>
          </div>

          <div className="admin-form-section">
            <h3 className="admin-form-section-title">Extra</h3>
            <div className="admin-field">
              <label className="admin-label">Tags (separate prin virgulă)</label>
              <input className="admin-input" value={form.tags} onChange={e => set('tags', e.target.value)} />
            </div>
            <div className="admin-field">
              <label className="admin-label">Imagine produs</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input
                  className="admin-input"
                  placeholder="/public/products/imagine.jpg"
                  value={form.image}
                  onChange={e => set('image', e.target.value)}
                />
                <label className={`btn-ghost ${uploading ? 'disabled' : ''}`} style={{ cursor: 'pointer', padding: '8px 16px', borderRadius: 8, whiteSpace: 'nowrap' }}>
                  {uploading ? 'Se încarcă...' : 'Încarcă fișier'}
                  <input type="file" hidden accept="image/*" onChange={handleFileChange} disabled={uploading} />
                </label>
              </div>
              {form.image && (
                <div style={{ marginTop: 8 }}>
                  <img src={form.image} alt="Preview" style={{ height: 60, borderRadius: 4, border: '1px solid var(--border)' }} />
                </div>
              )}
            </div>
          </div>

          <div className="admin-form-actions">
            <button type="submit" className="admin-btn-primary" disabled={saving}>
              {saving ? 'Se salvează...' : '✓ Salvează modificările'}
            </button>
            <button type="button" className="admin-btn-ghost" onClick={() => router.push('/admin/products')}>
              Anulează
            </button>
            <button
              type="button"
              className="admin-btn-danger"
              style={{ marginLeft: 'auto' }}
              onClick={() => setConfirmDelete(true)}
            >
              🗑️ Șterge produs
            </button>
          </div>
        </form>
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="admin-modal-overlay" onClick={() => setConfirmDelete(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-icon">⚠️</div>
            <h3 className="admin-modal-title">Ștergi produsul?</h3>
            <p className="admin-modal-text">
              <strong>„{product?.name.ro}"</strong> va fi eliminat permanent.
            </p>
            <div className="admin-modal-actions">
              <button className="admin-btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Se șterge...' : 'Șterge'}
              </button>
              <button className="admin-btn-ghost" onClick={() => setConfirmDelete(false)}>Anulează</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="admin-toast success">{toast}</div>}
    </AdminLayout>
  );
}
