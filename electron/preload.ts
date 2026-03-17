import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../src/shared/ipc-events';

contextBridge.exposeInMainWorld('incinerator', {
  widgetClicked: () => ipcRenderer.send(IPC.WIDGET_CLICKED),
  filesDropped: (paths: string[]) => ipcRenderer.send(IPC.FILES_DROPPED, paths),
  getRecycleBin: () => ipcRenderer.invoke(IPC.GET_RECYCLE_BIN),
  getAllFiles: () => ipcRenderer.invoke(IPC.GET_ALL_FILES),
  permanentDelete: (filePath: string) => ipcRenderer.invoke(IPC.PERMANENT_DELETE, filePath),
  scheduleDelete: (filePath: string) => ipcRenderer.invoke(IPC.SCHEDULE_DELETE, filePath),
  getRecycleBinSize: () => ipcRenderer.invoke(IPC.GET_RECYCLE_BIN_SIZE),
  windowMinimize: () => ipcRenderer.send(IPC.WINDOW_MINIMIZE),
  windowClose: () => ipcRenderer.send(IPC.WINDOW_CLOSE),
  onFireStateUpdate: (callback: (state: string) => void) => {
    ipcRenderer.on(IPC.FIRE_STATE_UPDATE, (_event, state) => callback(state));
  },
});
