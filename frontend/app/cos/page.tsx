'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';
import { useUser } from '@/contexts/UserContext';
import { formatCurrency, createOrder } from '@/lib/api';

// ─── Validări câmpuri adresă ────────────────────────────────────────────────

function validateStrada(v: string) {
  if (!v.trim()) return 'Strada și numărul sunt obligatorii.';
  if (v.trim().length < 5) return 'Strada trebuie să aibă cel puțin 5 caractere.';
  if (v.length > 200) return 'Strada nu poate depăși 200 de caractere.';
  if (!/^[\p{L}\d\s\.,\-\/#]+$/u.test(v.trim())) return 'Caractere invalide. Folosiți litere, cifre și: . , - / #';
  return '';
}

function validateOras(v: string) {
  if (!v.trim()) return 'Orașul este obligatoriu.';
  if (v.trim().length < 2) return 'Numele orașului trebuie să aibă cel puțin 2 caractere.';
  if (v.length > 100) return 'Orașul nu poate depăși 100 de caractere.';
  return '';
}

function validateJudet(v: string) {
  if (!v.trim()) return 'Județul este obligatoriu.';
  if (v.trim().length < 2) return 'Județul trebuie să aibă cel puțin 2 caractere.';
  if (v.length > 50) return 'Județul nu poate depăși 50 de caractere.';
  return '';
}

function validateCodPostal(v: string) {
  if (!v.trim()) return 'Codul poștal este obligatoriu.';
  if (!/^\d{6}$/.test(v.trim())) return 'Codul poștal trebuie să conțină exact 6 cifre (ex: 400000).';
  return '';
}

function validatePhone(phone: string): string {
  if (!phone) return 'Numărul de telefon este obligatoriu.';
  const clean = phone.replace(/[\s\-\(\)\+]/g, '');
  if (!/^\d+$/.test(clean)) {
    return 'Numărul de telefon trebuie să conțină doar cifre.';
  }
  if (clean.length < 10) {
    return 'Numărul de telefon este prea scurt (minim 10 cifre).';
  }
  if (clean.length > 15) {
    return 'Numărul de telefon este prea lung (maxim 15 cifre).';
  }
  return '';
}

// ─── Stiluri inline pentru câmpuri ─────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 6,
  border: '1.5px solid var(--border)',
  background: 'var(--background)',
  color: 'var(--text)',
  fontSize: 14,
  transition: 'border-color .15s, box-shadow .15s',
  outline: 'none',
  boxSizing: 'border-box',
};

function FieldInput({
  label,
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  required = false,
  optional = false,
  type = 'text',
  maxLength,
  inputMode,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  type?: string;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? '#ef4444' : value && !error ? '#22c55e' : focused ? 'var(--primary)' : 'var(--border)';
  const shadow = error
    ? '0 0 0 3px rgba(239,68,68,0.12)'
    : value && !error
    ? '0 0 0 3px rgba(34,197,94,0.12)'
    : focused
    ? '0 0 0 3px rgba(var(--primary-rgb,59,130,246),0.12)'
    : 'none';

  return (
    <div style={{ marginBottom: 4 }}>
      <label
        htmlFor={id}
        style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-muted)' }}
      >
        {label}
        {required && <span style={{ color: 'var(--primary)', marginLeft: 3 }}>*</span>}
        {optional && <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 5 }}>(opțional)</span>}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          maxLength={maxLength}
          inputMode={inputMode}
          style={{ ...inputBase, borderColor, boxShadow: shadow }}
        />
        {value && !error && (
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#22c55e', pointerEvents: 'none' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
          </span>
        )}
      </div>
      {error && (
        <p style={{ fontSize: 11, color: '#ef4444', margin: '3px 0 0', paddingLeft: 2 }}>⚠ {error}</p>
      )}
    </div>
  );
}

// ─── Lista județe România ─────────────────────────────────────────────────

const JUDETE = [
  'Alba','Arad','Argeș','Bacău','Bihor','Bistrița-Năsăud','Botoșani','Brăila',
  'Brașov','București','Buzău','Călărași','Caraș-Severin','Cluj','Constanța',
  'Covasna','Dâmbovița','Dolj','Galați','Giurgiu','Gorj','Harghita','Hunedoara',
  'Ialomița','Iași','Ilfov','Maramureș','Mehedinți','Mureș','Neamț','Olt',
  'Prahova','Sălaj','Satu Mare','Sibiu','Suceava','Teleorman','Timiș','Tulcea',
  'Vâlcea','Vaslui','Vrancea',
];

