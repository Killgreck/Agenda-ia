# Conectando con el Repositorio GitHub

Este documento proporciona instrucciones para conectar este proyecto Replit con tu repositorio GitHub en https://github.com/Killgreck/Agenda-ia.

## Opción 1: Subir a través de la Interfaz Web de GitHub (Más Sencillo)

1. Ve a https://github.com/Killgreck/Agenda-ia
2. Haz clic en "Upload files" (Subir archivos)
3. Descarga el archivo comprimido del proyecto desde aquí: [agenda-ia-project.tar.gz](agenda-ia-project.tar.gz)
4. Descomprime el archivo en tu computadora
5. Arrastra y suelta todos los archivos en el área de carga de GitHub
6. Añade un mensaje de commit como "Actualización desde Replit" y haz clic en "Commit changes"

## Opción 2: Hacer push directamente desde Replit (Requiere token de GitHub)

### 1. Generar un Token de Acceso Personal en GitHub (Classic)

1. Ve a Configuración de GitHub > Configuración de desarrollador > Tokens de acceso personal > Tokens (classic)
2. Haz clic en "Generar nuevo token (classic)"
3. Dale un nombre descriptivo como "Acceso Replit Agenda-IA"
4. Selecciona al menos el alcance "repo"
5. Haz clic en "Generar token"
6. Copia el token inmediatamente (no podrás verlo de nuevo)

### 2. Configurar Git en Replit

Ejecuta estos comandos en la terminal de Replit, reemplazando `TU_USUARIO_GITHUB` y `TU_TOKEN`:

```bash
git merge --abort  # Para abortar cualquier merge pendiente
git config --global credential.helper store
echo "https://TU_USUARIO_GITHUB:TU_TOKEN@github.com" > ~/.git-credentials
chmod 600 ~/.git-credentials
```

### 3. Hay dos formas de manejar la situación:

#### Opción A: Crear una nueva rama y subirla a GitHub

```bash
git checkout -b version-javascript
git add .
git commit -m "Versión JavaScript del proyecto Agenda-IA"
git push origin version-javascript
```

Luego podrás crear un Pull Request en GitHub para fusionar esta rama con la rama principal.

#### Opción B: Sobrescribir la rama principal (Usar con precaución)

Si quieres reemplazar completamente el contenido del repositorio con esta versión:

```bash
git push -f origin main
```

⚠️ Advertencia: Esto eliminará cualquier commit previo en la rama main.

## Manteniendo la Sincronización

Después de configurar la conexión, puedes mantener ambos repositorios sincronizados:

### Para enviar cambios desde Replit a GitHub

```bash
git add .
git commit -m "Tu mensaje de commit"
git push origin main
```

### Para traer cambios desde GitHub a Replit

```bash
git pull origin main
```

## Notas Importantes

- Los archivos `.replit` y `replit.nix` son específicos de Replit y no deben ser modificados o eliminados
- El repositorio de GitHub ya está configurado como remoto en este proyecto Replit
- Si encuentras problemas de autenticación, puede que necesites regenerar tu token de GitHub