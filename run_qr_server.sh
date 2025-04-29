#!/bin/bash

# Instalar dependencias si no están instaladas
pip install -r qr_requirements.txt

# Ejecutar el servidor QR
python qr_server.py