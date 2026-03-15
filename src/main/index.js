import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerIpcHandlers } from './ipc/index.js';
import db from './models/index.js'; // Synchronize Sequelize Models
import AuthService from './services/AuthService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Basic window setup
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    center: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, '../../assets/icons/logo.png')
  });

  // Load from vite dev server in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built index.html
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }
}

app.whenReady().then(async () => {
  // Synchronize database
  try {
    await db.sequelize.authenticate();
    console.log('[DB] Connection has been established successfully.');
    await db.sequelize.sync({ alter: false }); // Standard sync
    console.log('[DB] All models were synchronized successfully.');
  } catch (error) {
    console.error('[DB] Unable to connect to the database:', error);
    dialog.showErrorBox(
      'Veritabanı Hatası',
      'Veritabanına bağlanılamadı. Sistem dosyaları erişilebilir mi?\n\nHata: ' + error.message
    );
    app.quit();
    return;
  }

  // Register all IPC handlers
  registerIpcHandlers();

  // Seed admin if necessary
  await AuthService.initializeAdmin();

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
