import { readFileSync, writeFileSync, existsSync } from 'fs';
import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import { initDB } from './database';
import { registerIPCHandlers } from './ipc-handlers';
import { appUpdater } from './updater';
import { SyncHub, SYNC_PORT } from './sync-hub';
import { logger } from './logger';

export const syncHub = new SyncHub();

// Global error handlers
process.on('uncaughtException', (error) => {
  logger.fatal('uncaughtException', { error: String(error), stack: error?.stack });
});
process.on('unhandledRejection', (reason) => {
  logger.fatal('unhandledRejection', { reason: String(reason), stack: (reason as any)?.stack });
});

function createWindow() {
  const settingsPath = join(app.getPath('userData'), 'window-state.json');
  let windowState: { width: number; height: number; x?: number; y?: number } = { width: 1200, height: 800 };

  if (existsSync(settingsPath)) {
    try {
      const saved = JSON.parse(readFileSync(settingsPath, 'utf-8'));
      windowState = { ...windowState, ...saved };
    } catch {}
  }

  const mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    ...(windowState.x !== undefined && windowState.y !== undefined ? { x: windowState.x, y: windowState.y } : {}),
    show: false,
    autoHideMenuBar: true,
    icon: join(__dirname, '../../src/assets/images/logo.ico'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.on('resize', () => {
    const bounds = mainWindow.getBounds();
    try { writeFileSync(settingsPath, JSON.stringify({ width: bounds.width, height: bounds.height, x: bounds.x, y: bounds.y })); } catch {}
  });

  mainWindow.on('move', () => {
    const bounds = mainWindow.getBounds();
    try { writeFileSync(settingsPath, JSON.stringify({ width: bounds.width, height: bounds.height, x: bounds.x, y: bounds.y })); } catch {}
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer Console]: ${message} (Line ${line} in ${sourceId})`);
  });
}

app.whenReady().then(() => {
  initDB();
  registerIPCHandlers();
  syncHub.start(SYNC_PORT);
  createWindow();

  const wins = BrowserWindow.getAllWindows();
  if (wins.length > 0) {
    appUpdater.init(wins[0]);
    appUpdater.checkOnLaunch();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});