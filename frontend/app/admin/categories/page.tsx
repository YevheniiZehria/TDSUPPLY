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
      await adminDeleteCategory(id);
      await loadCategories();
    } catch (err: any) {
      alert('Eroare: ' + (err.message || 'Nu s-a putut șterge categoria'));
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
        name: { ro: formData.nameRo, en: formData.nameEn }
      };

      if (editingId) {
        await adminUpdateCategory(editingId, payload);
      } else {
        await adminCreateCategory(payload);
      }
      setIsModalOpen(false);
      await loadCategories();
    } catch (err: any) {
      alert('Eroare la salvare: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Management Categorii</h1>
        <button onClick={openCreate} className="btn-primary" style={{ padding: '8px 16px', fontSize: 14 }}>
          + Categorie Nouă
        </button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <p>Se încarcă categoriile...</p>
      ) : (
        <div style={{ overflowX: 'auto', background: 'var(--surface-2)', borderRadius: 8, padding: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: 12 }}>ID (Slug)</th>
                <th style={{ padding: 12 }}>Nume (Română)</th>
                <th style={{ padding: 12 }}>Nume (Engleză)</th>
                <th style={{ padding: 12, textAlign: 'right' }}>Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: 12 }}>{cat.id}</td>
                  <td style={{ padding: 12 }}>{cat.name.ro}</td>
                  <td style={{ padding: 12 }}>{cat.name.en}</td>
                  <td style={{ padding: 12, textAlign: 'right' }}>
                    <button
                      onClick={() => openEdit(cat)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', marginRight: 16 }}
                    >
                      Editează
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                    >
                      Șterge
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: 16, textAlign: 'center' }}>Nu există categorii.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: 'var(--background)', padding: 24, borderRadius: 12, width: '100%', maxWidth: 500 }}>
            <h2 style={{ marginBottom: 20 }}>{editingId ? 'Editează Categoria' : 'Adaugă Categorie'}</h2>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>Nume (Română) *</label>
                <input
                  type="text"
                  value={formData.nameRo}
                  onChange={e => setFormData({ ...formData, nameRo: e.target.value })}
                  style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)' }}
                  required
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>Nume (Engleză) *</label>
                <input
                  type="text"
                  value={formData.nameEn}
                  onChange={e => setFormData({ ...formData, nameEn: e.target.value })}
                  style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)' }}
                  required
                />
                {!editingId && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    Slug-ul (ID-ul) va fi generat automat din numele în engleză.
                  </p>
                )}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>
                  Anulează
                </button>
                <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '8px 16px' }}>
                  {saving ? 'Se salvează...' : 'Salvează'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
