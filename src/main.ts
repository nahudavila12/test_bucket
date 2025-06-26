import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    show: false,
    backgroundColor: '#1a1a1a'
  });

  // En desarrollo, carga la URL de desarrollo
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadFile(path.join(__dirname, '..', 'src', 'index.html'));
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'src', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Manejo de la descarga de la aplicación
ipcMain.handle('check-for-updates', async () => {
  try {
    const response = await axios.get('https://storage.googleapis.com/TU_BUCKET/latest-metadata.json');
    return response.data;
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('download-app', async (event, url: string, version: string) => {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });

    const platform = process.platform;
    const extension = platform === 'win32' ? '.exe' : '.app';
    const downloadPath = path.join(
      app.getPath('downloads'),
      `ivolution_v${version}${extension}`
    );

    const writer = fs.createWriteStream(downloadPath);
    const totalLength = response.headers['content-length'];

    response.data.pipe(writer);

    let downloadedLength = 0;
    response.data.on('data', (chunk: Buffer) => {
      downloadedLength += chunk.length;
      const progress = (downloadedLength / parseInt(totalLength)) * 100;
      event.sender.send('download-progress', progress);
    });

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(downloadPath));
      writer.on('error', reject);
    });
  } catch (error) {
    throw error;
  }
}); 