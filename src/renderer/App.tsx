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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { ipcRenderer } from 'electron';

interface Version {
  version: string;
  release_date: string;
  requirements: {
    minimal: {
      ram: string;
      cpu: string;
      gpu: string;
    };
    recommended: {
      ram: string;
      cpu: string;
      gpu: string;
    };
  };
  features: string[];
  downloadUrl: string;
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
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVersions();
    
    ipcRenderer.on('download-progress', (_, progress: number) => {
      setProgress(progress);
    });

    return () => {
      ipcRenderer.removeAllListeners('download-progress');
    };
  }, []);

  const loadVersions = async () => {
    try {
      setError(null);
      const data = await ipcRenderer.invoke('get-versions');
      setVersions(data);
      // Seleccionar la última versión por defecto
      if (data.length > 0) {
        setSelectedVersion(data[0]);
      }
    } catch (err) {
      setError('Error al cargar las versiones disponibles');
      console.error(err);
    }
  };

  const downloadApp = async () => {
    if (!selectedVersion) return;

    try {
      setDownloading(true);
      setError(null);
      
      const downloadPath = await ipcRenderer.invoke('download-app', selectedVersion.downloadUrl, selectedVersion.version);
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
        <Container maxWidth="md">
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

            <FormControl fullWidth>
              <InputLabel>Seleccionar Versión</InputLabel>
              <Select
                value={selectedVersion?.version || ''}
                onChange={(e) => {
                  const version = versions.find(v => v.version === e.target.value);
                  setSelectedVersion(version || null);
                }}
                disabled={downloading}
              >
                {versions.map((version) => (
                  <MenuItem key={version.version} value={version.version}>
                    Versión {version.version} ({new Date(version.release_date).toLocaleDateString()})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedVersion && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Requisitos Mínimos
                      </Typography>
                      <Typography>RAM: {selectedVersion.requirements.minimal.ram}</Typography>
                      <Typography>CPU: {selectedVersion.requirements.minimal.cpu}</Typography>
                      <Typography>GPU: {selectedVersion.requirements.minimal.gpu}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Requisitos Recomendados
                      </Typography>
                      <Typography>RAM: {selectedVersion.requirements.recommended.ram}</Typography>
                      <Typography>CPU: {selectedVersion.requirements.recommended.cpu}</Typography>
                      <Typography>GPU: {selectedVersion.requirements.recommended.gpu}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Características
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {selectedVersion.features.map((feature, index) => (
                          <Chip key={index} label={feature} color="primary" />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
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
              disabled={downloading || !selectedVersion}
              sx={{ minWidth: 200 }}
            >
              {downloading ? 'Descargando...' : 'Descargar'}
            </Button>

            {!downloading && (
              <Button
                variant="text"
                onClick={loadVersions}
                disabled={downloading}
              >
                Actualizar lista de versiones
              </Button>
            )}
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default App; 