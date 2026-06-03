const { app, BrowserWindow, Menu, Tray, shell, ipcMain, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
const tray = null;
let serverUrl = '';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const configPath = path.join(app.getPath('userData'), 'config.json');

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

function saveConfig(url) {
  try {
    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

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
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const originalUserAgent = mainWindow.webContents.getUserAgent();
  mainWindow.webContents.setUserAgent(`${originalUserAgent} ControlMasterDesktop/1.0`);

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
      header a.flex {
        -webkit-app-region: no-drag !important;
      }
    `;

    if (process.platform === 'darwin') {
      css += `
        header {
          padding-left: 80px !important;
        }
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

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    if (errorCode === -3) return;

    console.log(`Fallo al cargar la URL: ${validatedURL}. Código de error: ${errorCode} (${errorDescription})`);
    mainWindow.loadFile(path.join(__dirname, 'offline.html'));
  });

  loadConfig();

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000').catch(() => {
      mainWindow.loadFile(path.join(__dirname, 'offline.html'));
    });
    mainWindow.webContents.openDevTools();
  } else {
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
      'enlace.org',
      'enlacecr.dev'
    ];

    try {
      const parsedUrl = new URL(navigationUrl);
      const isAllowed = allowedHosts.some(host =>
        parsedUrl.hostname === host || parsedUrl.hostname.endsWith(`.${host}`)
      );

      if (!isAllowed) {
        event.preventDefault();
        shell.openExternal(navigationUrl);
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

function createTray() {
  try {
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

app.whenReady().then(() => {
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
