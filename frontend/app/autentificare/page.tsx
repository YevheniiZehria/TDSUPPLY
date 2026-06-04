'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';

// Lista cu țări frecvente + România prima
const COUNTRIES = [
  'România',
  'Moldova',
  'Bulgaria',
  'Ungaria',
  'Serbia',
  'Ucraina',
  'Germania',
  'Franța',
  'Italia',
  'Spania',
  'Austria',
  'Belgia',
  'Elveția',
  'Olanda',
  'Polonia',
  'Cehia',
  'Slovacia',
  'Croația',
  'Slovenia',
  'Grecia',
  'Turcia',
  'Regatul Unit',
  'Irlanda',
  'Suedia',
  'Norvegia',
  'Danemarca',
  'Finlanda',
  'Portugalia',
  'Altă țară',
];

// Validare număr de telefon – format internațional (între 10 și 15 cifre)
function validatePhone(phone: string): string {
  if (!phone) return '';
  const clean = phone.replace(/[\s\-\(\)\+]/g, ''); // Elimină spații, cratime, paranteze și semnul +
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

// Validare dată naștere (minim 18 ani)
function validateBirthDate(birthDateStr: string): string {
  if (!birthDateStr) return '';
  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(birthDateStr)) {
    return 'Format invalid. Folosiți ZZ.LL.AAAA (ex: 31.05.2008).';
  }
  const parts = birthDateStr.split('.');
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Luni de la 0 la 11
  const year = parseInt(parts[2], 10);
  const birth = new Date(year, month, day);

  if (isNaN(birth.getTime()) || birth.getFullYear() !== year || birth.getMonth() !== month || birth.getDate() !== day) {
    return 'Data nașterii este invalidă.';
  }
  
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  if (birth.getFullYear() < 1900) {
    return 'Anul nașterii este prea mic.';
  }
  if (age < 18) {
    return 'Trebuie să aveți cel puțin 18 ani pentru a vă înregistra.';
  }
  return '';
}

// Validare adresă – strada
function validateStrada(strada: string): string {
  if (!strada) return 'Strada și numărul sunt obligatorii.';
  if (strada.trim().length < 5) return 'Strada trebuie să aibă cel puțin 5 caractere.';
  if (strada.length > 200) return 'Strada nu poate depăși 200 de caractere.';
  return '';
}

