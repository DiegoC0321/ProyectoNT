# 🍽️ Sistema de Gestión de Restaurante Inteligente

Aplicación web full-stack construida con **Next.js 14 + TypeScript**, que implementa
el menú digital, la toma de pedidos, el seguimiento en tiempo real, recomendaciones
personalizadas (módulo preparado para IA), y los paneles operativos de **cliente**,
**mesero**, **cocina** y **administrador**, con autenticación **JWT** y autorización
basada en roles.

Este proyecto sigue directamente los requisitos funcionales (RF01–RF17), no
funcionales (RFN01–RFN05) y la priorización MoSCoW definidos en el documento de
especificación (IEEE 830) que dio origen al sistema.

---

## 1. Arquitectura general

El proyecto sigue el patrón **MVW** (Model-View-Whatever), adaptado a la
arquitectura de Next.js (App Router):

```
Vista (View)          →  src/app/**/page.tsx  (componentes React / páginas)
Modelo (Model)         →  src/models/types.ts  (tipos que reflejan la BD)
Controlador/Servicio   →  src/controllers/**   (lógica de negocio + acceso a BD)
API REST               →  src/app/api/**       (adaptadores HTTP sobre los controladores)
Servicios de cliente   →  src/services/**      (fetch tipado desde el frontend)
Estado global           →  src/context/**       (AuthContext, CartContext)
Middleware              →  src/middleware/auth.ts (JWT + autorización por rol)
```

La capa de **controladores** nunca se importa desde el navegador: solo se usa
dentro de las rutas API (que corren en el servidor). El frontend **siempre**
habla con el backend a través de `src/services/*`, nunca accede a la base de
datos directamente. Esto permite:

- Agregar nuevas funcionalidades sin romper las existentes (nuevos controladores
  y rutas API se agregan de forma aislada).
- Sustituir la base de datos o el motor de IA sin tocar las vistas.
- Reutilizar la lógica de negocio si en el futuro se agrega una app móvil que
  consuma la misma API REST.

---

## 2. Tecnologías

| Capa               | Tecnología                                   |
|--------------------|-----------------------------------------------|
| Framework          | Next.js 14 (App Router)                       |
| Lenguaje           | TypeScript                                    |
| Frontend / UI      | React + Bootstrap 5 + Bootstrap Icons         |
| Autenticación      | JWT (`jsonwebtoken`) + cookies httpOnly       |
| Contraseñas        | `bcryptjs` (hash + salt)                      |
| Base de datos      | PostgreSQL en la nube (Supabase) — `pg` |
| Comunicación       | API REST (rutas `src/app/api/**`)             |
| IA (recomendaciones)| Módulo propio, listo para integrarse con un LLM |

> La base de datos es **PostgreSQL** alojado en **Supabase** (relacional, con
> claves primarias/foráneas, restricciones `CHECK` y relaciones 1:N y N:M). Toda
> la lógica de acceso a datos vive en `src/controllers/**` sobre un adaptador
> en `src/lib/db.ts` (`pg`), por lo que el esquema y los queries están
> normalizados en `supabase/schema.sql`.

---

## 3. Estructura de carpetas

```
restaurant-system/
├── src/
│   ├── app/                        # Vistas (páginas) y rutas API
│   │   ├── page.tsx                # Landing pública
│   │   ├── menu/page.tsx           # Menú digital público (RF01)
│   │   ├── login/page.tsx          # Inicio de sesión
│   │   ├── register/page.tsx       # Registro de clientes (RF03)
│   │   ├── cliente/                # Módulo cliente (protegido por rol)
│   │   ├── mesero/                 # Módulo mesero (protegido por rol)
│   │   ├── cocina/                 # Módulo cocina (protegido por rol)
│   │   ├── admin/                  # Módulo administrador (protegido por rol)
│   │   └── api/                    # Endpoints REST (ver sección 8)
│   ├── components/                 # Componentes reutilizables (Navbar, Cards, etc.)
│   ├── context/                    # Estado global: AuthContext, CartContext
│   ├── controllers/                # Lógica de negocio + acceso a BD
│   ├── middleware/                 # auth.ts (JWT + autorización por rol)
│   ├── models/                     # Tipos TypeScript (entidades)
│   ├── services/                   # Clientes fetch tipados hacia la API REST
│   ├── lib/                        # db.ts (adaptador pg), jwt.ts
│   ├── utils/                      # Formateo de moneda, fechas, badges
│   └── types/                      # Declaraciones .d.ts auxiliares
├── supabase/                       # schema.sql (PostgreSQL para Supabase)
├── scripts/                        # db-setup.mjs (aplica esquema + seed)
├── public/img/                     # Imágenes estáticas de ejemplo
├── .env.local                      # Configuración local (gitignored, ver sección 3)
├── package.json
└── README.md
```

