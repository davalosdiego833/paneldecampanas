# Guía de Despliegue para Panel de Campañas

Sigue estos pasos para desplegar la aplicación en tu servidor con Docker.

## 1. Requisitos Previos

Asegúrate de que tu servidor tenga instalados:
- **Docker** y **Docker Compose**
- **Git**

Si estás en Ubuntu/Debian, puedes instalarlos así si no los tienes:
```bash
sudo apt-get update
sudo apt-get install git docker.io docker-compose-v2 -y
```

## 2. Descargar el Código

Clona el repositorio en tu servidor:

```bash
git clone https://github.com/davalosdiego833/paneldecampanas.git
```

Entra a la carpeta del proyecto:
```bash
cd paneldecampanas
```

## 3. Desplegar la Aplicación

Ejecuta el siguiente comando para construir y levantar el contenedor en segundo plano:

```bash
docker compose up -d --build
```

- Este proceso puede tardar unos minutos la primera vez mientras se descargan las imágenes y se construye la aplicación.
- Si todo sale bien, verás que el contenedor `panel_campanas` se ha iniciado.

Puedes verificar que está corriendo con:
```bash
docker ps
```

## 4. Acceder a la Aplicación

La aplicación estará corriendo en el puerto **5005**.

Abre tu navegador y entra a:
```
http://TU-IP-DEL-SERVIDOR:5005
```
*(Reemplaza `TU-IP-DEL-SERVIDOR` con la dirección IP pública de tu servidor).*

## 5. Solución de Problemas

### No puedo acceder a la página
Si el contenedor está corriendo pero no puedes entrar desde el navegador, es probable que el puerto **5005** esté bloqueado por el firewall.

- **Si usas AWS/Azure/GCP**: Ve a la configuración de seguridad de tu instancia y agrega una regla de entrada (Inbound Rule) para permitir tráfico TCP en el puerto `5005` desde `0.0.0.0/0`.
- **Si usas Ubuntu con UFW**:
  ```bash
  sudo ufw allow 5005
  ```

### Actualizar la aplicación
Si haces cambios en el código y quieres actualizarlos en el servidor:

```bash
git pull                   # Descarga los últimos cambios
docker compose up -d --build  # Reconstruye y reinicia el contenedor
```
