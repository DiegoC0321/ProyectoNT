import type { Metadata } from 'next';
import Link from 'next/link';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import Navbar from '@/components/Navbar';
import BootstrapClient from '@/components/BootstrapClient';

export const metadata: Metadata = {
  title: 'Sistema de Gestión de Restaurante Inteligente',
  description: 'Menú digital, pedidos, recomendaciones con IA y administración para restaurantes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="min-vh-100">{children}</main>
            <footer className="bg-dark text-light text-center py-3 mt-5 small">
              <div className="container">
                <div>Sistema de Gestión de Restaurante Inteligente &copy; {new Date().getFullYear()}</div>
                <div className="mt-2">
                  <Link href="/login" className="text-secondary text-decoration-none">
                    <i className="bi bi-person-badge"></i> Acceso para empleados
                  </Link>
                </div>
              </div>
            </footer>
          </CartProvider>
        </AuthProvider>
        <BootstrapClient />
      </body>
    </html>
  );
}
