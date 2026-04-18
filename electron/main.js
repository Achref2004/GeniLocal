import { app, BrowserWindow, Menu, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import isDev from 'electron-is-dev';
import kill from 'tree-kill';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global variables
let mainWindow;
let backendProcess;
let backendReady = false;
let backendStartTime = null;
let backendRetryCount = 0;

// Backend configuration
const BACKEND_PORT = 8000;
const BACKEND_HOST = '127.0.0.1';
const BACKEND_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}`;
const BACKEND_TIMEOUT = 30000; // 30 seconds
const BACKEND_RESTART_DELAY = 3000; // 3 seconds
const MAX_BACKEND_RETRIES = 3;

/**
 * Start Python FastAPI backend
 */
function killExistingOnPort(port) {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      const findCmd = spawn('cmd', ['/c', `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port} ^| findstr LISTENING') do taskkill /PID %a /F`], { stdio: 'ignore', shell: true });
      findCmd.on('close', () => resolve());
      findCmd.on('error', () => resolve());
      setTimeout(() => resolve(), 3000);
    } else {
      const findCmd = spawn('sh', ['-c', `lsof -ti :${port} | xargs kill -9 2>/dev/null`], { stdio: 'ignore' });
      findCmd.on('close', () => resolve());
      findCmd.on('error', () => resolve());
      setTimeout(() => resolve(), 3000);
    }
  });
}

async function startBackend() {
  console.log(`[DESKTOP] Starting backend... (attempt ${backendRetryCount + 1}/${MAX_BACKEND_RETRIES})`);
  backendReady = false;
  backendStartTime = Date.now();

  // Kill any existing process on the port
  await killExistingOnPort(BACKEND_PORT);
  // Small delay after kill to let the port free up
  await new Promise(r => setTimeout(r, 500));

  const backendPath = path.join(__dirname, '../study_backend');
  const pythonScript = path.join(backendPath, 'main.py');

  // Determine Python executable
  const pythonExe = process.platform === 'win32' ? 'python' : 'python3';

  try {
    backendProcess = spawn(pythonExe, [pythonScript], {
      cwd: backendPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });

    console.log(`[DESKTOP] Backend process started (PID: ${backendProcess.pid})`);

    // Listen for backend ready signal
    backendProcess.stdout.on('data', (data) => {
      const message = data.toString();
      console.log(`[BACKEND] ${message.trim()}`);

      // Check for Uvicorn startup message
      if (message.includes('Uvicorn running on') || message.includes('Application startup complete')) {
        if (!backendReady) {
          backendReady = true;
          console.log(`[DESKTOP] Backend is ready (took ${Date.now() - backendStartTime}ms)`);
          mainWindow && mainWindow.webContents.send('backend-status', { status: 'connected' });
        }
      }
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`[BACKEND ERROR] ${data.toString().trim()}`);
    });

    backendProcess.on('error', (error) => {
      console.error(`[DESKTOP] Failed to start backend: ${error.message}`);
      handleBackendError();
    });

    backendProcess.on('exit', (code) => {
      console.log(`[DESKTOP] Backend exited with code ${code}`);
      if (code !== 0 && !app.isQuitting) {
        handleBackendError();
      }
    });

    // Timeout if backend doesn't start
    setTimeout(() => {
      if (!backendReady) {
        console.warn('[DESKTOP] Backend startup timeout');
        handleBackendError();
      }
    }, BACKEND_TIMEOUT);

  } catch (error) {
    console.error(`[DESKTOP] Error spawning backend: ${error.message}`);
    handleBackendError();
  }
}

/**
 * Handle backend errors and attempt restart
 */
