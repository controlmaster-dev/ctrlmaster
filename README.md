# Control Master

[![CI](https://github.com/controlmaster-dev/ctrlmaster/actions/workflows/ci.yml/badge.svg)](https://github.com/controlmaster-dev/ctrlmaster/actions/workflows/ci.yml)

App interna para el equipo de operaciones de broadcast en Enlace. Centraliza lo que antes estaba repartido entre hojas, chats y memoria: reportes de incidencias, turnos de operadores, monitoreo de señales, credenciales compartidas y alertas por correo o WhatsApp.

---

## Requisitos

- **Node.js 20+** (probado con v24)
- **MongoDB** — Atlas en producción; local para desarrollo y tests de integración
- Cuenta de **Resend** o SMTP si quieres correos reales (opcional en local)

---

## Puesta en marcha (local)

```bash
cp .env.example .env
npm install
npm run dev
```

**Tip:** el typecheck completo (`npm run typecheck`) puede comerse mucha RAM en Windows. Si revienta por memoria, confía en el CI de GitHub o corre `npm run typecheck:app` por partes. El build en Vercel omite el tsc del build si hace falta (`SKIP_TYPECHECK=1`); en CI sí se valida todo.

---

## Variables de entorno

Copia `.env.example` y rellena lo que aplique. Lo mínimo para trabajar en serio:

| Variable | ¿Obligatoria? | Para qué sirve |
|----------|---------------|----------------|
| `MONGODB_URI` | Sí (prod y dev con datos) | Conexión a MongoDB |
| `CRON_SECRET` | Sí en producción | Protege `/api/cron/*` |
| `CREDENTIALS_ENC_KEY` | Sí en producción | Cifrado de credenciales en BD |
| `FILE_ENC_KEY` | Recomendada en prod | Cifrado de archivos subidos (si no, usa la de credenciales) |
| `CONFIG_ADMIN_EMAILS` | No | Quién entra a `/configuracion` (emails separados por coma) |
| `RESEND_API_KEY` / SMTP | No en local | Envío de correos |
| `WHATSAPP_API_URL` + `WHATSAPP_API_KEY` | No en local | Servicio WhatsApp en `monorepo-wsp` |
| `YOUTUBE_API_KEY` | No | Estado live de YouTube en `/api/social/status` |
| `NEXT_PUBLIC_*` | Varias | URL de la app, destinatarios de correo visibles en el cliente, etc. |

Generar una clave de cifrado (32 bytes en base64):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

En producción la app **no arranca** si faltan `MONGODB_URI`, `CRON_SECRET` o las claves de cifrado válidas. Eso es intencional.

---

## Scripts que de verdad usamos

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Desarrollo con Turbopack |
| `npm run build` / `start` | Build y servidor de producción |
| `npm test` | Tests unitarios + integración (integración hace skip sin Mongo) |
| `npm run test:integration` | Solo integración |
| `npm run lint` | Typecheck + ESLint |
| `npm run ci` | Lo que corre el pipeline (sin build) |
| `npm run db:indexes` | Sincroniza índices de Mongoose con la BD |
| `npm run db:health` | Ping, conteos por colección, resumen de índices |
| `npm run migrate:report-codes` | Migración one-off de códigos de reporte |
| `npm run electron:dev` | Cliente de escritorio (apunta a la URL del servidor) |

Más detalle operativo (crons, rotación de claves, monitoreo): [`docs/OPS.md`](docs/OPS.md).

---

## Roles (en corto)

| Rol | En la práctica |
|-----|----------------|
| **OPERATOR** | Crea reportes, comenta, ve su operativa |
| **ENGINEER** | Todo lo anterior + eliminar reportes, credenciales, más permisos técnicos |
| **BOSS** / **ADMIN** | Acceso amplio; configuración según `CONFIG_ADMIN_EMAILS` |

El middleware valida el token de sesión contra MongoDB en cada request protegido. Las APIs públicas están acotadas (`/api/users/public`, calendario con token, health mínimo, etc.) — el listado completo de usuarios ya no es público.

Patrón de rutas y capas: [`src/lib/api/README.md`](src/lib/api/README.md).

---

## Despliegue (Vercel)

1. Conectar el repo y configurar las variables de entorno de producción.
2. `MONGODB_URI` apuntando al cluster (replica set si usas transacciones en reportes).
3. Ejecutar `npm run db:indexes` contra ese cluster después del primer deploy o cuando cambien los modelos.
4. Los crons van en `vercel.json` (`shift-reminders`, `cleanup-tokens`). Necesitan `CRON_SECRET` en el entorno.

**Health check:** `GET /api/health` devuelve `{ "status": "ok" }` sin login — sirve para UptimeRobot o similar. Con sesión de ingeniero/jefe/admin ves el detalle (Mongo, GeoIP, cifrado).

**WhatsApp:** levanta el servicio en `monorepo-wsp/` (Docker o PM2 en un VPS) y apunta `WHATSAPP_API_URL` a esa instancia. Tiene su propio `.env.example`.

---

## CI

En cada push/PR a `main` corre ESLint, typecheck (con heap ampliado), tests con MongoDB 7 en replica set, audit de dependencias (falla en vulnerabilidades high) y build.

```bash
npm run ci
```

replica localmente la parte de calidad; el build completo en CI usa Ubuntu con más memoria que muchos portátiles Windows.

---

## Estructura (lo importante)

```
src/
  app/          # Páginas y rutas API (App Router)
  server/       # services + repositories
  lib/          # auth, cifrado, validación, logger
  models/       # Esquemas Mongoose
tests/          # Unitarios e integración
scripts/        # Índices, salud de BD, migraciones
monorepo-wsp/   # Microservicio WhatsApp
docs/OPS.md     # Runbook de operaciones
```

---

## Versión

**1.0.0** — hardening de seguridad, CI, tests de integración, rate limits en Mongo, APIs públicas revisadas. Historial completo en [`CHANGELOG.md`](CHANGELOG.md).

Si algo no cuadra con lo que ves en producción, revisa primero `.env`, luego `npm run db:health` y los logs JSON en Vercel (`service: "control-master"`).
