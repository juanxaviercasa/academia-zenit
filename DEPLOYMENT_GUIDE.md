# Guía de Despliegue y Próximos Pasos - Academia Zenit

Este documento detalla el estado actual del proyecto, el análisis de compatibilidad con **Cloudflare**, la arquitectura recomendada y el checklist paso a paso para continuar con la puesta en producción en el subdominio `academia.sistemazenit.com`.

---

## 1. Estado Actual del Proyecto

- **Framework:** Next.js 16.3.6 (App Router con Turbopack)
- **Base de Datos & ORM:** PostgreSQL (Supabase) con Prisma 6.4.1
- **Autenticación:** Clerk (`@clerk/nextjs`)
- **Video Streaming:** Mux (`@mux/mux-node`, `@mux/mux-player-react`)
- **Pasarela de Pagos:** Stripe
- **Estado de compilación:** Compilación local (`npm run build`) verificada y **exitosa** sin errores de TypeScript ni de empaquetado.

### Rutas y Endpoints detectados:
```text
Route (app)
┌ ○ /                                                      (Página de inicio)
├ ○ /_not-found
├ ƒ /api/community/posts                                   (Foro y comunidad)
├ ƒ /api/courses                                           (Gestión de cursos)
├ ƒ /api/courses/[courseId]/chapters/[chapterId]/progress   (Tracking de progreso)
├ ƒ /api/stripe/checkout                                   (Pasarela de pagos)
├ ƒ /api/webhook/clerk                                     (Sincronización usuarios)
├ ƒ /api/webhook/mux                                       (Procesamiento de video)
├ ƒ /api/webhook/stripe                                    (Confirmación de suscripciones)
├ ƒ /community                                             (Comunidad estilo Skool)
├ ƒ /courses                                               (Catálogo)
├ ƒ /courses/[courseId]                                    (Detalle del curso)
├ ƒ /courses/[courseId]/chapters/[chapterId]               (Reproductor de clases)
├ ƒ /dashboard                                             (Panel del estudiante/tutor)
└ ƒ /faculties/[facultySlug]                               (Facultades académicas)
```

---

## 2. Análisis de Compatibilidad con Cloudflare

¿Se puede ejecutar directamente en Cloudflare Pages "out-of-the-box"? **No directamente sin configuración adicional.**

### ¿Por qué?
1. **Entorno Edge vs Node.js:**
   - La aplicación es **Full-Stack dinámica** (`ƒ Dynamic`), no un sitio estático. Utiliza Server Actions, Server Components, Webhooks y endpoints de API.
   - Cloudflare Pages / Workers opera sobre un runtime **Edge basado en V8 isolates**, no sobre un entorno Node.js tradicional.
2. **Motor de Prisma:**
   - Prisma estándar (`@prisma/client`) depende de binarios compilados para Node.js.
   - En Cloudflare Pages/Workers, Prisma requiere drivers adaptadores como `@prisma/adapter-pg` o un servicio puente como **Prisma Accelerate**, además del flag `nodejs_compat`.
3. **Versión de Next.js:**
   - El proyecto corre sobre **Next.js 16**, mientras que adaptadores de Cloudflare como `@opennextjs/cloudflare` están diseñados principalmente para Next.js 14 y 15, pudiendo generar advertencias o incompatibilidades.

---

## 3. Arquitectura Recomendada: Cloudflare DNS + Vercel

Para garantizar el 100% de compatibilidad, cero fricción y soporte nativo de Next.js 16 con Prisma:

```
[ Usuario ]
     │
     ▼
[ Cloudflare DNS & Proxy (CDN / SSL / DDoS) ]
     │ (CNAME academia -> cname.vercel-dns.com)
     ▼
[ Vercel (Runtime Node.js / Next.js 16) ]
     ├── Supabase PostgreSQL (Prisma 6)
     ├── Clerk Authentication
     ├── Stripe Billing & Webhooks
     └── Mux Video Streaming
```

