import { app, BrowserWindow } from 'electron';
import path from 'path';
const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // Change this line
        },
    });
    mainWindow.loadFile('index.html');
};
app.whenReady().then(createWindow);
