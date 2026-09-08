'use client';

import { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import type { Platillo } from '@/models/types';

export interface ItemCarrito {
  platillo: Platillo;
  cantidad: number;
}

interface CartContextValue {
  items: ItemCarrito[];
  agregar: (platillo: Platillo, cantidad?: number) => void;
  quitar: (platilloId: number) => void;
  cambiarCantidad: (platilloId: number, cantidad: number) => void;
  vaciar: () => void;
  total: number;
  cantidadTotal: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>([]);

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

  const total = useMemo(() => items.reduce((acc, i) => acc + i.platillo.precio * i.cantidad, 0), [items]);
  const cantidadTotal = useMemo(() => items.reduce((acc, i) => acc + i.cantidad, 0), [items]);

  return (
    <CartContext.Provider value={{ items, agregar, quitar, cambiarCantidad, vaciar, total, cantidadTotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de un <CartProvider>');
  return ctx;
}
