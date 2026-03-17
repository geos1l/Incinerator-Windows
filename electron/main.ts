import { app, BrowserWindow, ipcMain, screen } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { IPC } from '../src/shared/ipc-events';
import { moveToRecycleBin, permanentDelete, getRecycleBinFiles, getRecycleBinSizeMB } from './recycle';
import { scanFiles } from './file-scanner';
import { getFireState } from '../src/shared/ranking';

let widgetWindow: BrowserWindow | null = null;
let mainWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;
const preloadPath = path.join(__dirname, 'preload.js');

const CONFIG_PATH = path.join(app.getPath('userData'), 'incinerator-config.json');

function loadConfig(): Record<string, any> {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    }
  } catch { /* ignore */ }
  return {};
}

function saveConfig(data: Record<string, any>) {
  try {
    const existing = loadConfig();
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ ...existing, ...data }, null, 2));
  } catch { /* ignore */ }
}

function createWidgetWindow() {
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;
  const config = loadConfig();
  const defaultX = screenW - 144;
  const defaultY = screenH - 144;

  widgetWindow = new BrowserWindow({
    width: 120,
    height: 120,
    x: config.widgetX ?? defaultX,
    y: config.widgetY ?? defaultY,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    movable: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    widgetWindow.loadURL('http://localhost:9000/widget.html');
  } else {
    widgetWindow.loadFile(path.join(__dirname, 'renderer', 'widget.html'));
  }

  // Save position when the widget is moved
  widgetWindow.on('moved', () => {
    if (!widgetWindow) return;
    const [x, y] = widgetWindow.getPosition();
    saveConfig({ widgetX: x, widgetY: y });
  });

  widgetWindow.on('closed', () => { widgetWindow = null; });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    frame: false,
    show: false,
    backgroundColor: '#0e0e0e',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:9000/main.html');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'renderer', 'main.html'));
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

function updateFireState() {
  if (!widgetWindow) return;
  try {
    const sizeMB = getRecycleBinSizeMB();
    const state = getFireState(sizeMB);
    widgetWindow.webContents.send(IPC.FIRE_STATE_UPDATE, state);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC.FIRE_STATE_UPDATE, state);
    }
  } catch (err) {
    console.error('Error updating fire state:', err);
  }
}

app.whenReady().then(() => {
  createWidgetWindow();
  createMainWindow();

  ipcMain.on(IPC.WIDGET_CLICKED, () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  ipcMain.on(IPC.FILES_DROPPED, (_event, filePaths: string[]) => {
    for (const fp of filePaths) {
      try {
        moveToRecycleBin(fp);
      } catch (err) {
        console.error(`Failed to recycle ${fp}:`, err);
      }
    }
    updateFireState();
  });

  ipcMain.handle(IPC.GET_RECYCLE_BIN, () => {
    return getRecycleBinFiles();
  });

  ipcMain.handle(IPC.GET_ALL_FILES, () => {
    const scanned = scanFiles();
    const recycled = getRecycleBinFiles();
    return [...scanned, ...recycled];
  });

  ipcMain.handle(IPC.PERMANENT_DELETE, (_event, filePath: string) => {
    try {
      permanentDelete(filePath);
      updateFireState();
      return { success: true };
    } catch (err) {
      console.error(`Failed to permanently delete ${filePath}:`, err);
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle(IPC.SCHEDULE_DELETE, (_event, filePath: string) => {
    try {
      moveToRecycleBin(filePath);
      updateFireState();
      return { success: true };
    } catch (err) {
      console.error(`Failed to schedule delete ${filePath}:`, err);
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle(IPC.GET_RECYCLE_BIN_SIZE, () => {
    return getRecycleBinSizeMB();
  });

  ipcMain.on(IPC.WINDOW_MINIMIZE, () => {
    mainWindow?.minimize();
  });

  ipcMain.on(IPC.WINDOW_CLOSE, () => {
    mainWindow?.hide();
  });

  setTimeout(updateFireState, 2000);
  setInterval(updateFireState, 30000);
});

app.on('window-all-closed', () => {
  app.quit();
});
