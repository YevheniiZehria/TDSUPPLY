'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { adminCreateProduct, adminUploadImage } from '@/lib/adminApi';

const CATEGORIES = [
  { id: 'zirconia', label: 'Discuri Zirconia' },
  { id: 'glass-ceramic', label: 'Glass Ceramică' },
  { id: 'milling-machines', label: 'Mașini de Frezat & Cuptoare' },
  { id: 'scanners-printers', label: 'Scannere & Imprimante' },
  { id: 'peek-pmma-wax', label: 'PEEK, PMMA & Wax' },
  { id: 'composite-materials', label: 'Materiale Compozite' },
];

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    code: '', nameRo: '', nameEn: '',
    category: 'zirconia',
    descRo: '', descEn: '',
    price: '', currency: 'USD', unit: 'buc',
    image: '', inStock: true, featured: false,
    tags: '',
  });

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
    if (!form.code || !form.nameRo || !form.nameEn || !form.descRo || !form.descEn || !form.price) {
      setError('Completați toate câmpurile obligatorii.');
      return;
    }
    setSaving(true);
    try {
      await adminCreateProduct({
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
      router.push('/admin/products');
    } catch (err) {
      setError((err as Error).message || 'Eroare la salvare.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout title="Produs nou">
      <div className="admin-form-wrap">
        <form className="admin-form" onSubmit={handleSubmit} noValidate>
          {error && <div className="admin-form-error">{error}</div>}

          <div className="admin-form-section">
            <h3 className="admin-form-section-title">Identificare</h3>
            <div className="admin-form-row">
              <div className="admin-field">
                <label className="admin-label">Cod produs *</label>
                <input className="admin-input" placeholder="YP-BL-RC-4.1" value={form.code} onChange={e => set('code', e.target.value)} required />
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
              <input className="admin-input" placeholder="Implant Bone Level RC ø4.1mm" value={form.nameRo} onChange={e => set('nameRo', e.target.value)} required />
            </div>
            <div className="admin-field">
              <label className="admin-label">Nume (Engleză) *</label>
              <input className="admin-input" placeholder="Bone Level Implant RC ø4.1mm" value={form.nameEn} onChange={e => set('nameEn', e.target.value)} required />
            </div>
          </div>

          <div className="admin-form-section">
            <h3 className="admin-form-section-title">Descriere</h3>
            <div className="admin-field">
              <label className="admin-label">Descriere (Română) *</label>
              <textarea className="admin-input admin-textarea" placeholder="Descriere în română..." value={form.descRo} onChange={e => set('descRo', e.target.value)} required />
            </div>
            <div className="admin-field">
              <label className="admin-label">Descriere (Engleză) *</label>
              <textarea className="admin-input admin-textarea" placeholder="Description in English..." value={form.descEn} onChange={e => set('descEn', e.target.value)} required />
            </div>
          </div>

          <div className="admin-form-section">
            <h3 className="admin-form-section-title">Preț & Disponibilitate</h3>
            <div className="admin-form-row">
              <div className="admin-field">
                <label className="admin-label">Preț *</label>
                <input className="admin-input" type="number" min="0" step="0.01" placeholder="48.50" value={form.price} onChange={e => set('price', e.target.value)} required />
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
                <input className="admin-input" placeholder="buc / set / cutie" value={form.unit} onChange={e => set('unit', e.target.value)} />
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
              <input className="admin-input" placeholder="implant, titan, bone-level" value={form.tags} onChange={e => set('tags', e.target.value)} />
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
              {saving ? 'Se salvează...' : '✓ Salvează produs'}
            </button>
            <button type="button" className="admin-btn-ghost" onClick={() => router.back()}>
              Anulează
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
