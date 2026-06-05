# Operaciones — Control Master

Guía breve para mantenimiento, monitoreo y tareas programadas.

## Scripts de mantenimiento

| Comando | Descripción |
|---------|-------------|
| `npm run db:health` | Ping a MongoDB, conteos por colección, tokens expirados y resumen de índices |
| `npm run db:indexes` | Sincroniza índices definidos en `src/models/index.ts` |
| `npm run migrate:report-codes` | Migra códigos de reporte legacy |

Ejecutar `db:health` y `db:indexes` tras despliegues o cambios de esquema.

## Crons (Vercel)

Definidos en `vercel.json`:

| Ruta | Horario (UTC) | Función |
|------|---------------|---------|
| `/api/cron/shift-reminders` | `15 17 * * *` (17:15 UTC) | Recordatorios de turno |
| `/api/cron/cleanup-tokens` | `0 9 * * *` (09:00 UTC) | Limpieza de sesiones expiradas |

Todas las rutas `/api/cron/*` exigen header `Authorization: Bearer $CRON_SECRET`.

## Monitoreo

- **Público:** `GET /api/health` → `{ "status": "ok" }` (ideal para UptimeRobot / Better Stack).
- **Detallado:** misma ruta con sesión ADMIN/BOSS/ENGINEER → checks de MongoDB, GeoIP y cifrado.
- **Logs:** las APIs emiten JSON estructurado (`src/lib/logger.ts`) visible en Vercel Logs.

## Rotación de claves de cifrado

`CREDENTIALS_ENC_KEY` y `FILE_ENC_KEY` son claves AES-256 en base64 (32 bytes decodificados).

1. Generar nueva clave: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
2. **Archivos subidos:** re-cifrar blobs en `uploadedFiles` con la nueva clave (script dedicado si aplica).
3. **Credenciales:** re-cifrar documentos en `credentials` antes de cambiar la variable en producción.
4. Actualizar variables en Vercel y reiniciar despliegue.
5. Mantener la clave anterior en un vault seguro hasta confirmar lectura de todos los registros.

No rotar en caliente sin plan de migración: los datos cifrados con la clave anterior no serán legibles.

## Rate limits

La colección `rateLimits` usa TTL en `resetAt` (índice `expireAfterSeconds: 0`). Ejecutar `npm run db:indexes` si el índice no existe en el cluster.
