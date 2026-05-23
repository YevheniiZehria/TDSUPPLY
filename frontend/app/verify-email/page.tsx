'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Se activează contul dumneavoastră...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de verificare lipsă. Vă rugăm să folosiți link-ul primit pe email.');
      return;
    }

    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    fetch(`${base}/auth/verify-email?token=${token}`)
      .then(async (res) => {
        if (res.ok) {
          setStatus('success');
          setMessage('Contul dumneavoastră a fost activat cu succes! Acum vă puteți autentifica pe platforma B2B.');
        } else {
          const body = await res.json().catch(() => ({}));
          setStatus('error');
          setMessage(body.message ?? 'Token de verificare invalid sau expirat.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('A apărut o eroare de rețea. Vă rugăm să reîncercați.');
      });
  }, [token]);

  return (
    <div className="login-page">
      <div className="login-bg" />

      <div className="login-topbar">
        <Link href="/" className="login-back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Înapoi la site
        </Link>
      </div>

      <div className="login-center">
        <div className="login-card" style={{ textAlign: 'center', padding: '40px 30px' }}>
          <div className="login-logo-wrap" style={{ marginBottom: 30 }}>
            <Link href="/">
              <img src="/logo-td-supply.png" alt="TD Supply" className="login-logo" style={{ maxHeight: 40 }} />
            </Link>
          </div>

          {status === 'loading' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <span className="login-spinner" style={{ width: 40, height: 40, borderWidth: 4, borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
              <h1 className="login-title" style={{ fontSize: 20 }}>Se activează contul...</h1>
              <p className="login-subtitle" style={{ margin: 0 }}>{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%', background: '#f0fdf4', border: '2px solid #22c55e',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#166534', fontSize: 28
              }}>
                ✓
              </div>
              <h1 className="login-title" style={{ fontSize: 20, color: '#166534' }}>Cont activat!</h1>
              <p className="login-subtitle" style={{ margin: '0 0 10px 0', lineHeight: 1.5 }}>{message}</p>
              
              <Link href="/autentificare" className="login-btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Autentifică-te pe site
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%', background: '#fef2f2', border: '2px solid #ef4444',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#991b1b', fontSize: 28
              }}>
                ⚠
              </div>
              <h1 className="login-title" style={{ fontSize: 20, color: '#991b1b' }}>Activare eșuată</h1>
              <p className="login-subtitle" style={{ margin: '0 0 10px 0', lineHeight: 1.5 }}>{message}</p>
              
              <Link href="/autentificare" className="login-btn" style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text)', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                Înapoi la autentificare
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="login-page">
        <div className="login-bg" />
        <div className="login-center">
          <div className="login-card" style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <span className="login-spinner" style={{ width: 32, height: 32 }} />
          </div>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
