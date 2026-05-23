'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { fetchSiteSettings, type SiteSettings } from '@/lib/api';
import { adminUpdateSettings } from '@/lib/adminApi';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [form, setForm] = useState<SiteSettings>({
    phone: '',
    email: '',
    address: '',
    workingHours: '',
    facebookUrl: '',
    instagramUrl: '',
  });

  useEffect(() => {
    fetchSiteSettings()
      .then(data => {
        setForm({
          phone: data.phone ?? '',
          email: data.email ?? '',
          address: data.address ?? '',
          workingHours: data.workingHours ?? '',
          facebookUrl: data.facebookUrl ?? '',
          instagramUrl: data.instagramUrl ?? '',
        });
      })
      .catch(err => {
        setError('Eroare la încărcarea setărilor din baza de date.');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  function set(field: keyof SiteSettings, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!form.phone.trim() || !form.email.trim() || !form.address.trim() || !form.workingHours.trim()) {
      setError('Câmpurile Telefon, Email, Adresă și Program de lucru sunt obligatorii.');
      return;
    }

    setSaving(true);
    try {
      await adminUpdateSettings(form);
      setSuccess('Setările site-ului au fost salvate cu succes!');
      // Dispare mesajul de succes după 4 secunde
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError((err as Error).message || 'A apărut o eroare la salvarea setărilor.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout title="Setări site">
      <div className="admin-form-wrap">
        {loading ? (
          <div className="admin-loading">
            <div className="login-spinner" style={{ width: 32, height: 32, borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
          </div>
        ) : (
          <form className="admin-form" onSubmit={handleSubmit} noValidate>
            {error && <div className="admin-form-error">{error}</div>}
            
            {success && (
              <div className="admin-toast success" style={{ position: 'static', marginBottom: 20, width: '100%' }}>
                {success}
              </div>
            )}

            {/* Date Contact */}
            <div className="admin-form-section">
              <h3 className="admin-form-section-title">Date de Contact Principale</h3>
              
              <div className="admin-form-row">
                <div className="admin-field">
                  <label className="admin-label">Număr de Telefon *</label>
                  <input
                    className="admin-input"
                    type="text"
                    placeholder="(+4) 0330 111 222"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    required
                  />
                </div>
                
                <div className="admin-field">
                  <label className="admin-label">Adresă de Email *</label>
                  <input
                    className="admin-input"
                    type="email"
                    placeholder="dentaltdsupply@gmail.com"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="admin-field">
                <label className="admin-label">Adresă Fizică (Sediu/Showroom) *</label>
                <input
                  className="admin-input"
                  type="text"
                  placeholder="Str. Medicilor 12, București, România"
                  value={form.address}
                  onChange={e => set('address', e.target.value)}
                  required
                />
              </div>

              <div className="admin-field">
                <label className="admin-label">Program de Lucru *</label>
                <input
                  className="admin-input"
                  type="text"
                  placeholder="Luni - Vineri: 09:00 - 18:00"
                  value={form.workingHours}
                  onChange={e => set('workingHours', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Rețele Sociale */}
            <div className="admin-form-section">
              <h3 className="admin-form-section-title">Rețele Sociale (Opționale)</h3>
              
              <div className="admin-field">
                <label className="admin-label">Link Facebook</label>
                <input
                  className="admin-input"
                  type="url"
                  placeholder="https://facebook.com/pagina-ta"
                  value={form.facebookUrl}
                  onChange={e => set('facebookUrl', e.target.value)}
                />
              </div>

              <div className="admin-field">
                <label className="admin-label">Link Instagram</label>
                <input
                  className="admin-input"
                  type="url"
                  placeholder="https://instagram.com/pagina-ta"
                  value={form.instagramUrl}
                  onChange={e => set('instagramUrl', e.target.value)}
                />
              </div>
            </div>

            <div className="admin-form-actions">
              <button type="submit" className="admin-btn-primary" disabled={saving}>
                {saving ? 'Se salvează...' : '✓ Salvează modificările'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
