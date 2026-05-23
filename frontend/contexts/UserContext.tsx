'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface UserInfo {
  sub: string;
  email: string;
  name?: string;
  role: string;
}

interface UserContextValue {
  user: UserInfo | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, captchaToken?: string) => Promise<void>;
  register: (email: string, password: string, name: string, captchaToken?: string) => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextValue>({
  user: null, token: null, loading: true,
  login: async () => {}, register: async () => {}, logout: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('user_token');
    if (!saved) { setLoading(false); return; }

    fetch(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${saved}` },
    })
      .then(r => r.ok ? r.json() as Promise<UserInfo> : Promise.reject())
      .then(info => { setUser(info); setToken(saved); })
      .catch(() => localStorage.removeItem('user_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string, captchaToken?: string) => {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, captchaToken }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { message?: string };
      throw new Error(body.message ?? 'Autentificare eșuată.');
    }
    const data = await res.json() as { accessToken: string; user: UserInfo };
    localStorage.setItem('user_token', data.accessToken);
    setToken(data.accessToken);
    setUser(data.user);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, captchaToken?: string) => {
    const res = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, captchaToken }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { message?: string | string[] };
      const errMsg = Array.isArray(body.message) ? body.message.join(', ') : body.message;
      throw new Error(errMsg ?? 'Înregistrare eșuată.');
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('user_token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <UserContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
