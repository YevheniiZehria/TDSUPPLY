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

// Validare număr de telefon – format internațional
function validatePhone(phone: string): string {
  if (!phone) return '';
  const clean = phone.replace(/\s/g, '');
  if (!/^\+?[1-9]\d{6,14}$/.test(clean)) {
    return 'Format invalid. Exemplu: +40712345678 sau 0712345678';
  }
  return '';
}

// Validare an naștere
function validateBirthYear(year: string): string {
  if (!year) return '';
  const n = parseInt(year, 10);
  const currentYear = new Date().getFullYear();
  if (isNaN(n)) return 'Introduceți un an valid.';
  if (n < 1920) return 'Anul nu poate fi înainte de 1920.';
  if (n > currentYear - 18) return `Trebuie să aveți cel puțin 18 ani (max. ${currentYear - 18}).`;
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
  const [birthYear, setBirthYear] = useState('');
  const [birthYearError, setBirthYearError] = useState('');
  const [country, setCountry]     = useState('România');

  // Validare în timp real pentru telefon
  function handlePhoneChange(val: string) {
    // Permite doar +, cifre, spații
    const cleaned = val.replace(/[^\d\s\+\-\(\)]/g, '');
    setPhone(cleaned);
    if (cleaned) setPhoneError(validatePhone(cleaned));
    else setPhoneError('');
  }

  // Formatare telefon la blur (adaugă +40 dacă e număr românesc)
  function handlePhoneBlur() {
    if (!phone) return;
    const clean = phone.replace(/\s/g, '');
    if (/^07\d{8}$/.test(clean)) {
      setPhone('+4' + clean);
    }
    setPhoneError(validatePhone(phone));
  }

  // Validare an naștere în timp real
  function handleBirthYearChange(val: string) {
    const numeric = val.replace(/\D/g, '').slice(0, 4);
    setBirthYear(numeric);
    if (numeric.length === 4) setBirthYearError(validateBirthYear(numeric));
    else setBirthYearError('');
  }

  // Încarcă și inițializează Cloudflare Turnstile
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
            callback: (token: string) => { setTurnstileToken(token); },
          });
        } catch (e) {}
      }
    };

    if ((window as any).turnstile) {
      try {
        (window as any).turnstile.render('#turnstile-container', {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY || '1x00000000000000000000AA',
          callback: (token: string) => { setTurnstileToken(token); },
        });
      } catch (e) {}
    }

    return () => { delete (window as any).onloadTurnstileCallback; };
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
      const yearErr = validateBirthYear(birthYear);
      if (birthYear && yearErr) {
        setBirthYearError(yearErr);
        setError('Corectați anul de naștere înainte de a continua.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (isRegister) {
        await register(
          email.trim(),
          password,
          name.trim(),
          turnstileToken,
          phone || undefined,
          birthYear ? parseInt(birthYear, 10) : undefined,
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
    setBirthYear('');
    setBirthYearError('');
    setCountry('România');
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

          {error && (
            <div className="login-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
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
                  {/* An naștere */}
                  <div className="login-field" style={{ marginBottom: 0 }}>
                    <label className="login-label" htmlFor="user-birth-year">
                      An naștere
                      <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6 }}>(opțional)</span>
                    </label>
                    <div className="login-input-wrap" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                      <div style={{ position: 'relative' }}>
                        <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        <input
                          id="user-birth-year"
                          type="text"
                          inputMode="numeric"
                          className={`login-input${birthYearError ? ' login-input--error' : birthYear.length === 4 && !birthYearError ? ' login-input--valid' : ''}`}
                          placeholder={`Ex: ${new Date().getFullYear() - 30}`}
                          value={birthYear}
                          onChange={e => handleBirthYearChange(e.target.value)}
                          onBlur={() => { if (birthYear) setBirthYearError(validateBirthYear(birthYear)); }}
                          disabled={submitting || success}
                          maxLength={4}
                        />
                      </div>
                      {birthYearError && (
                        <span style={{ fontSize: 11, color: 'var(--error, #ef4444)', marginTop: 4, display: 'block', paddingLeft: 2 }}>
                          ⚠ {birthYearError}
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
                      <select
                        id="user-country"
                        className="login-input"
                        style={{ cursor: 'pointer' }}
                        value={country}
                        onChange={e => setCountry(e.target.value)}
                        disabled={submitting || success}
                      >
                        {COUNTRIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
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
                (isRegister && (!name || !!phoneError || !!birthYearError))
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
          background: var(--surface, #1a1a2e);
          color: var(--text, #fff);
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
