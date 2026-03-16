# Guía de Despliegue y Persistencia (VPS)

Este documento explica cómo migrar tu aplicación a un VPS (Servidor Privado Virtual) y asegurar que tus datos (reportes y usuarios) se mantengan seguros.

## 1. Arquitectura de Datos
Tu aplicación usa **SQLite**. Esto significa que **toda tu base de datos es un único archivo** llamado `dev.db` ubicado en la carpeta raíz del proyecto.

> **¡IMPORTANTE!**
> Para "llevarte tus datos" a otro lado, solo necesitas copiar el archivo `dev.db`. Ese archivo contiene todos los usuarios y reportes creados.

## 2. Pasos para Migrar a un VPS

### Paso 1: Preparar el VPS
Asegúrate de que tu VPS tenga instalados:
-   **Node.js** (versión 18 o superior).
-   **Git**.

### Paso 2: Subir el Proyecto
Puedes clonar tu repositorio en el VPS:
```bash
git clone <url-de-tu-repo>
cd enlace-control
```

### Paso 3: Instalar Dependencias
```bash
npm install
```

### Paso 4: Restaurar tus Datos (El paso clave)
Si quieres conservar los datos que tienes en tu computadora local:
1.  En tu computadora local, ubica el archivo `dev.db`.
2.  Cópialo a la carpeta raíz del proyecto en tu VPS (puedes usar SCP o FileZilla).
    ```bash
    # Ejemplo con SCP desde tu compu local
    scp dev.db usuario@tu-vps-ip:/ruta/al/proyecto/enlace-control/
    ```

### Paso 5: Generar Cliente Prisma
Una vez que el código y el archivo `dev.db` estén en el VPS, corre:
```bash
npx prisma generate
```
*(No corras `prisma migrate` ni `prisma db push` si ya copiaste tu `dev.db`, ya que podría intentar sobrescribir cosas. Solo necesitas generar el cliente).*

### Paso 6: Construir e Iniciar
```bash
npm run build
npm start
```
(O usa un gestor de procesos como **PM2** para mantenerlo activo: `pm2 start npm --name "repor" -- start`).

## Troubleshooting

### "Error en el servidor" (500) en Login
Si recibes un error 500 al intentar iniciar sesión, usualmente es porque Prisma no generó los binarios para Linux.
Ejecuta esto en la carpeta de tu VPS:
```bash
npx prisma generate
```
Esto creará el cliente de base de datos compatible con el sistema operativo del servidor.

### "Multiple lockfiles found"
Si ves advertencias sobre `package-lock.json`, asegúrate de estar ejecutando los comandos **dentro** de la carpeta del proyecto (ej: `cd /root/enl`) y no desde la raíz del servidor.

### Base de Datos
Asegúrate de haber copiado el archivo `dev.db` del Desktop a la carpeta del VPS.
```bash
ls -l dev.db
# Debería mostrar el archivo. Si no existe:
# scp /ruta/local/dev.db user@vps:/root/enl/dev.db
```

---

## Preguntas Frecuentes

### ¿Se borraron mis reportes anteriores?
Al ejecutar la limpieza reciente para eliminar usuarios duplicados, el script `seed.ts` tenía una instrucción para limpiar la base de datos completa (`deleteMany`).
-   **Sí, es probable que los reportes de prueba creados hoy se hayan limpiado** para asegurar que la base de datos estuviera íntegra y sin duplicados.
-   **De ahora en adelante**, los datos son persistentes en `dev.db`. No se borrarán a menos que borres el archivo o corras un comando de limpieza explícito.

### ¿Cómo hago copias de seguridad?
Simplemente copia el archivo `dev.db` a una ubicación segura (Dropbox, Google Drive, otro servidor) periódicamente.

### ¿Puedo cambiar de computadora?
Sí. Solo llévate el archivo `dev.db` contigo y ponlo en la carpeta del proyecto en la nueva computadora.
