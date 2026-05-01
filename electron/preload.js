/**
 * Preload script - Exposes safe IPC APIs to renderer
 * Uses CommonJS (require) instead of ES6 import for Electron compatibility
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose IPC API to frontend
contextBridge.exposeInMainWorld('ipc', {
  // Backend management
  getBackendStatus: () => ipcRenderer.invoke('get-backend-status'),
  restartBackend: () => ipcRenderer.invoke('restart-backend'),

  // System info
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),

  // Logging
  getLogs: (lines) => ipcRenderer.invoke('get-logs', lines),

  // Listen for events from main process
  onBackendStatus: (callback) => {
    ipcRenderer.on('backend-status', (event, data) => callback(data));
  },

  // Remove listeners
  removeBackendStatusListener: () => {
    ipcRenderer.removeAllListeners('backend-status');
  },
});

console.log('[PRELOAD] IPC APIs exposed to renderer');
