const { app, BrowserWindow, Menu, Tray, shell, ipcMain, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let tray = null;
let serverUrl = '';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const configPath = path.join(app.getPath('userData'), 'config.json');

// Cargar la configuración guardada (URL del servidor)
function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (data && data.serverUrl) {
        serverUrl = data.serverUrl.trim();
      }
    }
  } catch (error) {
    console.error('Error al cargar la configuración:', error);
  }
}

// Guardar la configuración (URL del servidor)
function saveConfig(url) {
  try {
    // Validar e incorporar protocolo si falta
    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }
    
    // Validar sintaxis básica de URL
    new URL(formattedUrl);
    
    fs.writeFileSync(configPath, JSON.stringify({ serverUrl: formattedUrl }, null, 2), 'utf8');
    serverUrl = formattedUrl;
    return true;
  } catch (error) {
    console.error('Error al guardar la configuración:', error);
    return false;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 650,
    title: 'Control Master',
    icon: path.join(__dirname, 'icon.png'),
    titleBarStyle: 'hidden',
    ...(process.platform === 'darwin' ? {
      trafficLightPosition: { x: 16, y: 16 }
    } : {
      titleBarOverlay: {
        color: '#000000',
        symbolColor: '#f3f4f6',
        height: 44
      }
    }),
    show: false, // Se muestra una vez cargado
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Personalizar el User-Agent para identificar la app de escritorio
  const originalUserAgent = mainWindow.webContents.getUserAgent();
  mainWindow.webContents.setUserAgent(`${originalUserAgent} ControlMasterDesktop/1.0`);

  // Inyectar CSS dinámicamente para soporte de barra personalizada sin tocar el código web
  mainWindow.webContents.on('dom-ready', () => {
    let css = `
      header {
        -webkit-app-region: drag !important;
      }
      header a, 
      header button, 
      header input, 
      header [role="button"],
      header .btn,
      header svg,
      header select,
      header kbd,
      header img,
      .theme-toggle,
      [data-palette],
      header [data-state],
      header span {
        -webkit-app-region: no-drag !important;
      }
      /* Permitir que el logo no sea arrastrado si es cliqueable */
      header a.flex {
        -webkit-app-region: no-drag !important;
      }
    `;

    if (process.platform === 'darwin') {
      css += `
        header {
          padding-left: 80px !important;
        }
        /* Ajuste para evitar que los traffic lights tapen el botón Volver en aside */
        aside {
          padding-top: 48px !important;
          -webkit-app-region: drag !important;
        }
        aside * {
          -webkit-app-region: no-drag !important;
        }
      `;
    } else {
      css += `
        header {
          padding-right: 140px !important;
        }
      `;
    }

    mainWindow.webContents.insertCSS(css).catch(err => {
      console.error('Error al inyectar CSS de la barra de título:', err);
    });
  });

  // Mostrar la ventana solo cuando esté lista para evitar parpadeos blancos
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Manejar fallas de carga (Sin conexión a internet o servidor caído)
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    // Ignorar redirecciones menores o cancelaciones
    if (errorCode === -3) return; 
    
    console.log(`Fallo al cargar la URL: ${validatedURL}. Código de error: ${errorCode} (${errorDescription})`);
    mainWindow.loadFile(path.join(__dirname, 'offline.html'));
  });

  // Determinar qué URL cargar
  loadConfig();

  if (isDev) {
    // En desarrollo, cargar el servidor local de Next.js
    mainWindow.loadURL('http://localhost:3000').catch(() => {
      mainWindow.loadFile(path.join(__dirname, 'offline.html'));
    });
    // Abrir DevTools en desarrollo
    mainWindow.webContents.openDevTools();
  } else {
    // En producción, cargar por defecto https://enlacecr.dev/ si no hay una personalizada en config.json
    const targetUrl = serverUrl || 'https://enlacecr.dev/';
    mainWindow.loadURL(targetUrl).catch(() => {
      mainWindow.loadFile(path.join(__dirname, 'offline.html'));
    });
  }

  // HARDENING DE SEGURIDAD (TODO: security)
  // 1. Evitar que la app navegue fuera de dominios de confianza
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const allowedHosts = [
      'localhost',
      '127.0.0.1',
      'vercel.app',
      'enlace.org' // Añade aquí tus dominios permitidos
    ];

    try {
      const parsedUrl = new URL(navigationUrl);
      const isAllowed = allowedHosts.some(host => 
        parsedUrl.hostname === host || parsedUrl.hostname.endsWith(`.${host}`)
      );

      if (!isAllowed) {
        event.preventDefault();
        shell.openExternal(navigationUrl); // Abrir enlaces externos en el navegador por defecto
      }
    } catch (e) {
      event.preventDefault();
    }
  });

  // 2. Interceptar nuevas ventanas (e.g. target="_blank") y abrirlas en el navegador por defecto
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Configurar la Bandeja del Sistema (Tray / Menu Bar)
function createTray() {
  // Intentar usar un icono plano del sistema. Para simplificar en esta demo, usamos un menú.
  // Nota: Deberías añadir un archivo icon.png adecuado en tu carpeta assets en producción.
  try {
    // Si no hay icono, no creará el tray para evitar errores visuales críticos
    // Pero configuramos el menú de la barra nativa del sistema
    const template = [
      {
        label: 'Control Master',
        submenu: [
          { label: 'Mostrar Aplicación', click: () => { if (mainWindow) mainWindow.show(); } },
          { label: 'Recargar', click: () => { if (mainWindow) mainWindow.webContents.reload(); } },
          { type: 'separator' },
          { 
            label: 'Configurar URL del Servidor', 
            click: () => {
              if (mainWindow) {
                mainWindow.loadFile(path.join(__dirname, 'setup.html'));
              }
            } 
          },
          { type: 'separator' },
          { label: 'Salir', click: () => { app.quit(); } }
        ]
      },
      {
        label: 'Editar',
        submenu: [
          { label: 'Deshacer', role: 'undo' },
          { label: 'Rehacer', role: 'redo' },
          { type: 'separator' },
          { label: 'Cortar', role: 'cut' },
          { label: 'Copiar', role: 'copy' },
          { label: 'Pegar', role: 'paste' },
          { label: 'Seleccionar todo', role: 'selectAll' }
        ]
      },
      {
        label: 'Ver',
        submenu: [
          { label: 'Recargar', role: 'reload' },
          { label: 'Forzar recarga', role: 'forceReload' },
          { label: 'Herramientas de desarrollo', role: 'toggleDevTools' },
          { type: 'separator' },
          { label: 'Restablecer zoom', role: 'resetZoom' },
          { label: 'Acercar', role: 'zoomIn' },
          { label: 'Alejar', role: 'zoomOut' },
          { type: 'separator' },
          { label: 'Pantalla completa', role: 'togglefullscreen' }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  } catch (error) {
    console.error('Error al configurar los menús:', error);
  }
}

// Canales de IPC seguros para comunicar el Frontend de configuración con Electron
ipcMain.on('save-server-url', (event, url) => {
  const success = saveConfig(url);
  if (success) {
    event.reply('save-server-url-response', { success: true, message: 'URL configurada con éxito.' });
    if (mainWindow) {
      mainWindow.loadURL(serverUrl).catch(() => {
        mainWindow.loadFile(path.join(__dirname, 'offline.html'));
      });
    }
  } else {
    event.reply('save-server-url-response', { success: false, message: 'URL inválida. Por favor verifica el formato.' });
  }
});

ipcMain.on('get-current-url', (event) => {
  event.reply('get-current-url-response', { serverUrl, isDev });
});

ipcMain.on('retry-connection', (event) => {
  if (mainWindow) {
    if (isDev) {
      mainWindow.loadURL('http://localhost:3000').catch(() => {
        mainWindow.loadFile(path.join(__dirname, 'offline.html'));
      });
    } else if (serverUrl) {
      mainWindow.loadURL(serverUrl).catch(() => {
        mainWindow.loadFile(path.join(__dirname, 'offline.html'));
      });
    } else {
      mainWindow.loadFile(path.join(__dirname, 'setup.html'));
    }
  }
});

// Eventos de ciclo de vida de la aplicación
app.whenReady().then(() => {
  // Configurar icono del Dock en macOS durante el desarrollo
  if (process.platform === 'darwin') {
    try {
      const image = nativeImage.createFromPath(path.join(__dirname, 'icon.png'));
      app.dock.setIcon(image);
    } catch (err) {
      console.error('Error al configurar el icono del Dock:', err);
    }
  }

  createTray();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
