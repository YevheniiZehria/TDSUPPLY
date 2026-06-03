'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Product, ProductVariant } from '@/lib/api';

const STORAGE_KEY = 'cart_items';

export interface CartItem {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  unit: string;
  quantity: number;
  variantLabel?: string;
  inStock: boolean;
  color?: string;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  isDrawerOpen: boolean;
  addItem: (product: Product, lang: 'ro' | 'en', variant?: ProductVariant | null, color?: string | null) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const CartContext = createContext<CartContextValue>({
  items: [],
  count: 0,
  isDrawerOpen: false,
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  openDrawer: () => {},
  closeDrawer: () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setHydrated(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as CartItem[];
      setItems(parsed);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [hydrated, items]);

  const addItem = useCallback((product: Product, lang: 'ro' | 'en', variant?: ProductVariant | null, color?: string | null) => {
    setItems((current) => {
      let itemId = variant ? `${product.id}-${variant.label}` : product.id;
      if (color) itemId += `-${color}`;
      const existing = current.find((item) => item.id === itemId);
      if (existing) {
        return current.map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }

      const itemPrice = variant ? variant.price : product.price;
      let itemName = variant ? `${product.name[lang]} (${variant.label})` : product.name[lang];
      if (color) {
        itemName += ` - ${lang === 'ro' ? 'Nuanță' : 'Shade'}: ${color}`;
      }
      const itemInStock = variant ? (variant.inStock !== false && product.inStock) : product.inStock;

      return [
        ...current,
        {
          id: itemId,
          slug: product.slug,
          name: itemName,
          price: itemPrice,
          currency: product.currency,
          unit: product.unit,
          quantity: 1,
          variantLabel: variant?.label,
          inStock: itemInStock,
          color: color || undefined,
        },
      ];
    });
    setIsDrawerOpen(true);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setItems((current) =>
      current
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const count = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items],
  );

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        isDrawerOpen,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        openDrawer,
        closeDrawer,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
