'use client';

import { useState } from 'react';
import Link from 'next/link';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      const res = await fetch(`${BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message ?? 'A apărut o eroare. Vă rugăm să reîncercați.');
      }

      setSuccess(true);
      setMessage(data.message || 'Solicitarea a fost trimisă cu succes. Verificați emailul.');
    } catch (err) {
      setError((err as Error).message || 'Nu s-a putut trimite solicitarea.');
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
            <h1 className="login-title">Recuperare Parolă</h1>
            <p className="login-subtitle">
              Introduceți adresa de email asociată contului B2B pentru a primi link-ul de resetare.
            </p>
          </div>

          {success && (
            <div className="login-success" style={{ display: 'flex', alignItems: 'flex-start', textAlign: 'left' }}>
              <span style={{ marginRight: 8, fontSize: 18 }}>✉️</span>
              <div>{message}</div>
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

          {!success && (
            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <div className="login-field">
                <label className="login-label" htmlFor="reset-email">Adresă email cont</label>
                <div className="login-input-wrap">
                  <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <input
                    id="reset-email"
                    type="email"
                    className="login-input"
                    placeholder="email@cabinet.ro"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="login-btn"
                disabled={submitting || !email}
              >
                {submitting
                  ? <><span className="login-spinner" /> Se trimite...</>
                  : 'Trimite link-ul de resetare'
                }
              </button>
            </form>
          )}

          {success && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Link href="/autentificare" className="login-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
                Înapoi la Autentificare
              </Link>
            </div>
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
