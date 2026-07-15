import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import { initDB } from './database';
import { registerIPCHandlers } from './ipc-handlers';
import { appUpdater } from './updater';

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught exception:', error);
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled rejection:', reason);
});

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    icon: join(__dirname, '../../src/assets/images/logo.ico'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
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
