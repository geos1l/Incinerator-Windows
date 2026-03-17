import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../src/shared/ipc-events';

contextBridge.exposeInMainWorld('incinerator', {
  widgetClicked: () => ipcRenderer.send(IPC.WIDGET_CLICKED),
  filesDropped: (paths: string[]) => ipcRenderer.send(IPC.FILES_DROPPED, paths),
  getRecycleBin: () => ipcRenderer.invoke(IPC.GET_RECYCLE_BIN),
  getAllFiles: () => ipcRenderer.invoke(IPC.GET_ALL_FILES),
  permanentDelete: (filePath: string) => ipcRenderer.invoke(IPC.PERMANENT_DELETE, filePath),
  scheduleDelete: (filePath: string) => ipcRenderer.invoke(IPC.SCHEDULE_DELETE, filePath),
  restoreFile: (fileName: string) => ipcRenderer.invoke(IPC.RESTORE_FILE, fileName),
  getRecycleBinSize: () => ipcRenderer.invoke(IPC.GET_RECYCLE_BIN_SIZE),
  getDiskUsage: () => ipcRenderer.invoke(IPC.GET_DISK_USAGE),
  widgetResize: (expanded: boolean) => ipcRenderer.send(IPC.WIDGET_RESIZE, expanded),
  widgetStartDrag: () => ipcRenderer.send(IPC.WIDGET_START_DRAG),
  widgetStopDrag: () => ipcRenderer.invoke(IPC.WIDGET_STOP_DRAG),
  windowMinimize: () => ipcRenderer.send(IPC.WINDOW_MINIMIZE),
  windowClose: () => ipcRenderer.send(IPC.WINDOW_CLOSE),
  onFireStateUpdate: (callback: (state: string) => void) => {
    ipcRenderer.on(IPC.FIRE_STATE_UPDATE, (_event, state) => callback(state));
  },
});