---

## 4. Modelo de datos

Entidades principales (ver `src/lib/schema.sql` para el detalle completo con
claves primarias, foráneas, `CHECK` y fechas de auditoría):

```
rol 1───N usuario
usuario 1───N pedido (como cliente)
usuario 1───N pedido (como mesero)
mesa 1───N pedido
pedido 1───N detalle_pedido N───1 platillo
categoria 1───N platillo
platillo N───N ingrediente   (tabla puente: platillo_ingrediente)
ingrediente 1───1 inventario
usuario 1───N notificacion
pedido 1───N notificacion
```

- **Relaciones 1:N**: rol→usuario, categoria→platillo, mesa→pedido,
  pedido→detalle_pedido, usuario→notificacion.
- **Relación N:M**: `platillo_ingrediente` (receta de cada platillo), usada
  para estimar el consumo de inventario en los reportes (RF13).
- **Estados controlados** mediante `CHECK`: rol, estado de mesa, estado de
  pedido, tipo de notificación.
- **Auditoría**: todas las tablas relevantes tienen `created_at` /
  `updated_at`.

---

## 5. Flujo de autenticación JWT

1. El cliente se registra (`POST /api/auth/register`) o inicia sesión
   (`POST /api/auth/login`).
2. El backend valida credenciales con `bcryptjs`, genera un JWT firmado
   (`src/lib/jwt.ts`) que incluye `{ sub, email, rol, nombre }`, y lo entrega:
   - En el cuerpo de la respuesta (`token`), por si se requiere para
     integraciones externas.
   - En una **cookie httpOnly** llamada `token`, que el navegador reenvía
     automáticamente en cada petición (`credentials: 'include'`).
3. Cada ruta API protegida usa `requireAuth` o `requireRole` (`src/middleware/auth.ts`)
   para validar el token (`jwt.verify`) y comprobar el rol antes de ejecutar
   cualquier lógica de negocio.
4. En el frontend, `AuthContext` llama a `GET /api/auth/me` al cargar la app
   para restaurar la sesión a partir de la cookie, sin exponer el token a
   JavaScript (protección contra XSS).
5. `POST /api/auth/logout` limpia la cookie del lado del servidor.

**Acceso oculto y anti fuerza bruta** (medidas aplicadas):
- La **página** de login ya no vive en `/login` (esa ruta da **404**). Se sirve en
  una ruta oculta configurable: `NEXT_PUBLIC_STAFF_LOGIN_PATH` (por defecto
  `/acceso/operador`). Cambiarla en `.env.local` y recompilar mueve el acceso
  sin tocar código.
- El cliente que pide desde la mesa **nunca ve** un enlace de inicio de sesión
  (ni en navbar ni en el footer); solo el personal ya autenticado ve un acceso
  rápido, y quien no tiene sesión entra escribiendo la ruta oculta.
- `POST /api/auth/login` tiene **rate-limit en memoria por IP**: 5 intentos
  fallidos por ventana de 15 min bloquean la IP con backoff exponencial
  (15 min → … → 24 h máximo), respondiendo `429` + `Retry-After`.
