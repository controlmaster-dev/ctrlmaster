# 🟢 CtrlMaster WhatsApp API

WhatsApp API profesional para CtrlMaster con cola de mensajes, reconexión automática y monitoreo.

## 🚀 Características

- ✅ **Cola de mensajes** con retry automático (hasta 3 intentos)
- ✅ **Reconexión inteligente** con backoff exponencial
- ✅ **Rate limiting** para evitar bloqueos
- ✅ **Autenticación** con API Key
- ✅ **Health check** con métricas en tiempo real
- ✅ **Logs estructurados** con Pino
- ✅ **Docker ready** + PM2 para producción
- ✅ **Envío masivo** de mensajes con cola

---

## 📦 Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables

```bash
cp .env.example .env
```

Edita `.env`:

```env
WHATSAPP_API_KEY=tu-clave-secreta-aqui
PORT=3001
```

### 3. Ejecutar en desarrollo

```bash
npm run dev
```

### 4. Escanear QR

La primera vez que inicies, aparecerá un **QR en la terminal**. Escanéalo con WhatsApp:
1. Abre WhatsApp en tu teléfono
2. Ve a **Dispositivos vinculados**
3. Toca **Vincular un dispositivo**
4. Escanea el QR

La sesión se guarda automáticamente, así que no necesitas escanear cada vez.

---

## 🔌 Uso de la API

### Enviar un mensaje

```bash
curl -X POST http://localhost:3001/api/send-message \
  -H "Content-Type: application/json" \
  -H "X-API-Key: tu-api-key" \
  -d '{
    "phone": "50688888888",
    "message": "Hola desde CtrlMaster! 👋"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "phone": "50688888888",
    "sentAt": "2025-04-12T10:30:00.000Z"
  }
}
```

### Enviar mensajes masivos

```bash
curl -X POST http://localhost:3001/api/send-bulk \
  -H "Content-Type: application/json" \
  -H "X-API-Key: tu-api-key" \
  -d '{
    "messages": [
      { "phone": "50688888888", "message": "Mensaje 1" },
      { "phone": "50677777777", "message": "Mensaje 2" },
      { "phone": "50666666666", "message": "Mensaje 3" }
    ]
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "queued": 3,
    "queueIds": ["id1", "id2", "id3"],
    "queuedAt": "2025-04-12T10:30:00.000Z"
  }
}
```

### Health check

```bash
curl http://localhost:3001/api/health
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "status": "connected",
    "uptime": 3600000,
    "messagesSent": 150,
    "messagesFailed": 2,
    "queueSize": 0,
    "lastReconnect": null,
    "reconnectAttempts": 0
  }
}
```

### Estado de la cola

```bash
curl -H "X-API-Key: tu-api-key" http://localhost:3001/api/queue
```

### Limpiar cola

```bash
curl -X POST -H "X-API-Key: tu-api-key" http://localhost:3001/api/queue/clear
```

---

## 🐳 Docker

### Build

```bash
npm run build
docker compose build
```

### Run

```bash
docker compose up -d
```

### Logs

```bash
docker compose logs -f
```

---

## 🔄 Producción con PM2

```bash
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 📋 Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/health` | ❌ | Health check |
| `POST` | `/api/send-message` | ✅ | Enviar mensaje |
| `POST` | `/api/send-bulk` | ✅ | Enviar mensajes masivos |
| `GET` | `/api/queue` | ✅ | Estado de la cola |
| `POST` | `/api/queue/clear` | ✅ | Limpiar cola |

---

## 🔐 Seguridad

- **API Key requerida** en header `X-API-Key`
- **Rate limiting**: 30 requests/minuto
- **Helmet** headers para protección HTTP
- **Sesiones guardadas** localmente (no se escanea QR cada vez)

---

## 🧩 Integración con CtrlMaster

Desde tu app Next.js, llama a la API así:

```typescript
// src/lib/whatsapp.ts
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'http://localhost:3001';
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY;

export async function sendWhatsApp(phone: string, message: string) {
  const res = await fetch(`${WHATSAPP_API_URL}/api/send-message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': WHATSAPP_API_KEY!,
    },
    body: JSON.stringify({ phone, message }),
  });

  if (!res.ok) throw new Error('Error enviando WhatsApp');
  return res.json();
}
```

---

## 📊 Variables de Entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PORT` | `3001` | Puerto del servidor |
| `WHATSAPP_API_KEY` | `change-me-in-production` | API key para auth |
| `WHATSAPP_SESSION_NAME` | `ctrlmaster-session` | Nombre de sesión |
| `RECONNECT_INTERVAL` | `5000` | ms entre reintentos |
| `MAX_RECONNECT_ATTEMPTS` | `10` | Máximos reintentos |
| `MESSAGE_QUEUE_LIMIT` | `100` | Máx mensajes en cola |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Ventana de rate limit |
| `RATE_LIMIT_MAX_REQUESTS` | `30` | Máx requests por ventana |
| `LOG_LEVEL` | `info` | Nivel de logs (debug/info/warn/error) |

---

## 🛠️ Troubleshooting

### QR no aparece
- Elimina la carpeta `sessions/` y reinicia
- Verifica que el puerto 3001 esté disponible

### Mensajes no se envían
- Verifica el health check: `GET /api/health`
- Si `status` es `disconnected`, reinicia el servicio

### Sesión se pierde
- Asegúrate de que la carpeta `sessions/` esté persistida (volumen en Docker)
- No ejecutes `npm run dev` con `sessions/` en `.gitignore`

### Demasiados errores
- Revisa logs: `docker compose logs -f` o `pm2 logs`
- Verifica que el número de teléfono tenga código de país
