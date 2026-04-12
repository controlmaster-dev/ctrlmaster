# 🔒 Seguridad y Performance - Documentación

## Autenticación

### Sesiones con HTTP-only Cookies
- Las sesiones se almacenan como **HTTP-only cookies** (`auth-token`)
- No accesibles desde JavaScript del navegador (protección XSS)
- Expiran automáticamente después de **24 horas**
- Se validan contra la base de datos en cada request

### Tokens de Sesión
- Almacenados en tabla `SessionToken` en PostgreSQL
- Tokens aleatorios de **64 bytes** (128 caracteres hex)
- Limpieza automática diaria vía cron job (`/api/cron/cleanup-tokens`)
- Revocación automática al hacer logout

### Endpoints Públicos
- `/api/auth/login` - Login
- `/api/auth/register` - Registro
- `/api/auth/registration-codes` - Códigos de registro
- `/api/auth/verify` - Verificación de sesión
- `/api/health` - Health check

### Endpoints Protegidos
Todos los demás endpoints requieren autenticación:
- Middleware verifica cookie `auth-token` en cada request
- APIs validan token contra base de datos con `validateApiAuth()`
- Control de roles: `requireRole(user, ['ADMIN', 'ENGINEER'])`

---

## Rate Limiting

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| `/api/auth/login` | 5 requests | 15 min |
| `/api/auth/register` | 5 requests | 15 min |
| `/api/upload` | 10 requests | 15 min |
| `/api/reports` (POST/PUT/DELETE) | 20 requests | 15 min |
| Resto de APIs | 100 requests | 15 min |

---

## Security Headers

Todos los responses incluyen:
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
```

---

## Validación de Archivos

Uploads (`/api/upload`):
- ✅ Validación de MIME type
- ✅ Validación de magic numbers (firma binaria)
- ✅ Máximo 10MB
- ✅ Solo imágenes (JPEG, PNG, GIF, WebP) y videos (MP4, WebM)
- ✅ Sanitización de nombres de archivo

---

## Health Check

Endpoint: `/api/health`

Verifica:
- ✅ Conexión a base de datos
- ✅ Servicios externos (GeoIP)
- ✅ Directorio de uploads
- ✅ Uso de memoria y uptime

---

## Variables de Entorno Requeridas

```env
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Security
CRON_SECRET=<token-secreto-para-cron-jobs>

# SMTP (para alertas de seguridad)
SMTP_PASSWORD=

# App
NEXTAUTH_SECRET=<generar-con-openssl-rand-base64-32>
NEXTAUTH_URL=https://tu-dominio.com
```

---

## Mejoras de Performance

### Imágenes
- Optimización automática a WebP/AVIF
- Dominios permitidos: `res.cloudinary.com`, `ui-avatars.com`, `unsplash.com`
- Cache de 1 año para uploads

### Code Splitting
Vendor chunks separados:
- `recharts.js` (~150KB)
- `framer-motion.js` (~120KB)
- `lucide-icons.js` (~80KB)

### Caching
- APIs de lectura: 60s cache (`s-maxage=60`)
- Static assets: 1 año (`max-age=31536000`)

### Dynamic Imports
- `react-player`: carga bajo demanda
- `recharts`: componentes cargados solo cuando se necesitan

---

## Cron Jobs (Vercel)

| Path | Schedule | Descripción |
|------|----------|-------------|
| `/api/cron/shift-reminders` | 11:15 AM CR | Recordatorios de turnos |
| `/api/cron/cleanup-tokens` | 3:00 AM CR | Limpieza de tokens expirados |

---

## Checklist de Seguridad para Deploy

- [ ] `DATABASE_URL` y `DIRECT_URL` configurados
- [ ] `NEXTAUTH_SECRET` generado con valor aleatorio fuerte
- [ ] `CRON_SECRET` configurado
- [ ] Dominio agregado a `allowedDevOrigins` si es necesario
- [ ] Base de datos migrada (`npx prisma migrate deploy`)
- [ ] `SessionToken` table creada
- [ ] IP del servidor en allowlist de Supabase (si aplica)
- [ ] Health check verificado: `GET /api/health`