- El error es siempre *"Credenciales inválidas."* y las respuestas fallidas
  tardan lo mismo (~450 ms): no se puede enumerar usuarios ni medir fuerza por
  timing. La URL oculta no es un secreto real (aparece en `/register`); la
  barrera de verdad es el rate-limit. Para producción fuerte se recomienda un
  rate-limit de infraestructura (Cloudflare/Upstash/Redis).

---

## 6. Roles y permisos

| Ruta protegida            | Roles permitidos                     |
|----------------------------|---------------------------------------|
| `/cliente/**`              | CLIENTE                               |
| `/mesero/**`                | MESERO                                 |
| `/cocina/**`                | COCINA                                 |
| `/admin/**`                 | ADMINISTRADOR                          |
| `POST /api/menu` (crear)   | ADMINISTRADOR                         |
| `POST /api/users`          | ADMINISTRADOR                         |
| `GET/POST /api/inventory`  | ADMINISTRADOR (COCINA solo lectura)   |
| `GET /api/reports`         | ADMINISTRADOR                         |
| `PATCH /api/orders/:id/status` | COCINA, MESERO, ADMINISTRADOR     |
| `POST /api/orders`         | CLIENTE, MESERO                       |

La protección ocurre en **dos capas**:
- **Frontend**: `RequireRole` redirige si el usuario no tiene el rol adecuado
  (mejora la experiencia, pero no es la barrera de seguridad real).
- **Backend (real barrera de seguridad)**: cada ruta en `src/app/api/**`
  llama a `requireRole(req, [...])` antes de tocar la base de datos.

---

## 7. Diseño de API REST

Todas las rutas viven bajo `/api` y devuelven JSON. Resumen:

```
POST   /api/auth/register          Registro de clientes (RF03)
POST   /api/auth/login             Inicio de sesión
POST   /api/auth/guest             Sesión de invitado anónima (pedido por mesa sin contraseña)
POST   /api/auth/logout            Cierre de sesión
GET    /api/auth/me                Usuario autenticado actual

GET    /api/users                  Listar usuarios (admin)
POST   /api/users                  Crear empleado (admin) — RF15
GET    /api/users/:id              Detalle de usuario (admin)
PUT    /api/users/:id              Editar usuario / rol (admin)
DELETE /api/users/:id              Desactivar usuario (admin)

GET    /api/menu                   Menú digital público — RF01
POST   /api/menu                   Crear platillo (admin) — RF14
GET    /api/menu/:id                Detalle de platillo
PUT    /api/menu/:id                Editar platillo (admin)
PATCH  /api/menu/:id                Alternar disponibilidad (admin)
DELETE /api/menu/:id                Eliminar platillo (admin)

GET    /api/categories             Listar categorías
POST   /api/categories             Crear categoría (admin)

GET    /api/orders                 Listar pedidos (según rol)
POST   /api/orders                 Crear pedido — RF04 (cliente) / RF07 (mesero)
GET    /api/orders/:id              Detalle de pedido
PUT    /api/orders/:id              Editar pedido no confirmado — RF10
DELETE /api/orders/:id              Cancelar pedido no confirmado — RF10
POST   /api/orders/:id/confirm      Enviar borrador a cocina — RF10
PATCH  /api/orders/:id/status       Cambiar estado — RF05 / RF17 (+ notifica RF09)
POST   /api/orders/:id/repeat       Repetir pedido anterior — RF06

GET    /api/tables                 Listar mesas — RF08
POST   /api/tables                 Crear mesa (admin)
GET    /api/tables/by-number/:numero  Público: resuelve la mesa del QR/NFC por número
PUT    /api/tables/:id              Cambiar estado de mesa — RF08

GET    /api/inventory              Consultar inventario — RF12
POST   /api/inventory              Registrar insumo (admin) — RF12
PUT    /api/inventory/:id           Actualizar cantidad / alerta bajo stock — RF12

GET    /api/reports                Panel de ventas (RF11) o reporte por periodo (RF13)

GET    /api/recommendations        Recomendaciones personalizadas — RF02
```

Todas las rutas de escritura (POST/PUT/PATCH/DELETE), salvo el registro y el
login, exigen un JWT válido y validan el rol correspondiente.

