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
    
    # --- RESTORACIÓN NATIVA v1.3.6 ---
    mkdir -p ../public_html/api
    cp -r dist/* ../public_html/
    cp dist/server/index.js ../public_html/app.js
    
    # RE-INYECTAR CONFIGURACIÓN Y DATOS
    [ -f .env ] && cp .env ../public_html/.env
    [ -f .env.bak ] && cp .env.bak ../public_html/.env
    [ -d db ] && cp -r db ../public_html/
    
    # ENLACE DE LIBRERÍAS
    ln -sfn /home/u211138134/domains/panel.ambrizydavalos.com/nodejs/node_modules ../public_html/node_modules
    
    # HTACCESS NATIVO FINAL
    # PassengerBaseURI / es la llave maestra para subdominios en Hostinger
    printf "PassengerNodejs /opt/alt/alt-nodejs20/root/usr/bin/node\nPassengerAppRoot /home/u211138134/domains/panel.ambrizydavalos.com/public_html\nPassengerAppType node\nPassengerStartupFile app.js\nPassengerBaseURI /\n\nRewriteEngine On\n\n# Fallback SPA\nRewriteRule ^index\.html$ - [L]\nRewriteCond %%{REQUEST_FILENAME} !-f\nRewriteCond %%{REQUEST_FILENAME} !-d\nRewriteRule . /index.html [L]\n" > ../public_html/.htaccess
    
    # Reinicio por watchdog de Passenger
    mkdir -p ../public_html/tmp
    touch ../public_html/tmp/restart.txt
    pkill -f "app.js" || true
    pkill -u \$SERVER_USER node || true
    
    # VERIFICACIÓN DE INTEGRIDAD
    if grep -q "1.3.6" ../public_html/app.js; then
        echo "✅ Código verificado: Versión 1.3.6 (Native) consolidada."
    else
        echo "⚠️ ADVERTENCIA: No se encontró la marca de versión 1.3.6."
    fi
    
    echo "✅ Servidor RESTAURADO NATIVAMENTE v1.3.6."
EOF

echo "✨ Despliegue completado con éxito!"
