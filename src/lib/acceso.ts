/**
 * Ruta de acceso del personal/cliente con cuenta, oculta tras una clave
 * configurable. El cliente que pide desde la mesa nunca ve este enlace; solo
 * se llega escribiendo la URL directamente.
 *
 * Cambia NEXT_PUBLIC_STAFF_LOGIN_PATH en .env.local y recompila para cambiar
 * la ruta sin tocar código. La ruta `/login` ya no existe (da 404). Las
 * cuentas las crea únicamente el administrador desde /admin/usuarios.
 */
export const CLAVE_ACCESO: string = (process.env.NEXT_PUBLIC_STAFF_LOGIN_PATH ?? 'operador')
  .trim()
  .replace(/^\/+|\/+$/g, '');

export const RUTA_LOGIN: string = `/acceso/${CLAVE_ACCESO}`;