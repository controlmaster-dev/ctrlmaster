# Patrón `apiHandler` + capas server

## Dominios con service/repository

| Dominio | Rutas | Service | Repository |
|---------|-------|---------|------------|
| Usuarios | `users`, `mentions`, `heartbeat` | `userService` | `userRepository` |
| Reportes | `reports`, `[id]`, `view` | `reportService` | `reportRepository` |
| Auth | `auth/login`, `auth/register` | `authService` | (+ `registrationCodeRepository` en registro) |
| Correo PDF | `sendReportEmail` | `reportEmailService` | — |
| Horarios | `schedule`, `schedule/config` | `scheduleService` | `scheduleRepository` |
| Eventos | `special-events`, `shifts` | `specialEventService` | `specialEventRepository` |
| Códigos registro | `auth/registration-codes` | `registrationCodeService` | `registrationCodeRepository` |
| Credenciales | `credentials` | `credentialService` | `credentialRepository` |

## Otras rutas con `apiHandler`

`bootstrap`, `credentials` (ver arriba), `comments`, `reactions`, `streams`, `social/toggle`, etc.

## Casos especiales (sin handler JSON completo)

| Ruta | Motivo |
|------|--------|
| `upload` | `multipart/form-data` + rate limit |
| `calendar/[userId]` | feed ICS |
| `health`, `proxy/whatsapp` | health / proxy |
| `cron/*` | auth cron |

## Helpers

- `errorResponse.ts` — 500 genérico, Zod, `ApiError`
- `rateLimitResponse.ts` — 429 (`AUTH` en login/register)

```ts
export const GET = apiHandler(
  { auth: true, roles: ["ADMIN"] },
  async ({ query }) => myService(query)
);
```

Devolver `NextResponse` para cookies, cache o binarios.
