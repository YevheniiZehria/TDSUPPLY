'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { fetchCategories, Category } from '@/lib/api';
import { adminCreateCategory, adminUpdateCategory, adminDeleteCategory } from '@/lib/adminApi';

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal stare
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nameRo: '', nameEn: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (err: any) {
      setError(err.message || 'Eroare la încărcarea categoriilor');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setFormData({ nameRo: '', nameEn: '' });
    setIsModalOpen(true);
  }

  function openEdit(cat: Category) {
    setEditingId(cat.id);
    setFormData({ nameRo: cat.name.ro, nameEn: cat.name.en });
    setIsModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm('Sigur doriți să ștergeți această categorie?')) return;
    try {
      await adminDeleteCategory(id.trim());
      await loadCategories();
    } catch (err: any) {
      alert('Eroare: ' + JSON.stringify(err.message || err));
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.nameRo || !formData.nameEn) {
      alert('Ambele limbi sunt obligatorii!');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: { ro: formData.nameRo.trim(), en: formData.nameEn.trim() }
      };

      if (editingId) {
        await adminUpdateCategory(editingId, payload);
      } else {
        await adminCreateCategory(payload);
      }
      setIsModalOpen(false);
      await loadCategories();
    } catch (err: any) {
      alert('Eroare la salvare: ' + (err.message || JSON.stringify(err)));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div className="admin-header">
        <div>
          <h1>Management Categorii</h1>
          <p className="admin-subtitle">Adaugă, editează sau șterge categoriile afișate pe site</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={openCreate} className="admin-btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Adaugă Categorie
          </button>
        </div>
      </div>

      {error && <div style={{ color: '#ef4444', marginBottom: 16, background: '#fef2f2', padding: 12, borderRadius: 8, border: '1px solid #fecaca' }}>{error}</div>}

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
                  <th>ID (Slug)</th>
                  <th>Nume (Română)</th>
                  <th>Nume (Engleză)</th>
                  <th style={{ textAlign: 'right' }}>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      Nu există categorii momentan.
                    </td>
                  </tr>
                )}
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td><code className="admin-code">{cat.id}</code></td>
                    <td><div className="admin-product-name">{cat.name.ro}</div></td>
                    <td>{cat.name.en}</td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          onClick={() => openEdit(cat)}
                          className="admin-action-icon-btn edit"
                          title="Editează"
                          style={{ border: 'none', background: 'none' }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="admin-action-icon-btn delete"
                          title="Șterge"
                          style={{ border: 'none', background: 'none' }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
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

      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)'
        }}>
          <div className="admin-card" style={{ padding: 32, width: '100%', maxWidth: 500, margin: '0 20px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h2 style={{ marginBottom: 24, fontSize: '1.25rem' }}>{editingId ? 'Editează Categoria' : 'Categorie Nouă'}</h2>
            <form onSubmit={handleSave}>
              <div className="admin-form-group">
                <label className="admin-form-label">Nume (Română) <span style={{color: 'red'}}>*</span></label>
                <input
                  type="text"
                  className="admin-input"
                  value={formData.nameRo}
                  onChange={e => setFormData({ ...formData, nameRo: e.target.value })}
                  placeholder="ex: Discuri Zirconia"
                  required
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Nume (Engleză) <span style={{color: 'red'}}>*</span></label>
                <input
                  type="text"
                  className="admin-input"
                  value={formData.nameEn}
                  onChange={e => setFormData({ ...formData, nameEn: e.target.value })}
                  placeholder="ex: Zirconia"
                  required
                />
                {!editingId && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
                    Codul intern (slug) va fi generat automat din acest câmp (ex: "Zirconia" devine "zirconia").
                  </p>
                )}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="admin-btn-secondary" style={{ padding: '10px 20px' }}>
                  Anulează
                </button>
                <button type="submit" disabled={saving} className="admin-btn-primary" style={{ padding: '10px 20px' }}>
                  {saving ? 'Se salvează...' : 'Salvează Categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
