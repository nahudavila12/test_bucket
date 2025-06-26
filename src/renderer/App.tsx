import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  LinearProgress,
  Paper,
  Typography,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import { ipcRenderer } from 'electron';

interface Version {
  version: string;
  platforms: {
    windows: string;
    mac: string;
  };
}

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4CAF50',
    },
    background: {
      default: '#1a1a1a',
      paper: '#2d2d2d',
    },
  },
});

const App: React.FC = () => {
  const [version, setVersion] = useState<Version | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkForUpdates();
    
    ipcRenderer.on('download-progress', (_, progress: number) => {
      setProgress(progress);
    });

    return () => {
      ipcRenderer.removeAllListeners('download-progress');
    };
  }, []);

  const checkForUpdates = async () => {
    try {
      setError(null);
      const data = await ipcRenderer.invoke('check-for-updates');
      setVersion(data);
    } catch (err) {
      setError('Error al buscar actualizaciones');
      console.error(err);
    }
  };

  const downloadApp = async () => {
    if (!version) return;

    try {
      setDownloading(true);
      setError(null);
      
      const platform = process.platform === 'win32' ? 'windows' : 'mac';
      const url = version.platforms[platform];
      
      const downloadPath = await ipcRenderer.invoke('download-app', url, version.version);
      alert(`Aplicación descargada en: ${downloadPath}`);
    } catch (err) {
      setError('Error al descargar la aplicación');
      console.error(err);
    } finally {
      setDownloading(false);
      setProgress(0);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          py: 4
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={3}
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3
            }}
          >
            <Typography variant="h4" component="h1" gutterBottom>
              Ivolution Launcher
            </Typography>

            {error && (
              <Typography color="error" align="center">
                {error}
              </Typography>
            )}

            {version && (
              <Typography variant="h6" gutterBottom>
                Versión disponible: {version.version}
              </Typography>
            )}

            {downloading && (
              <Box sx={{ width: '100%', mb: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{ height: 10, borderRadius: 5 }}
                />
                <Typography align="center" sx={{ mt: 1 }}>
                  {Math.round(progress)}%
                </Typography>
              </Box>
            )}

            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={downloading ? undefined : downloadApp}
              disabled={downloading || !version}
              sx={{ minWidth: 200 }}
            >
              {downloading ? 'Descargando...' : 'Descargar'}
            </Button>

            {!downloading && (
              <Button
                variant="text"
                onClick={checkForUpdates}
                disabled={downloading}
              >
                Verificar actualizaciones
              </Button>
            )}
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default App; 