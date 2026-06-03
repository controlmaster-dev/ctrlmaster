const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveServerUrl: (url) => ipcRenderer.send('save-server-url', url),
  onSaveServerUrlResponse: (callback) => {
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
