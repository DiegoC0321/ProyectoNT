/**
 * Modelos (M de MVW): tipos que representan las entidades de negocio.
 * Reflejan directamente las tablas de la base de datos relacional.
 */

export type RolNombre = 'CLIENTE' | 'MESERO' | 'COCINA' | 'ADMINISTRADOR' | 'INVITADO';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  password_hash: string;
  rol_id: number;
  rol?: RolNombre;
  activo: 0 | 1;
  created_at: string;
  updated_at: string;
}

export interface UsuarioPublico {
  id: number;
  nombre: string;
  email: string;
  rol: RolNombre;
  activo: boolean;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

export interface Platillo {
  id: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  imagen_url?: string | null;
  disponible: 0 | 1;
  categoria_id: number | null;
  categoria_nombre?: string;
  created_at: string;
  updated_at: string;
}

/** Platillo con métricas de venta y narrativa de IA (recomendaciones). */
export interface PlatoRecomendado extends Platillo {
  veces_vendido: number;
  motivacion: string;
}

export type EstadoMesa = 'LIBRE' | 'OCUPADA' | 'PEDIDO EN CURSO';

export interface Mesa {
  id: number;
  numero: number;
  capacidad: number;
  estado: EstadoMesa;
}

export type EstadoPedido = 'RECIBIDO' | 'EN PREPARACION' | 'LISTO' | 'ENTREGADO' | 'CANCELADO';
export type OrigenPedido = 'CLIENTE' | 'MESERO';

export interface DetallePedido {
  id: number;
  pedido_id: number;
  platillo_id: number;
  platillo_nombre?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface Pedido {
  id: number;
  cliente_id: number | null;
  mesero_id: number | null;
  mesa_id: number | null;
  mesa_numero?: number | null;
  origen: OrigenPedido;
  estado: EstadoPedido;
  observaciones?: string | null;
  total: number;
  confirmado: 0 | 1;
  created_at: string;
  updated_at: string;
  detalles?: DetallePedido[];
}

export interface Ingrediente {
  id: number;
  nombre: string;
  codigo_de_barras?: string | null;
  unidad_medida: string;
}

export interface Inventario {
  id: number;
  ingrediente_id: number;
  ingrediente_nombre?: string;
  codigo_de_barras?: string | null;
  unidad_medida?: string;
  cantidad_actual: number;
  cantidad_minima: number;
  updated_at: string;
  bajo_stock?: boolean;
}

export type TipoNotificacion = 'INFO' | 'PEDIDO_LISTO' | 'PEDIDO_NUEVO' | 'STOCK_BAJO';

export interface Notificacion {
  id: number;
  usuario_id: number;
  pedido_id: number | null;
  tipo: TipoNotificacion;
  mensaje: string;
  leida: boolean;
  created_at: string;
}

/** Payload que se codifica dentro del JWT */
export interface JwtPayload {
  sub: number; // id de usuario
  email: string;
  rol: RolNombre;
  nombre: string;
}

export interface ApiError {
  error: string;
  details?: unknown;
}