function handleBackendError() {
  backendReady = false;
  backendRetryCount++;

  if (backendRetryCount >= MAX_BACKEND_RETRIES) {
    console.error(`[DESKTOP] Backend failed after ${MAX_BACKEND_RETRIES} attempts. Giving up.`);
    if (mainWindow) {
      mainWindow.webContents.send('backend-status', {
        status: 'error',
        message: `Backend failed to start after ${MAX_BACKEND_RETRIES} attempts. Please check that Python and required packages are installed, and that port ${BACKEND_PORT} is free.`
      });
    }
    return;
  }

  if (mainWindow) {
    mainWindow.webContents.send('backend-status', {
      status: 'error',
      message: `Backend failed to start. Retrying (${backendRetryCount}/${MAX_BACKEND_RETRIES})...`
    });
  }

  // Attempt restart with delay
  setTimeout(() => {
    if (!backendReady) {
      console.log(`[DESKTOP] Attempting to restart backend (${backendRetryCount + 1}/${MAX_BACKEND_RETRIES})...`);
      stopBackend();
      startBackend();
    }
  }, BACKEND_RESTART_DELAY);
}

/**
 * Stop Python backend gracefully
 */
function stopBackend() {
  if (backendProcess && !backendProcess.killed) {
    console.log('[DESKTOP] Stopping backend...');

    if (process.platform === 'win32') {
      // Windows: use tree-kill to kill process tree
      kill(backendProcess.pid, 'SIGTERM', (error) => {
        if (error) console.error('[DESKTOP] Error killing backend:', error);
        else console.log('[DESKTOP] Backend stopped');
      });
    } else {
      // Unix: send SIGTERM
      backendProcess.kill('SIGTERM');
    }

    backendProcess = null;
    backendReady = false;
  }
}

/**
 * Create main application window
 */
function createWindow() {
  console.log('[DESKTOP] Creating main window...');

  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true,
    },
    icon: path.join(__dirname, '../assets/icon.png'),
  });

  // Load app
  if (isDev) {
    console.log('[DESKTOP] Loading from dev server (http://localhost:5173)');
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools(); // Open dev tools in development
  } else {
    console.log('[DESKTOP] Loading from bundled app');
    mainWindow.loadFile(path.join(__dirname, '../study/dist/index.html'));
  }

  mainWindow.on('closed', () => {
    console.log('[DESKTOP] Window closed');
    mainWindow = null;
  });

  // Setup menu
  setupMenu();
}

/**
 * Setup application menu
 */
function setupMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow && mainWindow.reload();
          },
        },
        {
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            mainWindow && mainWindow.webContents.reloadIgnoringCache();
          },
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => {
            mainWindow && mainWindow.webContents.toggleDevTools();
          },
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'GeniLocal Desktop',
              message: 'GeniLocal - Learning Platform',
              detail: 'Version 1.0.0\n\nA comprehensive study and learning platform with AI-powered features.',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * IPC Handlers
 */

// Get backend status
ipcMain.handle('get-backend-status', () => {
  return {
    status: backendReady ? 'connected' : 'disconnected',
    url: BACKEND_URL,
    port: BACKEND_PORT,
  };
});

// Restart backend
ipcMain.handle('restart-backend', async () => {
  console.log('[DESKTOP] Restarting backend via IPC...');
  stopBackend();
  startBackend();
  return { status: 'restarting' };
});

// Get system info
ipcMain.handle('get-system-info', () => {
  return {
    platform: process.platform,
    arch: process.arch,
    version: app.getVersion(),
    nodeVersion: process.version,
    tmpdir: os.tmpdir(),
  };
});

// Get app logs
ipcMain.handle('get-logs', (event, lines = 100) => {
  // In production, implement proper logging
  return 'Logs not available in production';
});

/**
 * App Event Handlers
 */

app.on('ready', () => {
  console.log('[DESKTOP] Electron app ready');
  console.log(`[DESKTOP] Platform: ${process.platform}`);
  console.log(`[DESKTOP] App version: ${app.getVersion()}`);

  // Start backend before creating window
  startBackend();

  // Create window after a short delay to let backend initialize
  setTimeout(() => {
    createWindow();
  }, 1000);
});

app.on('window-all-closed', () => {
  console.log('[DESKTOP] All windows closed');
  // On macOS, apps stay active until user quits
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  console.log('[DESKTOP] App activated');
  // On macOS, re-create window when dock icon clicked
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  console.log('[DESKTOP] App quitting...');
  app.isQuitting = true;
  stopBackend();
});

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[DESKTOP] Uncaught exception:', error);
});

console.log('[DESKTOP] Main process initialized');
