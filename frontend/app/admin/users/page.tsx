'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
  adminGetUsers,
  adminChangeUserPassword,
  adminToggleUserActive,
  adminDeleteUser,
  type AdminUser,
} from '@/lib/adminApi';

// ─── Modal Schimbare Parolă ───────────────────────────────────────────────────
function ChangePasswordModal({
  user,
  onClose,
  onSuccess,
}: {
  user: AdminUser;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Parola trebuie să aibă minim 6 caractere.'); return; }
    if (password !== confirm) { setError('Parolele nu coincid.'); return; }
    setLoading(true);
    try {
      const res = await adminChangeUserPassword(user.id, password);
      onSuccess(res.message);
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Eroare la schimbarea parolei.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>
            Schimbă parola
          </h3>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>
        <p style={{ margin: '0 0 18px', fontSize: 13, color: 'var(--muted)' }}>
          Utilizator: <strong style={{ color: 'var(--text)' }}>{user.email}</strong>
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Parolă nouă</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minim 6 caractere"
              style={inputStyle}
              autoFocus
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Confirmă parola</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repetă parola"
              style={inputStyle}
            />
          </div>
          {error && (
            <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#f87171' }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>Anulează</button>
            <button type="submit" disabled={loading} style={primaryBtnStyle}>
              {loading ? 'Se salvează...' : 'Salvează parola'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal Confirmare Ștergere ────────────────────────────────────────────────
function DeleteConfirmModal({
  user,
  onClose,
  onConfirm,
  loading,
}: {
  user: AdminUser;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ ...modalStyle, maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>
            🗑️
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>Confirmare ștergere</h3>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 }}>
            Ești sigur că vrei să ștergi contul <strong style={{ color: 'var(--text)' }}>{user.email}</strong>?<br />
            <span style={{ color: '#f87171', fontSize: 13 }}>Această acțiune este ireversibilă și va șterge toate datele contului.</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ ...cancelBtnStyle, flex: 1 }}>Anulează</button>
          <button onClick={onConfirm} disabled={loading} style={{ ...deleteBtnStyle, flex: 1 }}>
            {loading ? 'Se șterge...' : 'Da, șterge contul'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pagina Principală ────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filtered, setFiltered] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [passwordModal, setPasswordModal] = useState<AdminUser | null>(null);
  const [deleteModal, setDeleteModal] = useState<AdminUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminGetUsers();
      setUsers(data);
      setFiltered(data);
    } catch (err) {
      showToast((err as Error).message || 'Eroare la încărcarea utilizatorilor.', 'err');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  useEffect(() => {
    const q = search.toLowerCase().trim();
    if (!q) { setFiltered(users); return; }
    setFiltered(users.filter(u =>
      u.email.toLowerCase().includes(q) ||
      u.name.toLowerCase().includes(q)
    ));
  }, [search, users]);

  async function handleToggleActive(user: AdminUser) {
    setTogglingId(user.id);
    try {
      const res = await adminToggleUserActive(user.id);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isVerified: res.isVerified } : u));
      showToast(res.message);
    } catch (err) {
      showToast((err as Error).message || 'Eroare.', 'err');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteModal) return;
    setDeleteLoading(true);
    try {
      const res = await adminDeleteUser(deleteModal.id);
      setUsers(prev => prev.filter(u => u.id !== deleteModal.id));
      setDeleteModal(null);
      showToast(res.message);
    } catch (err) {
      showToast((err as Error).message || 'Eroare la ștergere.', 'err');
    } finally {
      setDeleteLoading(false);
    }
  }

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isVerified).length;
  const inactiveUsers = users.filter(u => !u.isVerified).length;
  const totalOrders = users.reduce((s, u) => s + u.orderCount, 0);

  return (
    <AdminLayout title="Gestiune Utilizatori">
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: toast.type === 'ok' ? 'rgba(22,163,74,0.95)' : 'rgba(220,38,38,0.95)',
          color: '#fff', borderRadius: 10, padding: '12px 20px', fontSize: 14,
          fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          animation: 'slideInRight 0.3s ease',
          backdropFilter: 'blur(8px)',
        }}>
          {toast.type === 'ok' ? '✓ ' : '✗ '}{toast.msg}
        </div>
      )}

      {/* Modals */}
      {passwordModal && (
        <ChangePasswordModal
          user={passwordModal}
          onClose={() => setPasswordModal(null)}
          onSuccess={(msg) => showToast(msg)}
        />
      )}
      {deleteModal && (
        <DeleteConfirmModal
          user={deleteModal}
          onClose={() => setDeleteModal(null)}
          onConfirm={handleDeleteConfirm}
          loading={deleteLoading}
        />
      )}

      {loading ? (
        <div className="admin-loading">
          <div className="login-spinner" style={{ width: 32, height: 32, borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
        </div>
      ) : (
        <>
          {/* Statistici rapide */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'Total conturi', value: totalUsers, icon: '👥', color: 'var(--primary)' },
              { label: 'Conturi active', value: activeUsers, icon: '✅', color: '#16a34a' },
              { label: 'Neactivate', value: inactiveUsers, icon: '⏳', color: '#d97706' },
              { label: 'Total comenzi', value: totalOrders, icon: '📦', color: '#7c3aed' },
            ].map(card => (
              <div key={card.label} className="admin-stat-card">
                <div className="admin-stat-icon">{card.icon}</div>
                <div className="admin-stat-value" style={{ color: card.color }}>{card.value}</div>
                <div className="admin-stat-label">{card.label}</div>
              </div>
            ))}
          </div>

          {/* Card tabel */}
          <div className="admin-card">
            <div className="admin-card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
              <h2 className="admin-card-title">Conturi utilizatori ({filtered.length})</h2>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Căutare */}
                <div style={{ position: 'relative' }}>
                  <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Caută după email sau nume..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ ...inputStyle, paddingLeft: 32, width: 240, margin: 0 }}
                  />
                </div>
                <button onClick={loadUsers} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 14px', fontSize: 13, color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
                    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                  </svg>
                  Reîmprospătează
                </button>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--muted)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <p style={{ margin: 0 }}>Nu am găsit utilizatori{search ? ` pentru "${search}"` : ''}.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Utilizator</th>
                      <th>Rol</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'center' }}>Comenzi</th>
                      <th>Înregistrat</th>
                      <th style={{ textAlign: 'right' }}>Acțiuni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(user => (
                      <tr key={user.id}>
                        {/* Avatar + info */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: '50%',
                              background: user.isVerified
                                ? 'linear-gradient(135deg, var(--primary), var(--accent))'
                                : 'var(--surface-2)',
                              border: '1px solid var(--border)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 14, fontWeight: 700, color: user.isVerified ? '#fff' : 'var(--muted)',
                              flexShrink: 0,
                            }}>
                              {user.name?.[0]?.toUpperCase() ?? user.email[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{user.name}</div>
                              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{user.email}</div>
                            </div>
                          </div>
                        </td>
                        {/* Rol */}
                        <td>
                          <span className="admin-badge" style={{
                            background: user.role === 'admin' ? 'rgba(124,58,237,0.15)' : 'rgba(99,102,241,0.1)',
                            color: user.role === 'admin' ? '#a78bfa' : 'var(--muted)',
                            border: '1px solid',
                            borderColor: user.role === 'admin' ? 'rgba(124,58,237,0.3)' : 'var(--border)',
                          }}>
                            {user.role}
                          </span>
                        </td>
                        {/* Status */}
                        <td>
                          <span className={`admin-badge ${user.isVerified ? 'badge-ok' : 'badge-err'}`} style={{ fontSize: 12 }}>
                            {user.isVerified ? '✓ Activ' : '⏳ Neactivat'}
                          </span>
                        </td>
                        {/* Comenzi */}
                        <td style={{ textAlign: 'center' }}>
                          {user.orderCount > 0 ? (
                            <span style={{ fontWeight: 700, color: 'var(--text)', background: 'rgba(124,58,237,0.12)', borderRadius: 20, padding: '2px 10px', fontSize: 13 }}>
                              {user.orderCount}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>
                          )}
                        </td>
                        {/* Data */}
                        <td style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                          {new Date(user.createdAt).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        {/* Acțiuni */}
                        <td>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                            {/* Schimbă parola */}
                            <button
                              onClick={() => setPasswordModal(user)}
                              title="Schimbă parola"
                              style={actionBtnStyle('#2563eb')}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                              </svg>
                              Parolă
                            </button>
                            {/* Toggle activ */}
                            <button
                              onClick={() => handleToggleActive(user)}
                              disabled={togglingId === user.id}
                              title={user.isVerified ? 'Dezactivează contul' : 'Activează contul'}
                              style={actionBtnStyle(user.isVerified ? '#d97706' : '#16a34a')}
                            >
                              {togglingId === user.id ? (
                                <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  {user.isVerified
                                    ? <><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></>
                                    : <><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></>
                                  }
                                </svg>
                              )}
                              {user.isVerified ? 'Dezactivează' : 'Activează'}
                            </button>
                            {/* Șterge */}
                            <button
                              onClick={() => setDeleteModal(user)}
                              title="Șterge contul"
                              style={actionBtnStyle('#dc2626')}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                              </svg>
                              Șterge
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
        </>
      )}

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AdminLayout>
  );
}

