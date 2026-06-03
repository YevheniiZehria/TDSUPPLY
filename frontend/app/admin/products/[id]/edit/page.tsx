'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { adminGetProductById, adminUpdateProduct, adminDeleteProduct, adminUploadImage, adminUploadVideo } from '@/lib/adminApi';
import { getProductImageUrl, getProductVideoUrl, type Product } from '@/lib/api';

interface Variant { label: string; price: string; inStock: boolean; }

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
  const [imageDragging, setImageDragging] = useState(false);
  
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoDragging, setVideoDragging] = useState(false);
  
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState('');

  const [form, setForm] = useState({
    code: '', nameRo: '', nameEn: '',
    category: 'zirconia',
    descRo: '', descEn: '',
    price: '', currency: 'USD', unit: 'buc',
    image: '', video: '', inStock: true, featured: false,
    tags: '',
  });
  const [variants, setVariants] = useState<Variant[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);

  function addVariant() {
    setVariants(prev => [...prev, { label: '', price: '', inStock: true }]);
  }
  function removeVariant(idx: number) {
    setVariants(prev => prev.filter((_, i) => i !== idx));
  }
  function updateVariant(idx: number, field: keyof Variant, value: any) {
    setVariants(prev => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v));
  }

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
          image: p.image, video: p.video ?? '', inStock: p.inStock, featured: p.featured ?? false,
          tags: p.tags.join(', '),
        });
        // Încarcă variantele existente
        if (p.variants && p.variants.length > 0) {
          setVariants(p.variants.map(v => ({ label: v.label, price: String(v.price), inStock: v.inStock !== false })));
        }
        setImages(p.images ?? []);
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

  async function handleImageUpload(file: File) {
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

  function handleImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  }

  function handleImageDragOver(e: React.DragEvent) {
    e.preventDefault();
    setImageDragging(true);
  }

  function handleImageDragLeave() {
    setImageDragging(false);
  }

  function handleImageDrop(e: React.DragEvent) {
    e.preventDefault();
    setImageDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Doar fișierele imagine sunt permise.');
        return;
      }
      handleImageUpload(file);
    }
  }

  function handleImagePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleImageUpload(file);
          break;
        }
      }
    }
  }

  function handleGalleryPaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      handleGalleryUpload(files);
    }
  }

  async function handleVideoUpload(file: File) {
    setVideoUploading(true);
    setError('');
    try {
      const { url } = await adminUploadVideo(file);
      set('video', url);
    } catch (err) {
      setError('Eroare la încărcarea videoclipului.');
    } finally {
      setVideoUploading(false);
    }
  }

  function handleVideoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleVideoUpload(file);
  }

  function handleVideoDragOver(e: React.DragEvent) {
    e.preventDefault();
    setVideoDragging(true);
  }

  function handleVideoDragLeave() {
    setVideoDragging(false);
  }

  function handleVideoDrop(e: React.DragEvent) {
    e.preventDefault();
    setVideoDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        setError('Doar fișierele video sunt permise.');
        return;
      }
      handleVideoUpload(file);
    }
  }

  async function handleGalleryUpload(files: FileList | null | File[]) {
    if (!files || files.length === 0) return;
    setGalleryUploading(true);
    setError('');
    const newUrls: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        const { url } = await adminUploadImage(file);
        newUrls.push(url);
      }
      setImages(prev => [...prev, ...newUrls]);
    } catch (err) {
      setError('Eroare la încărcarea imaginilor în galerie.');
    } finally {
      setGalleryUploading(false);
    }
  }

  function setAsMainImage(imgUrl: string) {
    const currentMain = form.image;
    set('image', imgUrl);
    setImages(prev => {
      const filtered = prev.filter(url => url !== imgUrl);
      if (currentMain && !filtered.includes(currentMain) && currentMain !== imgUrl) {
        return [...filtered, currentMain];
      }
      return filtered;
    });
  }

  function removeGalleryImage(imgUrl: string) {
    setImages(prev => prev.filter(url => url !== imgUrl));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const parsedVariants = variants
        .filter(v => v.label.trim() && v.price)
        .map(v => ({ label: v.label.trim(), price: parseFloat(v.price), inStock: v.inStock !== false }))
        .sort((a, b) => {
          const numRegex = /[-+]?[0-9]*\.?[0-9]+/;
          const aMatch = a.label.match(numRegex);
          const bMatch = b.label.match(numRegex);

          if (aMatch && bMatch) {
            const aNum = parseFloat(aMatch[0]);
            const bNum = parseFloat(bMatch[0]);
            if (aNum !== bNum) {
              return aNum - bNum;
            }
          } else if (aMatch) {
            return -1;
          } else if (bMatch) {
            return 1;
          }
          return a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' });
        });
      await adminUpdateProduct(id, {
        code: form.code,
        name: { ro: form.nameRo, en: form.nameEn },
        category: form.category,
        description: { ro: form.descRo, en: form.descEn },
        price: parseFloat(form.price) || 0,
        currency: form.currency,
        unit: form.unit,
        image: form.image,
        video: form.video,
        inStock: form.inStock,
        featured: form.featured,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        variants: parsedVariants.length > 0 ? parsedVariants : null,
        images: images,
      } as any);
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

          {/* ── Variante Dimensiuni & Prețuri ── */}
          <div className="admin-form-section">
            <h3 className="admin-form-section-title">Variante dimensiuni &amp; prețuri</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: -8 }}>
              Lasă gol dacă produsul are un singur preț. Când există variante, selectând o dimensiune se actualizează prețul afișat pe pagina produsului.
            </p>

            {variants.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', padding: '6px 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dimensiune</th>
                    <th style={{ textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', padding: '6px 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Preț (USD)</th>
                    <th style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', padding: '6px 8px', textTransform: 'uppercase', letterSpacing: '0.06em', width: 80 }}>În Stoc</th>
                    <th style={{ width: 40 }} />
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          className="admin-input"
                          style={{ padding: '7px 10px' }}
                          placeholder="ex: 10mm"
                          value={v.label}
                          onChange={e => updateVariant(idx, 'label', e.target.value)}
                        />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          className="admin-input"
                          style={{ padding: '7px 10px' }}
                          type="number" min="0" step="0.01"
                          placeholder="10.50"
                          value={v.price}
                          onChange={e => updateVariant(idx, 'price', e.target.value)}
                        />
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={v.inStock !== false}
                          onChange={e => updateVariant(idx, 'inStock', e.target.checked)}
                          style={{ width: 18, height: 18, cursor: 'pointer', verticalAlign: 'middle' }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                        <button
                          type="button"
                          className="admin-action-icon-btn delete"
                          title="Șterge variantă"
                          onClick={() => removeVariant(idx)}
                          style={{ margin: '0 auto' }}
                        >✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <button
              type="button"
              className="admin-btn-ghost"
              style={{ alignSelf: 'flex-start', marginTop: 8 }}
              onClick={addVariant}
            >
              + Adaugă dimensiune
            </button>
          </div>

          <div className="admin-form-section">
            <h3 className="admin-form-section-title">Medii & Etichete</h3>
            <div className="admin-field">
              <label className="admin-label">Tags (separate prin virgulă)</label>
              <input className="admin-input" value={form.tags} onChange={e => set('tags', e.target.value)} />
            </div>
            
            <div className="admin-field" style={{ marginTop: 8 }}>
              <label className="admin-label">Imagine produs (Drag & Drop, Paste sau Click pentru selectare)</label>
              <div
                className={`admin-upload-zone ${imageDragging ? 'dragging' : ''}`}
                onDragOver={handleImageDragOver}
                onDragLeave={handleImageDragLeave}
                onDrop={handleImageDrop}
                onPaste={handleImagePaste}
                tabIndex={0}
                style={{ outline: 'none' }}
              >
                {uploading ? (
                  <>
                    <div className="login-spinner" style={{ width: 24, height: 24, borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
                    <span className="admin-upload-zone-text">Se încarcă imaginea...</span>
                  </>
                ) : (
                  <>
                    <span className="admin-upload-zone-icon">🖼️</span>
                    <span className="admin-upload-zone-text">
                      Trage imaginea aici, dă <strong>Paste (Ctrl+V)</strong> sau <strong>click</strong> pentru a alege fișierul
                    </span>
                    <span className="admin-upload-zone-hint">PNG, JPG, JPEG, WEBP, GIF (Max. 5MB)</span>
                  </>
                )}
                <input type="file" id="image-file-input" hidden accept="image/*" onChange={handleImageFileChange} disabled={uploading} />
                <label htmlFor="image-file-input" style={{ position: 'absolute', inset: 0, cursor: 'pointer', zIndex: 1 }} />
              </div>
              
              {form.image && (
                <div className="admin-upload-preview-container" style={{ marginTop: 8 }}>
                  <div className="admin-upload-preview-wrapper" style={{ position: 'relative', zIndex: 2 }}>
                    <img src={getProductImageUrl(form.image)} alt="Preview" className="admin-upload-preview-media" />
                    <div className="admin-upload-preview-info">
                      <span className="admin-upload-preview-url">{form.image}</span>
                    </div>
                    <div className="admin-upload-preview-actions">
                      <button type="button" className="admin-action-icon-btn delete" title="Șterge imagine" onClick={() => set('image', '')}>🗑️</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Galerie Imagini Produs */}
            <div className="admin-field" style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <label className="admin-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                🖼️ Galerie Imagini Produs (Suplimentare)
              </label>
              
              <div
                className={`admin-upload-zone ${galleryUploading ? 'uploading' : ''}`}
                onPaste={handleGalleryPaste}
                tabIndex={0}
                style={{
                  outline: 'none',
                  border: '2px dashed var(--border)',
                  borderRadius: 8,
                  padding: '20px 16px',
                  textAlign: 'center',
                  background: 'var(--surface-2)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, background-color 0.2s',
                }}
              >
                {galleryUploading ? (
                  <>
                    <div className="login-spinner" style={{ width: 24, height: 24, borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
                    <span className="admin-upload-zone-text" style={{ fontSize: 13, fontWeight: 500 }}>Se încarcă imaginile...</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 24 }}>📤</span>
                    <span className="admin-upload-zone-text" style={{ fontSize: 13, fontWeight: 500 }}>
                      Alegeți, glisați sau dați <strong>Paste (Ctrl+V)</strong> imagini suplimentare pentru galerie
                    </span>
                    <span className="admin-upload-zone-hint" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Puteți selecta mai multe fișiere deodată (PNG, JPG, WEBP)
                    </span>
                  </>
                )}
                <input
                  type="file"
                  id="gallery-file-input"
                  multiple
                  hidden
                  accept="image/*"
                  onChange={(e) => handleGalleryUpload(e.target.files)}
                  disabled={galleryUploading}
                />
                <label htmlFor="gallery-file-input" style={{ position: 'absolute', inset: 0, cursor: 'pointer', zIndex: 1 }} />
              </div>

              {/* Grid Miniaturi Galerie */}
              {images.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12, marginTop: 16 }}>
                  {images.map((imgUrl, idx) => (
                    <div
                      key={imgUrl + idx}
                      style={{
                        position: 'relative',
                        borderRadius: 8,
                        border: '1.5px solid var(--border)',
                        overflow: 'hidden',
                        background: 'var(--surface-3)',
                        paddingTop: '100%',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      }}
                    >
                      <img
                        src={getProductImageUrl(imgUrl)}
                        alt="Gallery preview"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      {/* Actions overlay */}
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0,0,0,0.5)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          padding: 6,
                          opacity: 0,
                          transition: 'opacity 0.2s',
                          cursor: 'default',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; }}
                      >
                        <div style={{ alignSelf: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(imgUrl)}
                            style={{
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: 4,
                              width: 24,
                              height: 24,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                            }}
                            title="Șterge din galerie"
                          >
                            🗑️
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAsMainImage(imgUrl)}
                          style={{
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            padding: '4px 6px',
                            fontSize: 10,
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'center',
                            width: '100%',
                          }}
                        >
                          Setează Principală
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="admin-field" style={{ marginTop: 16 }}>
              <label className="admin-label">Videoclip produs (Drag & Drop sau Link YouTube)</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                <input
                  className="admin-input"
                  style={{ flex: 1 }}
                  placeholder="Ex: https://www.youtube.com/watch?v=... sau trage un fișier video mai jos"
                  value={form.video}
                  onChange={e => set('video', e.target.value)}
                />
              </div>

              <div
                className={`admin-upload-zone ${videoDragging ? 'dragging' : ''}`}
                onDragOver={handleVideoDragOver}
                onDragLeave={handleVideoDragLeave}
                onDrop={handleVideoDrop}
                tabIndex={0}
                style={{ outline: 'none' }}
              >
                {videoUploading ? (
                  <>
                    <div className="login-spinner" style={{ width: 24, height: 24, borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
                    <span className="admin-upload-zone-text">Se încarcă videoclipul...</span>
                  </>
                ) : (
                  <>
                    <span className="admin-upload-zone-icon">🎥</span>
                    <span className="admin-upload-zone-text">
                      Trage fișierul video aici sau <strong>click</strong> pentru a selecta
                    </span>
                    <span className="admin-upload-zone-hint">MP4, WEBM, OGG, MOV (Max. 50MB)</span>
                  </>
                )}
                <input type="file" id="video-file-input" hidden accept="video/*" onChange={handleVideoFileChange} disabled={videoUploading} />
                <label htmlFor="video-file-input" style={{ position: 'absolute', inset: 0, cursor: 'pointer', zIndex: 1 }} />
              </div>
              
              {form.video && (
                <div className="admin-upload-preview-container" style={{ marginTop: 8 }}>
                  <div className="admin-upload-preview-wrapper" style={{ position: 'relative', zIndex: 2 }}>
                    {form.video.includes('youtube.com') || form.video.includes('youtu.be') ? (
                      <div className="admin-upload-preview-media" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, background: '#FF0000', color: '#FFF', fontWeight: 'bold' }}>
                        YT
                      </div>
                    ) : (
                      <video src={getProductVideoUrl(form.video)} className="admin-upload-preview-media" muted />
                    )}
                    <div className="admin-upload-preview-info">
                      <span className="admin-upload-preview-url">{form.video}</span>
                    </div>
                    <div className="admin-upload-preview-actions">
                      <button type="button" className="admin-action-icon-btn delete" title="Șterge video" onClick={() => set('video', '')}>🗑️</button>
                    </div>
                  </div>
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
