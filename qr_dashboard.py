import socket
import qrcode
from PIL import Image

def get_local_ip():
    """Obtiene la direcciu00f3n IP local del dispositivo"""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # No importa si esta direcciu00f3n es alcanzable
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

def generate_qr_code():
    """Genera un cu00f3digo QR para acceder a la aplicaciu00f3n"""
    # Obtener la IP local
    ip = get_local_ip()
    port = 5000
    
    # Crear la URL base (sin ruta)
    base_url = f"http://{ip}:{port}"
    
    print(f"\n{'='*60}")
    print(f"Generando cu00f3digo QR para: {base_url}")
    print(f"{'='*60}\n")
    
    # Generar el cu00f3digo QR para la URL base
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(base_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    img_path = 'qr_app.png'
    img.save(img_path)
    
    print(f"Cu00f3digo QR generado y guardado como {img_path}")
    print("Una vez que accedas a la aplicaciu00f3n, navega manualmente a /dashboard si es necesario")
    print("Asegu00farate de que tu aplicaciu00f3n estu00e9 ejecutu00e1ndose con 'npm run dev'")
    print("Tu celular debe estar conectado a la misma red WiFi que tu computadora")
    
    # Abrir la imagen del cu00f3digo QR
    try:
        img.show()
    except Exception as e:
        print(f"No se pudo abrir la imagen automu00e1ticamente: {e}")
        print(f"Por favor, abre manualmente el archivo {img_path}")

if __name__ == "__main__":
    # Ejecutar la funciu00f3n principal
    generate_qr_code()
    
    # Mantener la ventana abierta
    input("\nPresiona Enter para salir...")