// ─── Stiluri inline ───────────────────────────────────────────────────────────
const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 1000,
  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 24,
};

const modalStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: 28,
  width: '100%',
  maxWidth: 480,
  boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
};

const closeBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--muted)', fontSize: 18, padding: 4,
  lineHeight: 1, borderRadius: 6,
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600,
  color: 'var(--muted)', marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--surface-2)',
  color: 'var(--text)', fontSize: 14, outline: 'none',
  boxSizing: 'border-box',
};

const primaryBtnStyle: React.CSSProperties = {
  background: 'var(--primary)', color: '#fff',
  border: 'none', borderRadius: 8, padding: '10px 20px',
  fontSize: 14, fontWeight: 600, cursor: 'pointer',
};

const cancelBtnStyle: React.CSSProperties = {
  background: 'var(--surface-2)', color: 'var(--text)',
  border: '1px solid var(--border)', borderRadius: 8, padding: '10px 20px',
  fontSize: 14, fontWeight: 500, cursor: 'pointer',
};

const deleteBtnStyle: React.CSSProperties = {
  background: 'rgba(220,38,38,0.1)', color: '#f87171',
  border: '1px solid rgba(220,38,38,0.3)', borderRadius: 8, padding: '10px 20px',
  fontSize: 14, fontWeight: 600, cursor: 'pointer',
};

function actionBtnStyle(color: string): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500,
    border: `1px solid ${color}30`, background: `${color}12`,
    color, cursor: 'pointer', whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
  };
}
