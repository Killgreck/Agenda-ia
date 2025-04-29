@echo off
echo Generando codigo QR para acceder al dashboard desde tu celular...

REM Instalar dependencias necesarias
pip install qrcode pillow

REM Ejecutar el script de Python
python qr_dashboard.py

pause