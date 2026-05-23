'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const t = {
  ro: {
    title: 'Conectare B2B',
    subtitle: 'Accesați contul dvs. de distribuitor',
    emailLabel: 'Adresă email',
    emailPlaceholder: 'admin@exemplu.ro',
    passLabel: 'Parolă',
    passPlaceholder: '••••••••',
    btnLogin: 'Conectare',
    btnLoading: 'Se conectează...',
    forgotPass: 'Ai uitat parola?',
    noAccount: 'Nu ai cont?',
    contactUs: 'Contactează-ne',
    backHome: 'Înapoi la pagina principală',
    errorInvalid: 'Email sau parolă incorectă.',
    errorServer: 'Eroare de server. Încearcă din nou.',
    successMsg: 'Autentificare reușită! Redirecționare...',
    showPass: 'Afișează parola',
    hidePass: 'Ascunde parola',
  },
  en: {
    title: 'B2B Login',
    subtitle: 'Access your distributor account',
    emailLabel: 'Email address',
    emailPlaceholder: 'admin@example.com',
    passLabel: 'Password',
    passPlaceholder: '••••••••',
    btnLogin: 'Sign In',
    btnLoading: 'Signing in...',
    forgotPass: 'Forgot password?',
    noAccount: "Don't have an account?",
    contactUs: 'Contact us',
    backHome: 'Back to homepage',
    errorInvalid: 'Invalid email or password.',
    errorServer: 'Server error. Please try again.',
    successMsg: 'Login successful! Redirecting...',
    showPass: 'Show password',
    hidePass: 'Hide password',
  },
};

export default function LoginPage() {
  const router = useRouter();
  const [lang, setLang] = useState<'ro' | 'en'>('ro');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const txt = t[lang];

  // Dacă există deja token valid, redirecționează
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      router.push('/admin');
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json() as { accessToken: string };
        localStorage.setItem('admin_token', data.accessToken);
        setSuccess(true);
        setTimeout(() => router.push('/admin'), 1200);
      } else {
        const payload = await res.json().catch(() => ({})) as { message?: string | string[] };
        const backendMessage = Array.isArray(payload.message)
          ? payload.message.join(', ')
          : payload.message;

        if (res.status === 400 || res.status === 401) {
          setError(backendMessage || txt.errorInvalid);
        } else {
          setError(backendMessage || txt.errorServer);
        }
      }
    } catch {
      setError(txt.errorServer);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      {/* Background pattern */}
      <div className="login-bg" />

      {/* Top bar cu lang switcher */}
      <div className="login-topbar">
        <Link href="/" className="login-back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          {txt.backHome}
        </Link>
        <div className="login-lang">
          <button
            className={`lang-btn ${lang === 'ro' ? 'active' : ''}`}
            onClick={() => setLang('ro')}
          >RO</button>
          <button
            className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
            onClick={() => setLang('en')}
          >EN</button>
        </div>
      </div>

      {/* Card central */}
      <div className="login-center">
        <div className="login-card">
          {/* Logo */}
          <div className="login-logo-wrap">
            <Link href="/">
              <img src="/logo-td-supply.png" alt="TD Supply" className="login-logo" />
            </Link>
          </div>

          {/* Titlu */}
          <div className="login-header">
            <h1 className="login-title">{txt.title}</h1>
            <p className="login-subtitle">{txt.subtitle}</p>
          </div>

          {/* Mesaj succes */}
          {success && (
            <div className="login-success">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              {txt.successMsg}
            </div>
          )}

          {/* Mesaj eroare */}
          {error && (
            <div className="login-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Formular */}
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="login-field">
              <label className="login-label" htmlFor="login-email">
                {txt.emailLabel}
              </label>
              <div className="login-input-wrap">
                <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  id="login-email"
                  type="email"
                  className="login-input"
                  placeholder={txt.emailPlaceholder}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  disabled={loading || success}
                />
              </div>
            </div>

            {/* Parolă */}
            <div className="login-field">
              <div className="login-label-row">
                <label className="login-label" htmlFor="login-password">
                  {txt.passLabel}
                </label>
                <button type="button" className="login-forgot">
                  {txt.forgotPass}
                </button>
              </div>
              <div className="login-input-wrap">
                <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  className="login-input"
                  placeholder={txt.passPlaceholder}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={loading || success}
                />
                <button
                  type="button"
                  className="login-toggle-pass"
                  onClick={() => setShowPass(v => !v)}
                  aria-label={showPass ? txt.hidePass : txt.showPass}
                >
                  {showPass ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Buton submit */}
            <button
              id="btn-login-submit"
              type="submit"
              className="login-btn"
              disabled={loading || success || !email || !password}
            >
              {loading ? (
                <>
                  <span className="login-spinner"/>
                  {txt.btnLoading}
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/>
                    <polyline points="10 17 15 12 10 7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                  {txt.btnLogin}
                </>
              )}
            </button>
          </form>

          {/* Footer card */}
          <div className="login-card-footer">
            <span>{txt.noAccount}</span>
            <a href="mailto:dentaltdsupply@gmail.com" className="login-contact-link">
              {txt.contactUs}
            </a>
          </div>

          {/* Divider securitate */}
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
