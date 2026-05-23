import type { Product, ProductStats, SiteSettings } from './api';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('admin_token') ?? '';
}

async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error('UNAUTHORIZED');
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Lista tuturor produselor */
export function adminGetProducts(): Promise<Product[]> {
  return adminFetch<Product[]>('/products');
}

/** Detalii produs după ID */
export function adminGetProductById(id: string): Promise<Product> {
  return adminFetch<Product>(`/products/id/${id}`);
}

/** Statistici */
export function adminGetStats(): Promise<ProductStats> {
  return adminFetch<ProductStats>('/products/stats');
}

/** Adaugă produs */
export function adminCreateProduct(data: Partial<Product>): Promise<Product> {
  return adminFetch<Product>('/products', { method: 'POST', body: JSON.stringify(data) });
}

/** Editează produs */
export function adminUpdateProduct(id: string, data: Partial<Product>): Promise<Product> {
  return adminFetch<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

/** Șterge produs */
export function adminDeleteProduct(id: string): Promise<void> {
  return adminFetch<void>(`/products/${id}`, { method: 'DELETE' });
}

/** Upload imagine */
export async function adminUploadImage(file: File): Promise<{ url: string }> {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE}/uploads/image`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
  }

  return res.json() as Promise<{ url: string }>;
}

/** Verifică autentificare */
export function adminGetMe(): Promise<{ email: string; role: string }> {
  return adminFetch('/admin/auth/me');
}

/** Comenzi Admin */
export function adminGetOrders(): Promise<any[]> {
  return adminFetch('/orders');
}

export function adminUpdateOrderStatus(id: string, status: string): Promise<any> {
  return adminFetch(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function adminUpdateSettings(data: Partial<SiteSettings>): Promise<SiteSettings> {
  return adminFetch<SiteSettings>('/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/** Import produse din XLSX */
export async function adminImportProducts(file: File): Promise<{ importedCount: number }> {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE}/products/import`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
  }

  return res.json() as Promise<{ importedCount: number }>;
}
