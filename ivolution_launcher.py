import sys
import os
import json
import platform
import requests
from PyQt6.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout, 
                            QPushButton, QLabel, QProgressBar, QMessageBox)
from PyQt6.QtCore import Qt, QThread, pyqtSignal
from PyQt6.QtGui import QFont, QPalette, QColor

class DownloadThread(QThread):
    progress = pyqtSignal(int)
    finished = pyqtSignal(str)
    error = pyqtSignal(str)

    def __init__(self, url, save_path):
        super().__init__()
        self.url = url
        self.save_path = save_path

    def run(self):
        try:
            response = requests.get(self.url, stream=True)
            response.raise_for_status()
            
            total_size = int(response.headers.get('content-length', 0))
            block_size = 1024
            downloaded = 0

            os.makedirs(os.path.dirname(self.save_path), exist_ok=True)
            
            with open(self.save_path, 'wb') as f:
                for data in response.iter_content(block_size):
                    downloaded += len(data)
                    f.write(data)
                    if total_size:
                        progress = int((downloaded / total_size) * 100)
                        self.progress.emit(progress)

            self.finished.emit(self.save_path)
        except Exception as e:
            self.error.emit(str(e))

class IvolutionLauncher(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Ivolution Launcher")
        self.setMinimumSize(500, 300)
        self.setup_ui()
        
    def setup_ui(self):
        # Configurar el widget central y el layout
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        layout = QVBoxLayout(central_widget)
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        
        # Título
        title = QLabel("Ivolution Launcher")
        title.setFont(QFont("Arial", 20, QFont.Weight.Bold))
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(title)
        
        # Versión actual
        self.version_label = QLabel("Buscando última versión...")
        self.version_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(self.version_label)
        
        # Barra de progreso
        self.progress_bar = QProgressBar()
        self.progress_bar.setVisible(False)
        layout.addWidget(self.progress_bar)
        
        # Botón de descarga/actualización
        self.download_button = QPushButton("Verificar actualizaciones")
        self.download_button.setMinimumHeight(50)
        self.download_button.clicked.connect(self.check_for_updates)
        layout.addWidget(self.download_button)
        
        # Estilo
        self.setStyleSheet("""
            QMainWindow {
                background-color: #f0f0f0;
            }
            QPushButton {
                background-color: #4CAF50;
                color: white;
                border: none;
                border-radius: 5px;
                padding: 10px;
                font-size: 14px;
            }
            QPushButton:hover {
                background-color: #45a049;
            }
            QLabel {
                color: #333;
                margin: 10px;
            }
            QProgressBar {
                border: 2px solid #4CAF50;
                border-radius: 5px;
                text-align: center;
            }
            QProgressBar::chunk {
                background-color: #4CAF50;
            }
        """)
        
        # Verificar actualizaciones al inicio
        self.check_for_updates()
    
    def check_for_updates(self):
        try:
            # En un caso real, esto vendría de tu bucket de GCP
            metadata_url = "https://storage.googleapis.com/TU_BUCKET/latest-metadata.json"
            response = requests.get(metadata_url)
            metadata = response.json()
            
            current_platform = "windows" if platform.system().lower() == "windows" else "mac"
            download_url = metadata["platforms"][current_platform]
            
            self.version_label.setText(f"Última versión: {metadata['version']}")
            
            # Iniciar descarga
            save_path = os.path.join(
                os.path.expanduser("~"),
                "Ivolution",
                f"ivolution_v{metadata['version']}.{'exe' if current_platform == 'windows' else 'app'}"
            )
            
            self.download_thread = DownloadThread(download_url, save_path)
            self.download_thread.progress.connect(self.update_progress)
            self.download_thread.finished.connect(self.download_finished)
            self.download_thread.error.connect(self.show_error)
            
            self.progress_bar.setVisible(True)
            self.download_button.setEnabled(False)
            self.download_thread.start()
            
        except Exception as e:
            self.show_error(str(e))
    
    def update_progress(self, value):
        self.progress_bar.setValue(value)
    
    def download_finished(self, save_path):
        self.progress_bar.setVisible(False)
        self.download_button.setEnabled(True)
        QMessageBox.information(
            self,
            "Descarga Completada",
            f"Ivolution ha sido descargado en:\n{save_path}"
        )
    
    def show_error(self, error_message):
        self.progress_bar.setVisible(False)
        self.download_button.setEnabled(True)
        QMessageBox.critical(
            self,
            "Error",
            f"Error al descargar: {error_message}"
        )

if __name__ == "__main__":
    app = QApplication(sys.argv)
    
    # Configurar el tema oscuro de la aplicación
    app.setStyle("Fusion")
    palette = QPalette()
    palette.setColor(QPalette.ColorRole.Window, QColor(53, 53, 53))
    palette.setColor(QPalette.ColorRole.WindowText, Qt.GlobalColor.white)
    palette.setColor(QPalette.ColorRole.Base, QColor(25, 25, 25))
    palette.setColor(QPalette.ColorRole.AlternateBase, QColor(53, 53, 53))
    palette.setColor(QPalette.ColorRole.ToolTipBase, Qt.GlobalColor.white)
    palette.setColor(QPalette.ColorRole.ToolTipText, Qt.GlobalColor.white)
    palette.setColor(QPalette.ColorRole.Text, Qt.GlobalColor.white)
    palette.setColor(QPalette.ColorRole.Button, QColor(53, 53, 53))
    palette.setColor(QPalette.ColorRole.ButtonText, Qt.GlobalColor.white)
    palette.setColor(QPalette.ColorRole.BrightText, Qt.GlobalColor.red)
    palette.setColor(QPalette.ColorRole.Link, QColor(42, 130, 218))
    palette.setColor(QPalette.ColorRole.Highlight, QColor(42, 130, 218))
    palette.setColor(QPalette.ColorRole.HighlightedText, Qt.GlobalColor.black)
    app.setPalette(palette)
    
    window = IvolutionLauncher()
    window.show()
    sys.exit(app.exec()) 