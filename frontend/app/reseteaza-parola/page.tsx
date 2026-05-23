'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Tokenul de resetare lipsește din link.');
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Token de resetare invalid.');
      return;
    }

    if (password.length < 6) {
      setError('Parola trebuie să aibă cel puțin 6 caractere.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Cele două parole nu coincid.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message ?? 'Nu s-a putut reseta parola. Token expirat sau invalid.');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/autentificare');
      }, 2000);
    } catch (err) {
      setError((err as Error).message || 'Eroare resetare parolă.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg" />

      {/* Topbar */}
      <div className="login-topbar">
        <Link href="/autentificare" className="login-back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Înapoi la Autentificare
        </Link>
      </div>

      <div className="login-center">
        <div className="login-card">
          <div className="login-logo-wrap">
            <Link href="/"><img src="/logo-td-supply.png" alt="TD Supply" className="login-logo" /></Link>
          </div>

          <div className="login-header">
            <h1 className="login-title">Resetare Parolă</h1>
            <p className="login-subtitle">
              Introduceți noua parolă pentru contul dumneavoastră B2B.
            </p>
          </div>

          {success && (
            <div className="login-success">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Parola a fost resetată cu succes! Se redirecționează spre autentificare...
            </div>
          )}

          {error && (
            <div className="login-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {!success && token && (
            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <div className="login-field">
                <label className="login-label" htmlFor="new-password">Parolă Nouă</label>
                <div className="login-input-wrap">
                  <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                  <input
                    id="new-password"
                    type={showPass ? 'text' : 'password'}
                    className="login-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    disabled={submitting}
                  />
                  <button type="button" className="login-toggle-pass" onClick={() => setShowPass(v => !v)}>
                    {showPass
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              <div className="login-field">
                <label className="login-label" htmlFor="confirm-password">Confirmă Parola</label>
                <div className="login-input-wrap">
                  <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                  <input
                    id="confirm-password"
                    type={showPass ? 'text' : 'password'}
                    className="login-input"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="login-btn"
                disabled={submitting || !password || !confirmPassword}
              >
                {submitting
                  ? <><span className="login-spinner" /> Se actualizează...</>
                  : 'Actualizează Parola'
                }
              </button>
            </form>
          )}

          <div className="login-security" style={{ marginTop: 24 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Conexiune securizată SSL
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
