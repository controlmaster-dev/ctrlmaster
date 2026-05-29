const { contextBridge, ipcRenderer } = require('electron');

// Exponer un conjunto limitado y seguro de APIs a la ventana de renderizado
contextBridge.exposeInMainWorld('electronAPI', {
  saveServerUrl: (url) => ipcRenderer.send('save-server-url', url),
  onSaveServerUrlResponse: (callback) => {
    // Remover oyentes anteriores para evitar fugas de memoria
    ipcRenderer.removeAllListeners('save-server-url-response');
    ipcRenderer.on('save-server-url-response', (event, response) => callback(response));
  },
  getCurrentUrl: () => ipcRenderer.send('get-current-url'),
  onGetCurrentUrlResponse: (callback) => {
    ipcRenderer.removeAllListeners('get-current-url-response');
    ipcRenderer.on('get-current-url-response', (event, response) => callback(response));
  },
  retryConnection: () => ipcRenderer.send('retry-connection')
});