- **Cloudflare** gestiona el dominio `sistemazenit.com`, provee el certificado SSL, caché global y protección contra ataques.
- **Vercel** (o una alternativa Node.js como Railway, Render o VPS con Docker) aloja el servidor Next.js y ejecuta Prisma sin restricciones de entorno.

---

## 4. Checklist Paso a Paso para Continuar el Proyecto

### Paso 1: Configurar la Base de Datos (Supabase)
1. Asegúrate de tener tu proyecto en Supabase creado.
2. Obtén las cadenas de conexión en el dashboard de Supabase (Settings > Database):
   - **Transaction mode (Puerto 6543):** Para `DATABASE_URL` (incluir `?pgbouncer=true`).
   - **Session mode (Puerto 5432):** Para `DIRECT_URL`.
3. Aplica el esquema a la base de datos remota ejecutando:
   ```bash
   npx prisma db push
   ```
4. Pobla las facultades iniciales (Matemáticas, Ciencias, Humanidades):
   ```bash
   npm run db:seed
   ```

---

### Paso 2: Configurar las Variables de Entorno
Carga en el panel de tu proveedor de hosting (ej. Vercel) las variables definidas en `.env.example`:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Conexión con pooling (puerto 6543) |
| `DIRECT_URL` | Conexión directa (puerto 5432) |
| `NEXT_PUBLIC_APP_URL` | `https://academia.sistemazenit.com` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clave pública de Clerk (producción) |
| `CLERK_SECRET_KEY` | Clave secreta de Clerk (producción) |
| `CLERK_WEBHOOK_SECRET` | Secret para verificar webhooks de Clerk |
| `STRIPE_API_KEY` | Clave secreta de Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secret para webhooks de Stripe |
| `NEXT_PUBLIC_STRIPE_MONTHLY_PLAN_PRICE_ID` | ID del precio recurrente en Stripe |
| `MUX_TOKEN_ID` | Token ID de la API de Mux |
| `MUX_TOKEN_SECRET` | Secret de la API de Mux |
| `MUX_WEBHOOK_SECRET` | Secret para webhooks de Mux |

---

### Paso 3: Configurar el Dominio en Cloudflare
1. En el panel de **Cloudflare**, entra a la zona DNS de `sistemazenit.com`.
2. Añade un registro **CNAME**:
   - **Tipo:** `CNAME`
   - **Nombre:** `academia`
   - **Destino:** El dominio asignado por tu plataforma (ej. `cname.vercel-dns.com` si usas Vercel).
   - **Proxy status:** Activado (nube naranja).
3. En la configuración SSL/TLS de Cloudflare, verifica que esté en modo **Full** o **Full (Strict)**.

---

### Paso 4: Configurar los Webhooks en Producción
Una vez que el dominio responda en `https://academia.sistemazenit.com`:
- **Clerk:** Apuntar el webhook a `https://academia.sistemazenit.com/api/webhook/clerk` para eventos `user.created`, `user.updated`, `user.deleted`.
- **Stripe:** Apuntar el webhook a `https://academia.sistemazenit.com/api/webhook/stripe` para eventos de `checkout.session.completed` y `customer.subscription.*`.
- **Mux:** Apuntar el webhook a `https://academia.sistemazenit.com/api/webhook/mux` para eventos `video.asset.ready` y `video.asset.errored`.

---

## 5. Alternativa: Si deseas forzar el despliegue dentro de Cloudflare Pages

Si es un requisito indispensable que el código ejecute dentro de la infraestructura de Cloudflare Pages/Workers:
1. Instalar `@opennextjs/cloudflare`:
   ```bash
   npm install --save-dev @opennextjs/cloudflare
   ```
2. Crear un archivo `wrangler.toml` con:
   ```toml
   name = "academia-zenit"
   compatibility_date = "2024-09-23"
   compatibility_flags = ["nodejs_compat"]
   pages_build_output_dir = ".open-next/assets"
   ```
3. Migrar el cliente de Prisma para usar un driver adapter compatible con Cloudflare Workers (como `@prisma/adapter-pg` con conexión vía WebSocket / Hyperdrive) o contratar **Prisma Accelerate**.
