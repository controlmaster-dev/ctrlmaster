# Changelog

Cambios relevantes por fase del plan de hardening. Las versiones siguen semver aproximado.

## [1.0.0] — 2026-06-05

Primera versión que consideramos lista para producción interna con controles razonables.

### Seguridad (Fases 1 y 4)

- Middleware valida tokens en MongoDB (ya no basta con tener cookie).
- Sesión solo en `auth-token` httpOnly; fuera `user-id` y perfil en `localStorage`.
- Cifrado obligatorio en producción (`CREDENTIALS_ENC_KEY`, `FILE_ENC_KEY`).
- Comentarios: el autor sale de la sesión, no del body del cliente.
- `/api/users` protegido; directorio público en `/api/users/public`.
- Bloqueo de login por IP y cuenta (5 intentos / 15 min).
- Rate limit solo en MongoDB en producción (sin fallback silencioso a memoria).
- Contraseñas legacy SHA-256 se re-hashean a scrypt al login; plaintext eliminado.
- CSP sin `unsafe-eval` en producción; GeoIP por HTTPS.
- Admins de configuración vía `CONFIG_ADMIN_EMAILS`.

### Calidad (Fase 2)

- GitHub Actions: ESLint, typecheck, tests, audit, build.
- Typecheck dividido app/tests para evitar OOM.
- ESLint activo en build; `npm audit --audit-level=high` en CI.

### Tests (Fase 3)

- Infra de integración con MongoDB en CI (replica set).
- Cobertura de auth, reportes, upload, credenciales, middleware, comentarios.

### Performance y ops (Fase 5)

- Límites de paginación (reportes default 25, max 100).
- Bootstrap parametrizable (`reportsLimit`, `commentsLimit`).
- Logger JSON estructurado; `npm run db:health`.
- TTL en colección `rateLimits`.
- Runbook en `docs/OPS.md`.

### Documentación (Fase 6)

- Este README y changelog.
- `.env.example` limpiado y comentado.

---

## [0.3.0] — (histórico, pre-tag)

Tests de integración y helpers de BD añadidos en el repo.

## [0.2.0] — (histórico, pre-tag)

CI/CD y correcciones de pipeline de build.

## [0.1.0]

Versión inicial del proyecto en el monorepo.