// ─── Pagina principală ───────────────────────────────────────────────────

export default function CartPage() {
  const router = useRouter();
  const { items, count, clearCart } = useCart();
  const { user, updateUser } = useUser();
  const [lang, setLang] = useState<'ro' | 'en'>('ro');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Câmpuri adresă
  const [strada, setStrada]       = useState('');
  const [stradaErr, setStradaErr] = useState('');
  const [bloc, setBloc]           = useState('');
  const [oras, setOras]           = useState('');
  const [orasErr, setOrasErr]     = useState('');
  const [judet, setJudet]         = useState('');
  const [codPostal, setCodPostal] = useState('');
  const [codPostalErr, setCodPostalErr] = useState('');
  const [observatii, setObservatii] = useState('');

  // Câmp telefon livrare (precompletat din profilul utilizatorului)
  const [telefon, setTelefon] = useState(user?.phone ?? '');
  const [telefonErr, setTelefonErr] = useState('');

  // Sincronizează telefonul când se încarcă profilul utilizatorului
  useEffect(() => {
    if (user?.phone) {
      setTelefon(user.phone);
    }
  }, [user]);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const currency = items.length > 0 ? items[0].currency : 'USD';

  // Validare cod poștal: permite doar cifre, max 6
  const handleCodPostal = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 6);
    setCodPostal(digits);
    if (digits.length === 6 || digits.length === 0) setCodPostalErr(validateCodPostal(digits));
    else setCodPostalErr('');
  };

  const handlePhoneChange = (val: string) => {
    setTelefon(val);
    if (val) setTelefonErr(validatePhone(val));
    else setTelefonErr('');
  };

  const handlePhoneBlur = () => {
    if (!telefon) return;
    const clean = telefon.replace(/[\s\-\(\)\+]/g, '');
    if (/^07\d{8}$/.test(clean)) {
      setTelefon('+4' + clean);
      setTelefonErr(validatePhone('+4' + clean));
    } else {
      setTelefonErr(validatePhone(telefon));
    }
  };

  const allFieldsValid = useCallback(() => {
    const s = validateStrada(strada);
    const o = validateOras(oras);
    const cp = validateCodPostal(codPostal);
    const t = validatePhone(telefon);
    // judet este dropdown deci mereu valid dacă selectat
    setStradaErr(s);
    setOrasErr(o);
    setCodPostalErr(cp);
    setTelefonErr(t);
    return !s && !o && !cp && !t && !!judet;
  }, [strada, oras, codPostal, telefon, judet]);

  async function handleCheckout() {
    if (!user) {
      router.push('/autentificare?redirect=/cos');
      return;
    }

    if (!allFieldsValid()) {
      setError(lang === 'ro'
        ? 'Vă rugăm să completați corect toate câmpurile obligatorii pentru livrare (*).'
        : 'Please fill in all required delivery fields correctly (*).');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const mappedItems = items.map(item => {
        // item.productId: real DB id (for items added after the fix)
        // item.slug: safe fallback - backend can lookup by slug too
        // item.id: legacy composite key (productId-variantLabel-color)
        let resolvedId = item.productId || item.slug || item.id;
        let resolvedVariant = item.variantLabel;

        // Legacy fallback: if productId is missing and id looks like 'prod-XXX-variant',
        // we can't safely split, so send slug instead
        if (!item.productId && !item.slug && item.id.startsWith('prod-')) {
          resolvedId = item.id; // send as-is, backend will throw descriptive error
        }

        return {
          id: resolvedId,
          variantLabel: resolvedVariant,
          quantity: item.quantity,
          color: item.color,
        };
      });

      let finalPhone = telefon.trim();
      const cleanPhone = finalPhone.replace(/[\s\-\(\)\+]/g, '');
      if (/^07\d{8}$/.test(cleanPhone)) {
        finalPhone = '+4' + cleanPhone;
      }

      await createOrder({
        items: mappedItems,
        deliveryAddress: {
          strada: strada.trim(),
          bloc: bloc.trim() || undefined,
          oras: oras.trim(),
          judet,
          codPostal: codPostal.trim(),
          observatii: observatii.trim() || undefined,
          telefon: finalPhone,
        },
      });
      updateUser({ phone: finalPhone });
      setSuccess(true);
      clearCart();
    } catch (err: any) {
      setError(err.message || (lang === 'ro'
        ? 'Eroare la plasarea comenzii. Vă rugăm să reîncercați.'
        : 'Error placing the order. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Header lang={lang} onLangChange={setLang} />
      <main className="container" style={{ paddingTop: 40, paddingBottom: 80, minHeight: '60vh' }}>
        <h1 style={{ marginBottom: 32 }}>{lang === 'ro' ? 'Coșul tău' : 'Your Cart'}</h1>

        {success ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <h2>{lang === 'ro' ? 'Comandă plasată cu succes!' : 'Order placed successfully!'}</h2>
            <p>{lang === 'ro' ? 'Vei primi un email de confirmare în curând.' : 'You will receive a confirmation email soon.'}</p>
            <Link href="/catalog" className="btn-primary" style={{ marginTop: 24, display: 'inline-block' }}>
              {lang === 'ro' ? 'Înapoi la catalog' : 'Back to catalog'}
            </Link>
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p>{lang === 'ro' ? 'Coșul tău este gol.' : 'Your cart is empty.'}</p>
            <Link href="/catalog" className="btn-primary" style={{ marginTop: 24, display: 'inline-block' }}>
              {lang === 'ro' ? 'Vezi produse' : 'Browse products'}
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 40 }}>
            <div>
              {/* Tabel produse */}
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 0' }}>{lang === 'ro' ? 'Produs' : 'Product'}</th>
                    <th>{lang === 'ro' ? 'Preț' : 'Price'}</th>
                    <th>{lang === 'ro' ? 'Cantitate' : 'Quantity'}</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px 0' }}>
                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          {item.name}
                          {item.inStock === false && (
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(234,88,12,0.1)', color: '#EA580C', fontWeight: 600 }}>
                              {lang === 'ro' ? 'Precomandă' : 'Pre-order'}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.slug}</div>
                      </td>
                      <td>{formatCurrency(item.price, item.currency, lang === 'ro' ? 'ro-RO' : 'en-US')}</td>
                      <td>{item.quantity}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {formatCurrency(item.price * item.quantity, item.currency, lang === 'ro' ? 'ro-RO' : 'en-US')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Formular Adresă de Livrare */}
              {user && (
                <div style={{
                  marginTop: 40,
                  background: 'var(--surface-2)',
                  padding: 28,
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                }}>
                  <h3 style={{ marginBottom: 8, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    {lang === 'ro' ? 'Adresă de livrare' : 'Shipping Address'}
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
                    {lang === 'ro'
                      ? 'Câmpurile marcate cu * sunt obligatorii. Adresa este validată înainte de trimitere.'
                      : 'Fields marked with * are required. Address is validated before submission.'}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {/* Strada – span 2 */}
                    <div style={{ gridColumn: 'span 2' }}>
                      <FieldInput
                        id="addr-strada"
                        label={lang === 'ro' ? 'Strada și Numărul' : 'Street and Number'}
                        value={strada}
                        onChange={v => { setStrada(v); if (stradaErr) setStradaErr(validateStrada(v)); }}
                        onBlur={() => setStradaErr(validateStrada(strada))}
                        placeholder="Ex. Str. Clinicilor, Nr. 12"
                        error={stradaErr}
                        required
                      />
                    </div>

                    {/* Bloc */}
                    <div>
                      <FieldInput
                        id="addr-bloc"
                        label={lang === 'ro' ? 'Bloc, Scară, Apartament' : 'Building, Stair, Apartment'}
                        value={bloc}
                        onChange={setBloc}
                        placeholder="Ex. Bl. A, Sc. 1, Ap. 5"
                        optional
                        maxLength={100}
                      />
                    </div>

                    {/* Oraș */}
                    <div>
                      <FieldInput
                        id="addr-oras"
                        label={lang === 'ro' ? 'Oraș' : 'City'}
                        value={oras}
                        onChange={v => { setOras(v); if (orasErr) setOrasErr(validateOras(v)); }}
                        onBlur={() => setOrasErr(validateOras(oras))}
                        placeholder="Ex. Cluj-Napoca"
                        error={orasErr}
                        required
                        maxLength={100}
                      />
                    </div>

                    {/* Județ – dropdown */}
                    <div>
                      <label
                        htmlFor="addr-judet"
                        style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-muted)' }}
                      >
                        {lang === 'ro' ? 'Județ' : 'County'}
                        <span style={{ color: 'var(--primary)', marginLeft: 3 }}>*</span>
                      </label>
                      <select
                        id="addr-judet"
                        value={judet}
                        onChange={e => setJudet(e.target.value)}
                        style={{
                          ...inputBase,
                          cursor: 'pointer',
                          borderColor: judet ? '#22c55e' : 'var(--border)',
                          boxShadow: judet ? '0 0 0 3px rgba(34,197,94,0.12)' : 'none',
                        }}
                      >
                        <option value="">— Selectați județul —</option>
                        {JUDETE.map(j => <option key={j} value={j}>{j}</option>)}
                      </select>
                      {!judet && (
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '3px 0 0', paddingLeft: 2 }}>
                          Selectați județul de livrare
                        </p>
                      )}
                    </div>

                    {/* Cod Poștal */}
                    <div>
                      <FieldInput
                        id="addr-cod-postal"
                        label={lang === 'ro' ? 'Cod Poștal' : 'Postal Code'}
                        value={codPostal}
                        onChange={handleCodPostal}
                        onBlur={() => setCodPostalErr(validateCodPostal(codPostal))}
                        placeholder="Ex. 400000"
                        error={codPostalErr}
                        required
                        maxLength={6}
                        inputMode="numeric"
                      />
                    </div>

                    {/* Telefon Contact Livrare */}
                    <div>
                      <FieldInput
                        id="addr-telefon"
                        label={lang === 'ro' ? 'Telefon Contact' : 'Contact Phone'}
                        value={telefon}
                        onChange={handlePhoneChange}
                        onBlur={handlePhoneBlur}
                        placeholder="Ex. 0712345678"
                        error={telefonErr}
                        required
                        maxLength={20}
                        type="tel"
                      />
                    </div>

                    {/* Observații – span 2 */}
                    <div style={{ gridColumn: 'span 2' }}>
                      <label
                        htmlFor="addr-observatii"
                        style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-muted)' }}
                      >
                        {lang === 'ro' ? 'Observații / Instrucțiuni livrare' : 'Delivery Remarks / Instructions'}
                        <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 5 }}>(opțional)</span>
                      </label>
                      <textarea
                        id="addr-observatii"
                        value={observatii}
                        onChange={e => setObservatii(e.target.value)}
                        rows={3}
                        maxLength={500}
                        placeholder="Ex. Livrare între orele 9:00 - 17:00 la recepția clinicii."
                        style={{
                          ...inputBase,
                          resize: 'vertical',
                          minHeight: 80,
                        }}
                      />
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', margin: '2px 0 0' }}>
                        {observatii.length}/500
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sumar comandă */}
            <div style={{ background: 'var(--surface-2)', padding: 24, borderRadius: 12, alignSelf: 'start', position: 'sticky', top: 20 }}>
              <h3 style={{ marginBottom: 20 }}>{lang === 'ro' ? 'Sumar comandă' : 'Order summary'}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span>{lang === 'ro' ? 'Produse' : 'Items'} ({count})</span>
                <span>{formatCurrency(total, currency, lang === 'ro' ? 'ro-RO' : 'en-US')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, fontWeight: 700, fontSize: 18, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <span>Total</span>
                <span>{formatCurrency(total, currency, lang === 'ro' ? 'ro-RO' : 'en-US')}</span>
              </div>

              {error && (
                <div style={{
                  color: '#ef4444',
                  marginBottom: 16,
                  fontSize: 13,
                  background: 'rgba(239,68,68,0.08)',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(239,68,68,0.2)',
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-start',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 1 }}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              <button
                className="btn-primary"
                style={{ width: '100%', opacity: submitting ? 0.7 : 1, transition: 'opacity .2s' }}
                onClick={handleCheckout}
                disabled={submitting}
              >
                {submitting
                  ? (lang === 'ro' ? '⏳ Se procesează...' : '⏳ Processing...')
                  : !user
                  ? (lang === 'ro' ? 'Conectează-te pentru a plasa comanda' : 'Login to place order')
                  : (lang === 'ro' ? 'Plasează comanda' : 'Place order')}
              </button>

              {!user && (
                <p style={{ marginTop: 12, fontSize: 12, textAlign: 'center', color: 'var(--text-muted)' }}>
                  {lang === 'ro' ? 'Trebuie să fii logat pentru a finaliza comanda.' : 'You must be logged in to complete the order.'}
                </p>
              )}

              {/* Info validare */}
              {user && (
                <div style={{ marginTop: 16, padding: '10px 12px', background: 'rgba(59,130,246,0.06)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.15)' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                    🔒 Adresa de livrare este verificată și validată înainte de procesare. Codul poștal trebuie să fie din 6 cifre (format România).
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer lang={lang} />
    </>
  );
}
