'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';
import { useUser } from '@/contexts/UserContext';
import { formatCurrency, createOrder } from '@/lib/api';

export default function CartPage() {
  const router = useRouter();
  const { items, count, clearCart } = useCart();
  const { user } = useUser();
  const [lang, setLang] = useState<'ro' | 'en'>('ro');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Câmpuri adresă de livrare
  const [strada, setStrada] = useState('');
  const [bloc, setBloc] = useState('');
  const [oras, setOras] = useState('');
  const [judet, setJudet] = useState('');
  const [codPostal, setCodPostal] = useState('');
  const [observatii, setObservatii] = useState('');

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const currency = items.length > 0 ? items[0].currency : 'USD';

  async function handleCheckout() {
    if (!user) {
      router.push('/autentificare?redirect=/cos');
      return;
    }

    if (!strada || !oras || !judet || !codPostal) {
      setError(lang === 'ro' ? 'Vă rugăm să completați toate câmpurile obligatorii pentru livrare (*).' : 'Please fill in all required delivery fields (*).');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await createOrder({
        items,
        deliveryAddress: {
          strada,
          bloc: bloc || undefined,
          oras,
          judet,
          codPostal,
          observatii: observatii || undefined,
        },
      });
      setSuccess(true);
      clearCart();
    } catch (err) {
      setError(lang === 'ro' ? 'Eroare la plasarea comenzii. Vă rugăm să reîncercați.' : 'Error placing the order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

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
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
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
                <div style={{ marginTop: 40, background: 'var(--surface-2)', padding: 28, borderRadius: 12, border: '1px solid var(--border)' }}>
                  <h3 style={{ marginBottom: 20, fontSize: 18, fontWeight: 700 }}>
                    {lang === 'ro' ? 'Adresă de livrare' : 'Shipping Address'}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>
                        {lang === 'ro' ? 'Strada și Numărul *' : 'Street and Number *'}
                      </label>
                      <input
                        type="text"
                        value={strada}
                        onChange={e => setStrada(e.target.value)}
                        required
                        placeholder="Ex. Str. Clinicilor, Nr. 12"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>
                        {lang === 'ro' ? 'Bloc, Scară, Apartament (opțional)' : 'Building, Stair, Apartment (optional)'}
                      </label>
                      <input
                        type="text"
                        value={bloc}
                        onChange={e => setBloc(e.target.value)}
                        placeholder="Ex. Bl. A, Sc. 1, Ap. 5"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>
                        {lang === 'ro' ? 'Oraș *' : 'City *'}
                      </label>
                      <input
                        type="text"
                        value={oras}
                        onChange={e => setOras(e.target.value)}
                        required
                        placeholder="Ex. Cluj-Napoca"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>
                        {lang === 'ro' ? 'Județ *' : 'County *'}
                      </label>
                      <input
                        type="text"
                        value={judet}
                        onChange={e => setJudet(e.target.value)}
                        required
                        placeholder="Ex. Cluj"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>
                        {lang === 'ro' ? 'Cod Poștal *' : 'Postal Code *'}
                      </label>
                      <input
                        type="text"
                        value={codPostal}
                        onChange={e => setCodPostal(e.target.value)}
                        required
                        placeholder="Ex. 400000"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)' }}
                      />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>
                        {lang === 'ro' ? 'Observații / Instrucțiuni livrare (opțional)' : 'Delivery Remarks / Instructions (optional)'}
                      </label>
                      <textarea
                        value={observatii}
                        onChange={e => setObservatii(e.target.value)}
                        rows={3}
                        placeholder="Ex. Livrare între orele 9:00 - 17:00 la recepția clinicii."
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)', resize: 'vertical' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ background: 'var(--surface-2)', padding: 24, borderRadius: 12, alignSelf: 'start' }}>
              <h3 style={{ marginBottom: 20 }}>{lang === 'ro' ? 'Sumar comandă' : 'Order summary'}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span>{lang === 'ro' ? 'Produse' : 'Items'} ({count})</span>
                <span>{formatCurrency(total, currency, lang === 'ro' ? 'ro-RO' : 'en-US')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, fontWeight: 700, fontSize: 18, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <span>Total</span>
                <span>{formatCurrency(total, currency, lang === 'ro' ? 'ro-RO' : 'en-US')}</span>
              </div>

              {error && <div style={{ color: 'var(--error)', marginBottom: 16, fontSize: 14 }}>{error}</div>}

              <button
                className="btn-primary"
                style={{ width: '100%' }}
                onClick={handleCheckout}
                disabled={submitting}
              >
                {submitting ? (lang === 'ro' ? 'Se procesează...' : 'Processing...') : (lang === 'ro' ? 'Plasează comanda' : 'Place order')}
              </button>
              
              {!user && (
                <p style={{ marginTop: 12, fontSize: 12, textAlign: 'center', color: 'var(--text-muted)' }}>
                  {lang === 'ro' ? 'Trebuie să fii logat pentru a finaliza comanda.' : 'You must be logged in to complete the order.'}
                </p>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer lang={lang} />
    </>
  );
}
