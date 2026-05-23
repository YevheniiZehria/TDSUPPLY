'use client';

import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/lib/api';
import Link from 'next/link';

export default function CartDrawer({ lang }: { lang: 'ro' | 'en' }) {
  const { items, count, isDrawerOpen, closeDrawer, updateQuantity, removeItem } = useCart();

  if (!isDrawerOpen) return null;

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const currency = items.length > 0 ? items[0].currency : 'USD';

  return (
    <div className="cart-drawer-overlay" onClick={closeDrawer}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="cart-drawer-header">
          <h3>{lang === 'ro' ? 'Coșul tău' : 'Your Cart'} ({count})</h3>
          <button className="cart-drawer-close" onClick={closeDrawer}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="cart-drawer-content">
          {items.length === 0 ? (
            <div className="cart-drawer-empty">
              <p>{lang === 'ro' ? 'Coșul este gol' : 'Your cart is empty'}</p>
              <button className="btn-primary" onClick={closeDrawer} style={{ marginTop: 16 }}>
                {lang === 'ro' ? 'Continuă cumpărăturile' : 'Continue shopping'}
              </button>
            </div>
          ) : (
            <div className="cart-drawer-list">
              {items.map((item) => (
                <div key={item.id} className="cart-drawer-item">
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-price">
                      {formatCurrency(item.price, item.currency, lang === 'ro' ? 'ro-RO' : 'en-US')}
                    </div>
                  </div>
                  <div className="cart-item-actions">
                    <div className="quantity-controls">
                      <button onClick={() => updateQuantity(item.id, -1)}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                    </div>
                    <button className="cart-item-remove" onClick={() => removeItem(item.id)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-drawer-total">
              <span>Total</span>
              <span>{formatCurrency(total, currency, lang === 'ro' ? 'ro-RO' : 'en-US')}</span>
            </div>
            <Link href="/cos" className="btn-primary" style={{ width: '100%', textAlign: 'center' }} onClick={closeDrawer}>
              {lang === 'ro' ? 'Finalizează comanda' : 'Checkout'}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
