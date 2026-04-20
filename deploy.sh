#!/bin/bash
export PATH=$PATH:/usr/local/bin:/opt/homebrew/bin

# Configuración
SERVER_IP="195.35.10.40"
SERVER_USER="u211138134"
SERVER_PORT="65002"
SERVER_PATH="domains/panel.ambrizydavalos.com/nodejs"
SSH_KEY="~/.ssh/id_rsa_panel"

echo "🚀 Iniciando despliegue automático..."

# 1. Compilar proyecto (Frontend y Backend)
echo "🏗️ Compilando proyecto..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error en la compilación. Abortando."
    exit 1
fi

# 2. Subir cambios a GitHub
echo "📦 Subiendo cambios a GitHub..."
git add .
git commit -m "data: Actualización automática de reportes ($(date +'%Y-%m-%d %H:%M'))"
git push origin main

if [ $? -ne 0 ]; then
    echo "❌ Error al subir a GitHub. Abortando."
    exit 1
fi

# 2. Sincronizar servidor Hostinger vía SSH
echo "🌐 Actualizando servidor en vivo (Hostinger)..."
ssh -o BatchMode=yes -i $SSH_KEY -p $SERVER_PORT $SERVER_USER@$SERVER_IP << EOF
    cd $SERVER_PATH
    
    # RESPALDO DE CONFIGURACIÓN
    [ -f .env ] && cp .env .env.bak
    
    git fetch origin main
    git reset --hard origin/main
    
    # RESTAURAR CONFIGURACIÓN
    [ -f .env.bak ] && mv .env.bak .env
    
    # --- THE FORTRESS v1.3.9 (ARQUITECTURA PERSISTENTE) ---
    # Sincronización con el Auto-Build (Zona Segura Exterior)
    PARENT_DIR="/home/u211138134/domains/panel.ambrizydavalos.com"
    mkdir -p ../public_html/api
    cp -r dist/* ../public_html/
    cp dist/server/index.js ../public_html/app.js
    
    # FORZAR PERSISTENCIA (Inyectar en todos lados including secret builds)
    for target in "." "../public_html" "\$PARENT_DIR/public_html/.builds/source/repository"; do
        if [ -d "\$target" ] || [ "\$target" = "." ]; then
            [ -f .env ] && cp .env \$target/.env
            [ -d db ] && cp -r db \$target/
        fi
    done
    
    # ENLACE MAESTRO DE LIBRERÍAS
    ln -sfn \$PARENT_DIR/nodejs/node_modules ../public_html/node_modules
    
    # HTACCESS DE FORTALEZA (FUERA DE PUBLIC_HTML)
    # Este archivo en la carpeta raíz del dominio sobrevive a cualquier limpieza de public_html
    printf "PassengerNodejs /opt/alt/alt-nodejs20/root/usr/bin/node\nPassengerAppRoot \$PARENT_DIR/public_html\nPassengerAppType node\nPassengerStartupFile app.js\nPassengerBaseURI /\n\nRewriteEngine On\n\n# Fallback SPA\nRewriteRule ^index\.html$ - [L]\nRewriteCond %%{REQUEST_FILENAME} !-f\nRewriteCond %%{REQUEST_FILENAME} !-d\nRewriteRule . /index.html [L]\n" > \$PARENT_DIR/.htaccess
    
    # REINICIO TOTAL
    mkdir -p ../public_html/tmp
    touch ../public_html/tmp/restart.txt
    pkill -f "app.js" || true
    pkill -u \$SERVER_USER node || true
    
    echo "✅ SISTEMA BLINDADO v1.3.9 — THE FORTRESS."
EOF

echo "✨ Despliegue completado con éxito!"