---

## 8. Flujo de navegación

```
/                → Landing pública
/menu            → Menú digital (sin sesión)
/acceso/operador → Acceso personal/clientes con cuenta (ruta oculta, configurable en NEXT_PUBLIC_STAFF_LOGIN_PATH; /login da 404)
/register        → Registro de clientes

/cliente                    → Dashboard cliente
/cliente/menu               → Menú + agregar al carrito
/cliente/carrito            → Resumen, confirmar y enviar pedido (RF04)
/cliente/pedidos            → Seguimiento (RF05) + historial y repetir (RF06)
/cliente/recomendaciones    → Recomendaciones con IA (RF02)

/mesero                      → Dashboard mesero
/mesero/mesas                → Estado visual de mesas (RF08)
/mesero/registrar-pedido     → Registrar pedido para una mesa (RF07)
/mesero/pedidos              → Borradores editables (RF10), en curso, entregados

/cocina                       → Dashboard cocina
/cocina/pedidos               → Pedidos entrantes en orden de llegada (RF16/RF17)

/admin                        → Panel de ventas (RF11)
/admin/inventario             → Gestión de inventario y alertas (RF12)
/admin/menu                   → Gestión del menú (RF14)
/admin/usuarios               → Gestión de usuarios y roles (RF15)
/admin/reportes               → Reportes por periodo (RF13)
```

---

## 9. Módulo de recomendaciones con IA (RF02)

`src/controllers/recommendationController.ts` implementa un motor por reglas
(historial de consumo + categorías favoritas + popularidad) que ya funciona
de extremo a extremo. Se diseñó con un contrato estable
(`recomendarPlatillos(clienteId, limite)`) para que, más adelante, pueda:

1. Enviar el mismo contexto (historial, categorías, catálogo disponible) como
   prompt a un modelo de lenguaje (por ejemplo, vía la API de Anthropic).
2. Pedir una respuesta estructurada (JSON) con los IDs sugeridos.
3. Mapear esa respuesta al mismo tipo `Platillo[]` que ya consume el frontend,
   sin tener que tocar ninguna vista.

---

## 10. Instalación y ejecución

### Requisitos previos
- Node.js **>= 18** (probado con Node 24)
- npm
- Un proyecto de **Supabase** (gratis): https://supabase.com/dashboard

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el archivo de configuración única `.env.local` (hay que crearlo a mano):
#   DATABASE_URL=postgresql://postgres.<TU-REF>:<TU-PASSWORD>@<TU-HOST>.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
#   JWT_SECRET=<una-clave-secreta-larga>
#   NEXT_PUBLIC_STAFF_LOGIN_PATH=operador   # ruta oculta del login (opcional, por defecto "operador")

#   # IA opcional para las recomendaciones de la carta (endpoint OpenAI-compatible:
#   # OpenAI, DeepSeek, Groq, Mistral... o Ollama local con AI_BASE_URL=http://localhost:11434/v1)
#   AI_API_KEY=<tu-clave>          # sin clave, funciona igual con el fallback "más pedidos de la semana"
#   AI_BASE_URL=https://api.openai.com/v1   # opcional
#   AI_MODEL=gpt-4o-mini                    # opcional (p.ej. deepseek-chat, llama3)
#   # RECO_IA_TTL_MINUTOS=180    # opcional: cuánto dura el caché de la narrativa de IA (por defecto 180)
#   # AI_TIMEOUT_MS=12000         # opcional: límite de espera a la IA; si se pasa, se sirve el fallback

# 3. Preparar la base de datos en Supabase (crea el esquema + datos demo)
npm run db:setup

# 4. Levantar el entorno de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

`npm run db:setup` aplica `supabase/schema.sql` (idempotente, `IF NOT EXISTS`)
y carga los datos de demostración solo si las tablas están vacías (usuarios,
menú, mesas e inventario). También se puede ejecutar el SQL manualmente desde
el **SQL Editor** del dashboard de Supabase.

### Compilar para producción

```bash
npm run build
npm run start
```