// Validare cod poștal (6 cifre România)
function validateCodPostal(cod: string): string {
  if (!cod) return 'Codul poștal este obligatoriu.';
  if (!/^\d{6}$/.test(cod.trim())) return 'Codul poștal trebuie să conțină exact 6 cifre (ex: 400000).';
  return '';
}

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/';
  const { user, login, register, loading } = useUser();

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>('');

  // Câmpuri noi pentru înregistrare
  const [phone, setPhone]         = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthDateError, setBirthDateError] = useState('');
  const [country, setCountry]     = useState('România');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [resendingVerification, setResendingVerification] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');

  async function handleResendVerification() {
    if (!email.trim()) {
      setError('Introduceți adresa de email pentru a retrimite link-ul de activare.');
      return;
    }
    setResendingVerification(true);
    setError('');
    setResendSuccess('');
    try {
      const res = await fetch(`${BASE}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message ?? 'Eroare la retrimiterea emailului.');
      }
      setResendSuccess(body.message || 'Un nou link de confirmare a fost trimis pe adresa de email.');
      setError('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setResendingVerification(false);
    }
  }

  // Validare în timp real pentru telefon
  function handlePhoneChange(val: string) {
    setPhone(val);
    if (val) setPhoneError(validatePhone(val));
    else setPhoneError('');
  }

  // Formatare telefon la blur (adaugă +40 dacă e număr românesc de mobil tipic)
  function handlePhoneBlur() {
    if (!phone) return;
    const clean = phone.replace(/[\s\-\(\)\+]/g, '');
    if (/^07\d{8}$/.test(clean)) {
      setPhone('+4' + clean);
      setPhoneError(validatePhone('+4' + clean));
    } else {
      setPhoneError(validatePhone(phone));
    }
  }

  // Validare dată naștere în timp real cu auto-formatare (ZZ.LL.AAAA)
  function handleBirthDateChange(val: string) {
    // Permite doar cifre din valoarea curentă
    const digits = val.replace(/\D/g, '').slice(0, 8);
    let formatted = '';
    if (digits.length > 0) {
      formatted += digits.slice(0, 2);
    }
    if (digits.length > 2) {
      formatted += '.' + digits.slice(2, 4);
    }
    if (digits.length > 4) {
      formatted += '.' + digits.slice(4, 8);
    }
    setBirthDate(formatted);
    if (formatted.length === 10) {
      setBirthDateError(validateBirthDate(formatted));
    } else {
      setBirthDateError('');
    }
  }

  // Încarcă și inițializează Cloudflare Turnstile
  useEffect(() => {
    let widgetId: string | null = null;
    const renderWidget = () => {
      if ((window as any).turnstile) {
        try {
          widgetId = (window as any).turnstile.render('#turnstile-container', {
            sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY || '1x00000000000000000000AA',
            callback: (token: string) => { setTurnstileToken(token); },
          });
        } catch (e) {}
      }
    };

    let script = document.getElementById('turnstile-script') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = 'turnstile-script';
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    if ((window as any).turnstile) {
      renderWidget();
    } else {
      (window as any).onloadTurnstileCallback = renderWidget;
    }

    return () => {
      if (widgetId !== null && (window as any).turnstile) {
        try {
          (window as any).turnstile.remove(widgetId);
        } catch (e) {}
      }
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

    if (isRegister) {
      // Validări suplimentare înainte de submit
      if (password !== confirmPassword) {
        setError('Parolele introduse nu coincid.');
        setConfirmPasswordError('Parolele nu coincid.');
        return;
      }
      if (!name.trim()) {
        setError('Te rugăm să introduci denumirea cabinetului / firmei.');
        return;
      }
      const phoneErr = validatePhone(phone);
      if (phone && phoneErr) {
        setPhoneError(phoneErr);
        setError('Corectați numărul de telefon înainte de a continua.');
        return;
      }
      const dateErr = validateBirthDate(birthDate);
      if (birthDate && dateErr) {
        setBirthDateError(dateErr);
        setError('Corectați data nașterii înainte de a continua.');
        return;
      }
      if (country && country.trim().length < 2) {
        setError('Țara trebuie să aibă cel puțin 2 caractere.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (isRegister) {
        let formattedBirthDate = undefined;
        if (birthDate) {
          const parts = birthDate.split('.');
          formattedBirthDate = `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
        }
        await register(
          email.trim(),
          password,
          name.trim(),
          turnstileToken,
          phone || undefined,
          formattedBirthDate,
          country || undefined,
        );
        setSuccess(true);
      } else {
        await login(email.trim(), password, turnstileToken);
        setSuccess(true);
        setTimeout(() => router.push(redirect), 1000);
      }
    } catch (err) {
      setError((err as Error).message || 'Operațiune eșuată.');
      if ((window as any).turnstile) {
        try { (window as any).turnstile.reset('#turnstile-container'); } catch (e) {}
      }
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(toRegister: boolean) {
    setIsRegister(toRegister);
    setError('');
    setPhone('');
    setPhoneError('');
    setBirthDate('');
    setBirthDateError('');
    setCountry('România');
    setConfirmPassword('');
    setConfirmPasswordError('');
    setResendSuccess('');
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
        <div className="login-card" style={isRegister ? { maxWidth: 520 } : {}}>
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

          {resendSuccess && (
            <div className="login-success" style={{ lineHeight: '1.4', marginBottom: 16 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              <span>{resendSuccess}</span>
            </div>
          )}

          {error && (
            <div className="login-error" style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{error}</span>
              </div>
              {error.includes('activat') && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendingVerification}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    padding: '4px 10px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginLeft: 24,
                  }}
                >
                  {resendingVerification ? 'Se trimite...' : 'Retrimite email-ul de activare'}
                </button>
              )}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit} noValidate>

            {/* ── CÂMPURI DOAR PENTRU ÎNREGISTRARE ── */}
            {isRegister && (
              <>
                {/* Denumire cabinet / firmă */}
                <div className="login-field">
                  <label className="login-label" htmlFor="user-name">
                    Denumire cabinet / firmă <span style={{ color: 'var(--primary)' }}>*</span>
                  </label>
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

                {/* Număr de telefon */}
                <div className="login-field">
                  <label className="login-label" htmlFor="user-phone">
                    Număr de telefon
                    <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6 }}>(opțional)</span>
                  </label>
                  <div className="login-input-wrap" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <div style={{ position: 'relative' }}>
                      <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.88 9.1a19.79 19.79 0 01-3.07-8.67A2 2 0 012.81 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 9.91a16 16 0 006.29 6.29l1.28-1.29a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                      </svg>
                      <input
                        id="user-phone"
                        type="tel"
                        className={`login-input${phoneError ? ' login-input--error' : phone && !phoneError ? ' login-input--valid' : ''}`}
                        placeholder="+40712345678"
                        value={phone}
                        onChange={e => handlePhoneChange(e.target.value)}
                        onBlur={handlePhoneBlur}
                        disabled={submitting || success}
                        maxLength={20}
                      />
                      {phone && !phoneError && (
                        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#22c55e' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                        </span>
                      )}
                    </div>
                    {phoneError && (
                      <span style={{ fontSize: 11, color: 'var(--error, #ef4444)', marginTop: 4, display: 'block', paddingLeft: 2 }}>
                        ⚠ {phoneError}
                      </span>
                    )}
                    {!phoneError && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block', paddingLeft: 2 }}>
                        Format internațional: +40XXXXXXXXX sau 07XXXXXXXX
                      </span>
                    )}
                  </div>
                </div>

                {/* An naștere + Țara – pe același rând */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {/* Dată naștere */}
                  <div className="login-field" style={{ marginBottom: 0 }}>
                    <label className="login-label" htmlFor="user-birth-date">
                      Dată naștere (ZZ.LL.AAAA)
                      <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6 }}>(opțional)</span>
                    </label>
                    <div className="login-input-wrap" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                      <div style={{ position: 'relative' }}>
                        <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        <input
                          id="user-birth-date"
                          type="text"
                          className={`login-input${birthDateError ? ' login-input--error' : birthDate && !birthDateError ? ' login-input--valid' : ''}`}
                          placeholder="ZZ.LL.AAAA (ex: 31.05.2008)"
                          value={birthDate}
                          onChange={e => handleBirthDateChange(e.target.value)}
                          onBlur={() => { if (birthDate) setBirthDateError(validateBirthDate(birthDate)); }}
                          disabled={submitting || success}
                          maxLength={10}
                        />
                      </div>
                      {birthDateError && (
                        <span style={{ fontSize: 11, color: 'var(--error, #ef4444)', marginTop: 4, display: 'block', paddingLeft: 2 }}>
                          ⚠ {birthDateError}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Țara */}
                  <div className="login-field" style={{ marginBottom: 0 }}>
                    <label className="login-label" htmlFor="user-country">Țara</label>
                    <div className="login-input-wrap">
                      <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
                      </svg>
                      <input
                        id="user-country"
                        type="text"
                        className="login-input"
                        placeholder="Ex: România"
                        value={country}
                        onChange={e => setCountry(e.target.value)}
                        disabled={submitting || success}
                      />
                    </div>
                  </div>
                </div>

                {/* Separator vizual */}
                <div style={{ height: 1, background: 'var(--border)', margin: '16px 0 4px' }} />
              </>
            )}

            {/* ── EMAIL ── */}
            <div className="login-field">
              <label className="login-label" htmlFor="user-email">
                Adresă email <span style={{ color: 'var(--primary)' }}>*</span>
              </label>
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

            {/* ── PAROLĂ ── */}
            <div className="login-field">
              <label className="login-label" htmlFor="user-password">
                Parolă <span style={{ color: 'var(--primary)' }}>*</span>
              </label>
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
              {isRegister && password && password.length < 6 && (
                <span style={{ fontSize: 11, color: 'var(--error, #ef4444)', marginTop: 4, display: 'block', paddingLeft: 2 }}>
                  ⚠ Parola trebuie să aibă minimum 6 caractere.
                </span>
              )}
            </div>

            {/* ── CONFIRMĂ PAROLĂ (doar la înregistrare) ── */}
            {isRegister && (
              <div className="login-field" style={{ marginTop: 12 }}>
                <label className="login-label" htmlFor="user-confirm-password">
                  Confirmă Parolă <span style={{ color: 'var(--primary)' }}>*</span>
                </label>
                <div className="login-input-wrap">
                  <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                  <input
                    id="user-confirm-password"
                    type={showPass ? 'text' : 'password'}
                    className="login-input"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => {
                      setConfirmPassword(e.target.value);
                      if (e.target.value && e.target.value !== password) {
                        setConfirmPasswordError('Parolele nu coincid.');
                      } else {
                        setConfirmPasswordError('');
                      }
                    }}
                    required
                    disabled={submitting || success}
                  />
                </div>
                {confirmPasswordError && (
                  <span style={{ fontSize: 11, color: 'var(--error, #ef4444)', marginTop: 4, display: 'block', paddingLeft: 2 }}>
                    ⚠ {confirmPasswordError}
                  </span>
                )}
              </div>
            )}

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
              disabled={
                submitting || success || !email || !password ||
                (isRegister && (!name || !!phoneError || !!birthDateError || !confirmPassword || !!confirmPasswordError))
              }
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
                  onClick={() => switchMode(false)}
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
                  onClick={() => switchMode(true)}
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

      <style>{`
        .login-input--error {
          border-color: var(--error, #ef4444) !important;
          box-shadow: 0 0 0 2px rgba(239,68,68,0.15) !important;
        }
        .login-input--valid {
          border-color: #22c55e !important;
          box-shadow: 0 0 0 2px rgba(34,197,94,0.15) !important;
        }
        .login-input option {
          background: var(--card, #ffffff);
          color: var(--text-primary, #1A2332);
        }
      `}</style>
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
