@echo off

REM Instalar dependencias si no estan instaladas
pip install -r qr_requirements.txt

REM Ejecutar el servidor QR
python qr_server.py

pause