### Usuarios de demostración

| Rol            | Correo               | Contraseña   |
|-----------------|-----------------------|--------------|
| Cliente         | cliente@demo.com      | Cliente123!  |
| Mesero          | mesero@demo.com       | Mesero123!   |
| Cocina          | cocina@demo.com       | Cocina123!   |
| Administrador   | admin@demo.com        | Admin123!    |

> Si necesitas reiniciar los datos desde cero, simplemente elimina la carpeta
> `data/` y vuelve a ejecutar `npm run dev`.

---

## 11. Priorización MoSCoW respetada

- **MUST**: RF01, RF03, RF04, RF07, RF08, RF09, RF11, RF12, RF14, RF15, RF16,
  RF17, RFN01, RFN02, RFN03 — todos implementados.
- **SHOULD**: RF02, RF05, RF10, RF13, RFN04, RFN05 — todos implementados.
- **COULD**: RF06 — implementado (historial + repetir pedido).

---

## 12. Checklist de verificación

- [x] RF01 Consulta de menú digital (`/menu`, `/api/menu`)
- [x] RF02 Recomendaciones personalizadas (`/cliente/recomendaciones`)
- [x] RF03 Registro y autenticación (`/register`, ruta oculta `/acceso/*`, JWT)
- [x] RF04 Realización de pedidos con resumen y confirmación (`/cliente/carrito`)
- [x] RF05 Seguimiento del pedido en 4 estados (`/cliente/pedidos`)
- [x] RF06 Historial y repetir pedido
- [x] RF07 Registro de pedidos por mesero (`/mesero/registrar-pedido`)
- [x] RF08 Gestión visual de mesas (`/mesero/mesas`)
- [x] RF09 Notificación al mesero/cliente cuando el pedido está listo
- [x] RF10 Edición/cancelación de pedidos no confirmados
- [x] RF11 Panel de ventas día/semana/mes con gráficos (`/admin`)
- [x] RF12 Gestión de inventario con alertas de bajo stock (`/admin/inventario`)
- [x] RF13 Reportes por periodo (`/admin/reportes`)
- [x] RF14 Gestión completa del menú (`/admin/menu`)
- [x] RF15 Gestión de usuarios y roles (`/admin/usuarios`)
- [x] RF16 Pedidos entrantes en orden de llegada (`/cocina/pedidos`)
- [x] RF17 Actualización de estado por cocina con notificaciones
- [x] JWT funcionando en todas las rutas protegidas
- [x] Roles con permisos diferenciados (verificado con pruebas 401/403)
- [x] Rutas protegidas inaccesibles sin autorización
- [x] Interfaz responsive con Bootstrap 5 (grid, navbar colapsable, cards)
- [x] Build de producción sin errores de TypeScript (`npm run build`)
- [x] Flujo cliente → mesero → cocina probado de extremo a extremo

---

## 13. Notas para continuar el desarrollo

- Para agregar un nuevo rol o funcionalidad, sigue el mismo patrón: modelo →
  controlador → ruta API → servicio de frontend → página.
- Para migrar a otra base de datos relacional, solo es necesario reescribir
  `src/lib/db.ts` (la interfaz de los controladores no cambia si se usa un
  driver con una API similar).
- El módulo de recomendaciones está aislado en un único archivo para facilitar
  su reemplazo por un modelo de IA real sin afectar el resto del sistema.

---

## 14. Auditoría de fases de desarrollo (estado del roadmap)

Evaluación por fase del ciclo de desarrollo del proyecto, con lo que está
pendiente o mejorable desde una perspectiva de desarrollo de largo plazo:

