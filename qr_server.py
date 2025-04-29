import socket
import qrcode
from PIL import Image
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler
import webbrowser
import threading
import time

def get_local_ip():
    """Obtiene la dirección IP local del dispositivo"""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # No importa si esta dirección es alcanzable
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

def generate_qr_code(url):
    """Genera un código QR para la URL proporcionada"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    img_path = 'qr_code.png'
    img.save(img_path)
    print(f"Código QR generado y guardado como {img_path}")
    
    # Abrir la imagen del código QR
    try:
        img.show()
    except Exception as e:
        print(f"No se pudo abrir la imagen automáticamente: {e}")
        print(f"Por favor, abre manualmente el archivo {img_path}")
    
    return img_path

def run_server(port=5000, path="/dashboard"):
    """Ejecuta un servidor HTTP en el puerto especificado"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, SimpleHTTPRequestHandler)
    
    ip = get_local_ip()
    url = f"http://{ip}:{port}{path}"
    
    print(f"\n{'='*50}")
    print(f"Servidor iniciado en {url}")
    print(f"Escanea el código QR con tu celular para acceder a la aplicación")
    print(f"Presiona Ctrl+C para detener el servidor")
    print(f"{'='*50}\n")
    
    # Generar código QR
    generate_qr_code(url)
    
    # Ejecutar el servidor
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido.")
        httpd.server_close()

if __name__ == "__main__":
    # Verificar si se está ejecutando npm run dev
    dev_running = False
    try:
        # Verificar si el puerto 5000 está en uso
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect(('localhost', 5000))
        s.close()
        dev_running = True
    except:
        pass
    
    if not dev_running:
        print("No se detectó que la aplicación esté en ejecución.")
        print("Primero debes iniciar la aplicación con 'npm run dev' en otra terminal.")
        print("¿Quieres continuar de todos modos? (s/n)")
        response = input().lower()
        if response != 's':
            print("Operación cancelada. Inicia la aplicación primero.")
            exit()
    
    # Ejecutar el servidor
    run_server()