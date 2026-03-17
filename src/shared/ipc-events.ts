export const IPC = {
  WIDGET_CLICKED: 'widget:clicked',
  FILES_DROPPED: 'widget:files-dropped',
  GET_RECYCLE_BIN: 'recycle:get',
  GET_ALL_FILES: 'files:get-all',
  PERMANENT_DELETE: 'files:permanent-delete',
  SCHEDULE_DELETE: 'files:schedule-delete',
  FIRE_STATE_UPDATE: 'widget:fire-state',
  GET_RECYCLE_BIN_SIZE: 'recycle:get-size',
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_CLOSE: 'window:close',
} as const;