| # | Fase | Estado | Evaluación y recomendaciones |
|---|------|--------|------------------------------|
| 1 | Proyecto Next.js + TS + Bootstrap + estructura MVW | ✅ Implementada | Correcta y bien adaptada a App Router: los controladores solo corren en servidor y el frontend habla con el backend vía `src/services/*` tipados. Mejorable: aprovechar más Server Components para reducir JS en cliente y estado global. |
| 2 | Base de datos + modelos | ✅ Implementada | Esquema relacional normalizado (PK/FK, `CHECK`, índices, auditoría, relación N:M) en **PostgreSQL (Supabase)** mediante `supabase/schema.sql`. Migrado desde SQLite: controllers asíncronos sobre `pg`. Mejorable: migraciones versionadas (p. ej. `supabase migrations`) en lugar de un único script idempotente. |
| 3 | API REST | ✅ Implementada | Recursos y verbos correctos, capa de controladores limpia, errores consistentes `{ error }`. Pendiente: validación centralizada (`zod` está instalado pero sin uso), esquema de respuesta tipado y paginación (aceptable a esta escala). |
| 4 | JWT + roles y permisos | ✅ Implementada | Doble capa ejecutada con rigor: frontend (UX) y backend (barrera real) con `requireAuth`/`requireRole`; transiciones de pedido modeladas como máquina de estados; `bcrypt` cost 10; cookie `httpOnly` + `sameSite: lax`; **login oculto** (ruta configurable, `/login` → 404) y **rate-limit por IP** (5 fallos/15 min con backoff) + error genérico con delay. Pendiente para producción: forzar `JWT_SECRET`, cookie `Secure` en HTTPS y rate-limit de infraestructura (Cloudflare/Upstash). |
| 5 | Módulo cliente | ✅ Implementada | RF02–RF06 cubiertos: menú, carrito, seguimiento, repetir pedido y recomendaciones. |
| 6 | Módulo mesero | ✅ Implementada | RF07/RF08/RF10 completos; el flujo borrador → confirmar está bien diseñado. El refresco es por polling (8 s); con SSE se volvería instantáneo. |
| 7 | Módulo cocina | ✅ Implementada | RF16/RF17 correctos, orden de llegada respetado, notificaciones a mesero/cliente al quedar LISTO. Polling de 6 s: "tiempo real" aproximado, no push real. |
| 8 | Módulo administrador | ✅ Implementada | RF11–RF15 (dashboard, inventario + alertas, menú CRUD, usuarios/roles, reportes por periodo). Nota: el consumo de inventario en reportes es **estimado**; no se descuenta automáticamente al confirmar un pedido. |
| 9 | IA para recomendaciones | ✅ Implementada (motor por reglas) | Contrato estable aislado (`recomendarPlatillos`) listo para sustituirse por un LLM. No es ML real: combina popularidad + categorías favoritas con historial. Honesto y bien encapsulado; si se escala, conviene un score de relevancia y prueba A/B. |
| 10 | Notificaciones, validaciones, pruebas | ◐ Parcial | **Notificaciones**: se *escriben* (`PEDIDO_NUEVO`, `PEDIDO_LISTO`, `STOCK_BAJO`) pero no hay endpoint para leerlas ni marcarlas como leídas, y no existe UI (campana/badges); solo se perciben vía polling de pedidos. **Validaciones**: manuales en cada ruta; `zod` sin usar. **Pruebas**: no hay framework ni tests automatizados; la verificación fue manual (401/403, build). |

### Colas de trabajo recomendadas (por prioridad)

1. **Cerrar notificaciones**: `GET /api/notifications` y `PATCH /api/notifications/:id` (leída) + campana con badge de no leídas. Las funciones del controlador ya existen; solo falta exponerlas.
2. **Tiempo real real**: reemplazar el polling (6–8 s) por **SSE** (`/api/notifications/stream`) para mesero/cocina/cliente.
3. **Validación centralizada con zod**: esquemas por recurso en las rutas de escritura y errores tipados por endpoint.
4. **Tests automatizados mínimos**: al menos autenticación (401/403), creación de pedidos y transiciones de estado (validar la máquina de estados).
5. **Endurecer autenticación (producción)**: exigir `JWT_SECRET` (sin fallback), cookie `Secure` en HTTPS y rate-limit de infraestructura (Cloudflare/Upstash) además del actual en memoria.
6. **Opcionales**: descuento automático de inventario al confirmar el pedido y migraciones versionadas de esquema.
