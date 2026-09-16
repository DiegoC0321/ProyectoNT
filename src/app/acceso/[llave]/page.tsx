import { notFound } from 'next/navigation';
import { CLAVE_ACCESO } from '@/lib/acceso';
import LoginForm from '@/components/LoginForm';

/**
 * Página de acceso del personal/cliente con cuenta, servida solo en la ruta
 * oculta definida por NEXT_PUBLIC_STAFF_LOGIN_PATH (por defecto /acceso/operador).
 * Cualquier otra clave devuelve 404; la antigua `/login` ya no existe.
 */
export default function AccesoPage({ params }: { params: { llave: string } }) {
  if (params.llave !== CLAVE_ACCESO) notFound();
  return <LoginForm />;
}