/**
 * Preload script - Exposes safe IPC APIs to renderer
 */

import { contextBridge, ipcRenderer } from 'electron';

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
