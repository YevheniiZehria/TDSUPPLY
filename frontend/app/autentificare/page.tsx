'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/';
  const { user, login, register, loading } = useUser();

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>('');

  // Încarcă și initializează Cloudflare Turnstile
  useEffect(() => {
    let script = document.getElementById('turnstile-script') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = 'turnstile-script';
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    (window as any).onloadTurnstileCallback = () => {
      if ((window as any).turnstile) {
        try {
          (window as any).turnstile.render('#turnstile-container', {
            sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY || '1x00000000000000000000AA',
            callback: (token: string) => {
              setTurnstileToken(token);
            },
          });
        } catch (e) {}
      }
    };

    if ((window as any).turnstile) {
      try {
        (window as any).turnstile.render('#turnstile-container', {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY || '1x00000000000000000000AA',
          callback: (token: string) => {
            setTurnstileToken(token);
          },
        });
      } catch (e) {}
    }

    return () => {
      delete (window as any).onloadTurnstileCallback;
    };
  }, [isRegister]);

  // Dacă deja logat, redirect direct
  useEffect(() => {
    if (!loading && user) router.replace(redirect);
  }, [user, loading, redirect, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isRegister) {
        if (!name.trim()) {
          throw new Error('Te rugăm să introduci denumirea.');
        }
        await register(email.trim(), password, name.trim(), turnstileToken);
        setSuccess(true);
        // Nu ne mai logăm automat. Utilizatorul trebuie să își confirme emailul.
      } else {
        await login(email.trim(), password, turnstileToken);
        setSuccess(true);
        setTimeout(() => router.push(redirect), 1000);
      }
    } catch (err) {
      setError((err as Error).message || 'Operațiune eșuată.');
      if ((window as any).turnstile) {
        try {
          (window as any).turnstile.reset('#turnstile-container');
        } catch (e) {}
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg" />

      {/* Topbar */}
      <div className="login-topbar">
        <Link href="/" className="login-back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Înapoi la site
        </Link>
        <Link href="/login" className="login-back-link" style={{ opacity: 0.6, fontSize: 12 }}>
          Ești admin? →
        </Link>
      </div>

      <div className="login-center">
        <div className="login-card">
          <div className="login-logo-wrap">
            <Link href="/"><img src="/logo-td-supply.png" alt="TD Supply" className="login-logo" /></Link>
          </div>

          <div className="login-header">
            <h1 className="login-title">{isRegister ? 'Creare cont B2B' : 'Contul tău B2B'}</h1>
            <p className="login-subtitle">
              {isRegister 
                ? 'Înregistrează contul B2B pentru a deveni partener' 
                : 'Autentifică-te pentru a comanda și gestiona comenzile'}
            </p>
          </div>

          {success && (
            <div className="login-success" style={{ lineHeight: '1.4' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              <span>{isRegister ? 'Cont înregistrat! Te rugăm să îți verifici email-ul pentru link-ul de confirmare și activare.' : 'Autentificare reușită! Se redirecționează...'}</span>
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

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {isRegister && (
              <div className="login-field">
                <label className="login-label" htmlFor="user-name">Denumire</label>
                <div className="login-input-wrap">
                  <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  <input
                    id="user-name"
                    type="text"
                    className="login-input"
                    placeholder="Cabinet Dentar Dr. Popescu"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    disabled={submitting || success}
                  />
                </div>
              </div>
            )}

            <div className="login-field">
              <label className="login-label" htmlFor="user-email">Adresă email</label>
              <div className="login-input-wrap">
                <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  id="user-email"
                  type="email"
                  className="login-input"
                  placeholder="email@cabinet.ro"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  disabled={submitting || success}
                />
              </div>
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="user-password">Parolă</label>
              <div className="login-input-wrap">
                <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <input
                  id="user-password"
                  type={showPass ? 'text' : 'password'}
                  className="login-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={submitting || success}
                />
                <button type="button" className="login-toggle-pass" onClick={() => setShowPass(v => !v)}>
                  {showPass
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {!isRegister && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -8, marginBottom: 16 }}>
                <Link href="/recuperare-parola" style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                  Ai uitat parola?
                </Link>
              </div>
            )}

            {/* Turnstile Captcha Widget */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div id="turnstile-container"></div>
            </div>

            <button
              id="btn-user-login"
              type="submit"
              className="login-btn"
              disabled={submitting || success || !email || !password || (isRegister && !name)}
            >
              {submitting
                ? <><span className="login-spinner" /> Se procesează...</>
                : isRegister 
                  ? <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg> Creează cont B2B</>
                  : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg> Intră în cont</>
              }
            </button>
          </form>

          <div className="login-card-footer">
            {isRegister ? (
              <>
                <span>Ai deja cont?</span>
                <button 
                  type="button" 
                  className="login-contact-link" 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', padding: 0, fontWeight: 'bold' }} 
                  onClick={() => { setIsRegister(false); setError(''); }}
                >
                  Autentifică-te
                </button>
              </>
            ) : (
              <>
                <span>Nu ai cont?</span>
                <button 
                  type="button" 
                  className="login-contact-link" 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', padding: 0, fontWeight: 'bold' }} 
                  onClick={() => { setIsRegister(true); setError(''); }}
                >
                  Înregistrează-te acum B2B
                </button>
              </>
            )}
          </div>

          <div className="login-security">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Conexiune securizată SSL · GDPR Compliant
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AutentificarePage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
