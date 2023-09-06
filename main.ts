import { app, BrowserWindow } from 'electron';
import path from 'path';

const createWindow = (): void => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.ts'),
    },
  });

  mainWindow.loadFile('index.html');
};

app.whenReady().then(createWindow);
