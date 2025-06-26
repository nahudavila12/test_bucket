import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';

let mainWindow: BrowserWindow | null = null;

const BUCKET_URL = 'https://storage.googleapis.com/TU_BUCKET';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    show: false,
    backgroundColor: '#1a1a1a'
  });

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

// Obtener lista de versiones disponibles
ipcMain.handle('get-versions', async () => {
  try {
    // Obtener lista de versiones del bucket
    const response = await axios.get(`${BUCKET_URL}/versions/index.json`);
    const versions = response.data.versions;

    // Ordenar versiones por fecha de lanzamiento (más reciente primero)
    return versions.sort((a: any, b: any) => 
      new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
    );
  } catch (error) {
    console.error('Error al obtener versiones:', error);
    throw error;
  }
});

// Descargar una versión específica
ipcMain.handle('download-app', async (event, url: string, version: string) => {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });

    const downloadPath = path.join(
      app.getPath('userData'),
      'versions',
      version,
      'ivolution.exe'
    );

    // Asegurar que el directorio existe
    fs.mkdirSync(path.dirname(downloadPath), { recursive: true });

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
    console.error('Error al descargar:', error);
    throw error;
  }
}); 