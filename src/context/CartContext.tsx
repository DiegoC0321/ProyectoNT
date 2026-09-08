'use client';

import { createContext, useContext, useMemo, useState, useEffect, ReactNode } from 'react';
import type { Platillo } from '@/models/types';

export interface ItemCarrito {
  platillo: Platillo;
  cantidad: number;
}

export interface MesaCarrito {
  id: number;
  numero: number;
}

interface CartContextValue {
  items: ItemCarrito[];
  agregar: (platillo: Platillo, cantidad?: number) => void;
  quitar: (platilloId: number) => void;
  cambiarCantidad: (platilloId: number, cantidad: number) => void;
  vaciar: () => void;
  total: number;
  cantidadTotal: number;
  mesa: MesaCarrito | null;
  setMesa: (mesa: MesaCarrito | null) => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const MESA_KEY = 'restaurante.mesa';

function leerMesaLocal(): MesaCarrito | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(MESA_KEY);
  if (!raw) return null;
  try {
    const m = JSON.parse(raw) as MesaCarrito;
    if (Number.isInteger(m.id) && m.id > 0 && Number.isInteger(m.numero) && m.numero > 0) return m;
  } catch {
    /* ignorar valor corrupto */
  }
  return null;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [mesa, setMesaState] = useState<MesaCarrito | null>(null);

  useEffect(() => {
    setMesaState(leerMesaLocal());
  }, []);

  const agregar = (platillo: Platillo, cantidad = 1) => {
    setItems((prev) => {
      const existente = prev.find((i) => i.platillo.id === platillo.id);
      if (existente) {
        return prev.map((i) => (i.platillo.id === platillo.id ? { ...i, cantidad: i.cantidad + cantidad } : i));
      }
      return [...prev, { platillo, cantidad }];
    });
  };

  const quitar = (platilloId: number) => {
    setItems((prev) => prev.filter((i) => i.platillo.id !== platilloId));
  };

  const cambiarCantidad = (platilloId: number, cantidad: number) => {
    if (cantidad <= 0) {
      quitar(platilloId);
      return;
    }
    setItems((prev) => prev.map((i) => (i.platillo.id === platilloId ? { ...i, cantidad } : i)));
  };

  const vaciar = () => setItems([]);

  const setMesa = (m: MesaCarrito | null) => {
    setMesaState(m);
    if (typeof window === 'undefined') return;
    if (m == null) {
      window.localStorage.removeItem(MESA_KEY);
    } else {
      window.localStorage.setItem(MESA_KEY, JSON.stringify(m));
    }
  };

  const total = useMemo(() => items.reduce((acc, i) => acc + i.platillo.precio * i.cantidad, 0), [items]);
  const cantidadTotal = useMemo(() => items.reduce((acc, i) => acc + i.cantidad, 0), [items]);

  return (
    <CartContext.Provider value={{ items, agregar, quitar, cambiarCantidad, vaciar, total, cantidadTotal, mesa, setMesa }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de un <CartProvider>');
  return ctx;
}
