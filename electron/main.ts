import { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { IPC } from '../src/shared/ipc-events';
import { moveToRecycleBin, permanentDelete, restoreFromRecycleBin, getRecycleBinFiles, getRecycleBinSizeMB } from './recycle';
import { scanFiles } from './file-scanner';
import { getFireState } from '../src/shared/ranking';
import { initTelemetry, trackFileAction, shutdownTelemetry } from './telemetry';
import { autoUpdater } from 'electron-updater';

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

let widgetWindow: BrowserWindow | null = null;
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

const isDev = !app.isPackaged;
const preloadPath = path.join(__dirname, 'preload.js');

function assetPath(filename: string): string {
  if (isDev) return path.join(__dirname, '..', 'assets', filename);
  return path.join(process.resourcesPath, filename);
}

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

const WIDGET_IDLE_SIZE = 56;
const WIDGET_EXPANDED_SIZE = 120;

function createWidgetWindow() {
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;
  const config = loadConfig();
  const defaultX = screenW - WIDGET_IDLE_SIZE - 24;
  const defaultY = screenH - WIDGET_IDLE_SIZE - 24;

  widgetWindow = new BrowserWindow({
    width: WIDGET_IDLE_SIZE,
    height: WIDGET_IDLE_SIZE,
    x: config.widgetX ?? defaultX,
    y: config.widgetY ?? defaultY,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    movable: true,
    icon: assetPath('icon.ico'),
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
    icon: assetPath('icon.ico'),
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

let lastFireState: string | null = null;
let lastFireCheckTime = 0;
const FIRE_CHECK_MIN_INTERVAL = 10_000;

function updateFireState(force = false) {
  if (!widgetWindow) return;
  if (!force && (Date.now() - lastFireCheckTime < FIRE_CHECK_MIN_INTERVAL)) return;
  try {
    lastFireCheckTime = Date.now();
    const sizeMB = getRecycleBinSizeMB();
    const state = getFireState(sizeMB);
    if (state !== lastFireState || force) {
      lastFireState = state;
      widgetWindow.webContents.send(IPC.FIRE_STATE_UPDATE, state);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(IPC.FIRE_STATE_UPDATE, state);
      }
    }
  } catch (err) {
    console.error('Error updating fire state:', err);
  }
}

app.on('second-instance', () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createMainWindow();
  }
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  shutdownTelemetry();
});

app.whenReady().then(() => {
  if (!isDev) {
    app.setLoginItemSettings({ openAtLogin: true });

    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.checkForUpdatesAndNotify().catch(() => {});
  }

  initTelemetry();

  const trayIcon = nativeImage.createFromPath(assetPath('icon.ico'));
  tray = new Tray(trayIcon.isEmpty() ? nativeImage.createEmpty() : trayIcon);
  tray.setToolTip('Incinerator');
  const trayMenu = Menu.buildFromTemplate([
    {
      label: 'Open Incinerator',
      click: () => {
        if (!mainWindow || mainWindow.isDestroyed()) createMainWindow();
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(trayMenu);
  tray.on('double-click', () => {
    if (!mainWindow || mainWindow.isDestroyed()) createMainWindow();
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  createWidgetWindow();

  ipcMain.on(IPC.WIDGET_CLICKED, () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      createMainWindow();
    }
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });

  ipcMain.on(IPC.FILES_DROPPED, (_event, filePaths: string[]) => {
    for (const fp of filePaths) {
      try {
        moveToRecycleBin(fp);
      } catch (err) {
        console.error(`Failed to recycle ${fp}:`, err);
      }
    }
    updateFireState(true);
  });

  ipcMain.handle(IPC.GET_RECYCLE_BIN, () => {
    return getRecycleBinFiles();
  });

  ipcMain.handle(IPC.GET_ALL_FILES, async () => {
    const scanned = await scanFiles();
    const recycled = getRecycleBinFiles();
    return [...scanned, ...recycled];
  });

  ipcMain.handle(IPC.PERMANENT_DELETE, (_event, filePath: string) => {
    try {
      permanentDelete(filePath);
      updateFireState(true);
      trackFileAction('incinerated', 1);
      return { success: true };
    } catch (err) {
      console.error(`Failed to permanently delete ${filePath}:`, err);
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle(IPC.SCHEDULE_DELETE, (_event, filePath: string) => {
    try {
      moveToRecycleBin(filePath);
      updateFireState(true);
      trackFileAction('scheduled', 1);
      return { success: true };
    } catch (err) {
      console.error(`Failed to schedule delete ${filePath}:`, err);
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle(IPC.RESTORE_FILE, (_event, fileName: string) => {
    try {
      restoreFromRecycleBin(fileName);
      updateFireState(true);
      return { success: true };
    } catch (err) {
      console.error(`Failed to restore ${fileName}:`, err);
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle(IPC.GET_RECYCLE_BIN_SIZE, () => {
    return getRecycleBinSizeMB();
  });

  ipcMain.handle(IPC.GET_DISK_USAGE, () => {
    try {
      const driveLetter = (process.env.SystemDrive || 'C:').replace(':', '');
      const output = require('child_process').execSync(
        `powershell -Command "(Get-PSDrive ${driveLetter} | Select-Object Used, Free | ConvertTo-Json)"`,
        { encoding: 'utf-8', timeout: 10000 }
      ).trim();
      const info = JSON.parse(output);
      const usedGB = (info.Used || 0) / (1024 ** 3);
      const freeGB = (info.Free || 0) / (1024 ** 3);
      const totalGB = usedGB + freeGB;
      return { usedGB, freeGB, totalGB, drive: `${driveLetter}:` };
    } catch (err) {
      console.error('Failed to get disk usage:', err);
      return { usedGB: 0, freeGB: 0, totalGB: 0, drive: 'C:' };
    }
  });

  let dragInterval: ReturnType<typeof setInterval> | null = null;
  let dragOffset = { x: 0, y: 0 };
  let dragMoved = false;

  ipcMain.on(IPC.WIDGET_START_DRAG, () => {
    if (!widgetWindow || dragInterval) return;
    const cursor = screen.getCursorScreenPoint();
    const [wx, wy] = widgetWindow.getPosition();
    dragOffset = { x: cursor.x - wx, y: cursor.y - wy };
    dragMoved = false;

    dragInterval = setInterval(() => {
      if (!widgetWindow) { clearInterval(dragInterval!); dragInterval = null; return; }
      const cur = screen.getCursorScreenPoint();
      const newX = cur.x - dragOffset.x;
      const newY = cur.y - dragOffset.y;
      const [ox, oy] = widgetWindow.getPosition();
      if (newX !== ox || newY !== oy) {
        dragMoved = true;
        widgetWindow.setPosition(newX, newY);
      }
    }, 8);
  });

  ipcMain.handle(IPC.WIDGET_STOP_DRAG, () => {
    if (dragInterval) { clearInterval(dragInterval); dragInterval = null; }
    if (widgetWindow) {
      const [x, y] = widgetWindow.getPosition();
      saveConfig({ widgetX: x, widgetY: y });
    }
    const wasDrag = dragMoved;
    dragMoved = false;
    return wasDrag;
  });

  ipcMain.on(IPC.WIDGET_RESIZE, (_event, expanded: boolean) => {
    if (!widgetWindow) return;
    const [x, y] = widgetWindow.getPosition();
    const size = expanded ? WIDGET_EXPANDED_SIZE : WIDGET_IDLE_SIZE;
    const currentSize = widgetWindow.getSize()[0];
    const offset = Math.round((currentSize - size) / 2);
    widgetWindow.setBounds({
      x: x + offset,
      y: y + offset,
      width: size,
      height: size,
    });
  });

  ipcMain.on(IPC.WINDOW_MINIMIZE, () => {
    mainWindow?.minimize();
  });

  ipcMain.on(IPC.WINDOW_CLOSE, () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close();
    }
  });

  setTimeout(() => updateFireState(true), 2000);
  setInterval(() => updateFireState(), 30000);
});

app.on('window-all-closed', () => {
  // Don't quit -- the widget stays alive in the background.
  // Only quit if isQuitting is true (user triggered app quit).
});
