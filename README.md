# Incinerator

Incinerate the clutter. **Incinerator** is a desktop app that makes cleanup feel like feeding a firepit. This is the windows version. If you're a mac user check out this repo https://github.com/muhibwqr/incinerator

https://github.com/geos1l/Cursor-Freeform-/raw/main/demo-video.mp4

## Install

1. Download the latest installer from **Releases**.
2. Run `Incinerator Setup X.Y.Z.exe`.
3. A small fire widget appears on your desktop. Click it to open the main UI.

### Quitting

Incinerator runs in the background. To fully exit:
- Right-click the tray icon → **Quit**

## How it works

- **Schedule**: drag a file/card to the fire → it goes to the Windows Recycle Bin (recoverable)
- **Incinerate**: burn scheduled items to permanently delete
- **Undo**: restores from the Recycle Bin (note: if multiple items share the same filename, Undo restores the first match)

## Privacy

Incinerator is designed to work fully offline. If telemetry is enabled, it only sends **anonymous, aggregate usage** (no file names, no file contents).

## Development

```bash
npm install
npm start
```

This starts the webpack dev server and Electron.

## Build an installer (Windows)

```bash
npm run dist
```

Installer output goes to the `installer-output*/` folder.

## Project structure

```
electron/        Main process (Electron)
src/widget/      Floating fire widget renderer
src/main-ui/     Main review UI renderer
src/shared/      Shared types, IPC events, ranking
assets/firepit/  Firepit animation frames
assets/fire/     Fire sprite frames
assets/fonts/    Bundled fonts (offline)
```
