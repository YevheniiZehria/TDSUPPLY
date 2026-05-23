'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminGetOrders, adminUpdateOrderStatus } from '@/lib/adminApi';
import { formatCurrency } from '@/lib/api';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      const data = await adminGetOrders();
      setOrders(data);
    } catch (err) {
      setError('Eroare la încărcarea comenzilor.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id: string, newStatus: string) {
    try {
      await adminUpdateOrderStatus(id, newStatus);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    } catch (err) {
      alert('Eroare la actualizarea statusului.');
    }
  }

  async function downloadInvoicePdf(orderId: string) {
    try {
      const token = localStorage.getItem('admin_token');
      const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
      const res = await fetch(`${BASE}/orders/${orderId}/pdf/admin`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error('Eroare la descărcarea facturii.');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factura-${orderId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Nu s-a putut genera factura PDF.');
    }
  }

  const statusColors: Record<string, string> = {
    pending: '#eab308',
    processing: '#3b82f6',
    shipped: '#a855f7',
    delivered: '#22c55e',
    cancelled: '#ef4444',
  };

  return (
    <AdminLayout title="Gestionare Comenzi">
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>Se încarcă...</div>
      ) : error ? (
        <div style={{ color: 'var(--error)', padding: 20 }}>{error}</div>
      ) : orders.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center' }}>Nu există comenzi.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID Comandă</th>
                <th>Client</th>
                <th>Dată</th>
                <th>Total</th>
                <th>Status</th>
                <th>Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 600 }}>#{order.id.split('-')[1]}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{order.userName}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{order.userEmail}</div>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString('ro-RO')}</td>
                  <td>{formatCurrency(order.total, order.currency)}</td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      background: `${statusColors[order.status]}20`,
                      color: statusColors[order.status]
                    }}>
                      {order.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <select
                        className="admin-input"
                        style={{ padding: '4px 8px', fontSize: 13, width: 'auto', margin: 0 }}
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button
                        onClick={() => downloadInvoicePdf(order.id)}
                        className="admin-action-icon-btn"
                        style={{
                          padding: 6,
                          fontSize: 14,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        title="Descarcă Factură PDF"
                      >
                        📄
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
