# Ivolution Launcher

Un launcher moderno para la aplicación Ivolution que permite descargar y actualizar automáticamente las últimas versiones tanto para Windows como para Mac.

## Características

- Interfaz gráfica moderna y amigable
- Detección automática del sistema operativo
- Descarga automática de la última versión
- Barra de progreso durante la descarga
- Tema oscuro por defecto
- Manejo de errores robusto

## Requisitos

- Python 3.8 o superior
- Dependencias listadas en `requirements.txt`

## Instalación

1. Clona este repositorio:
```bash
git clone https://github.com/tu-usuario/ivolution-launcher.git
cd ivolution-launcher
```

2. Instala las dependencias:
```bash
pip install -r requirements.txt
```

## Uso

1. Ejecuta el launcher:
```bash
python ivolution_launcher.py
```

2. El launcher verificará automáticamente la última versión disponible.
3. Haz clic en "Verificar actualizaciones" para descargar la última versión.
4. La aplicación se descargará en la carpeta "Ivolution" en tu directorio de usuario.

## Estructura del Proyecto

```
ivolution-launcher/
├── .github/
│   └── workflows/
│       └── gcp-upload.yml    # Workflow para subir versiones a GCP
├── releases/
│   ├── windows/             # Versiones para Windows
│   └── mac/                 # Versiones para Mac
├── ivolution_launcher.py    # Código principal del launcher
├── requirements.txt         # Dependencias del proyecto
└── README.md               # Este archivo
```

## Desarrollo

Para subir una nueva versión:

1. Coloca los archivos ejecutables en las carpetas correspondientes:
   - `releases/windows/ivolution.exe` para Windows
   - `releases/mac/ivolution.app` para Mac

2. Ejecuta el workflow de GitHub Actions manualmente o haz push a la rama main.

3. El workflow subirá los archivos a Google Cloud Storage y actualizará el archivo de metadata.

## Configuración de GCP

Asegúrate de tener configuradas las siguientes variables secretas en GitHub:

- `GCP_SA_KEY`: La llave de cuenta de servicio de Google Cloud Platform
- `GCP_BUCKET_NAME`: El nombre del bucket donde se almacenarán las versiones 