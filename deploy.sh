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
    
    # --- CONSOLIDACIÓN MAESTRA EN PUBLIC_HTML ---
    # public_html es obligatorio para subdominios en Hostinger
    mkdir -p ../public_html
    cp -r dist/* ../public_html/
    cp dist/server/index.js ../public_html/index.js
    [ -d db ] && cp -r db ../public_html/
    [ -f .env ] && cp .env ../public_html/
    
    # CONFIGURACIÓN PASSENGER UNIFICADA
    printf "PassengerNodejs /opt/alt/alt-nodejs20/root/usr/bin/node\nPassengerAppRoot /home/u211138134/domains/panel.ambrizydavalos.com/public_html\nPassengerAppType node\nPassengerStartupFile index.js\n\nRewriteEngine On\n\n# Fallback para rutas de frontend (SPA)\nRewriteRule ^index\.html$ - [L]\nRewriteCond %%{REQUEST_FILENAME} !-f\nRewriteCond %%{REQUEST_FILENAME} !-d\nRewriteRule . /index.html [L]\n" > ../public_html/.htaccess
    
    # Reinicio forzado
    mkdir -p ../public_html/tmp
    touch ../public_html/tmp/restart.txt
    pkill -u $SERVER_USER node || true
    
    # VERIFICACIÓN DE INTEGRIDAD
    if grep -q "1.3.1" ../public_html/index.js; then
        echo "✅ Código verificado: Versión 1.3.1 consolidada."
    else
        echo "⚠️ ADVERTENCIA: No se encontró la marca de versión 1.3.1 en public_html"
    fi
    
    echo "✅ Servidor RECURADO Y CONSOLIDADO v1.3.1 (FULL DATA + UI)."
EOF

echo "✨ Despliegue completado con éxito!"
