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
npm run compile

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
    PARENT_DIR="/home/u211138134/domains/panel.ambrizydavalos.com"
    
    # ESPERAR A QUE HOSTINGER TERMINE DE DESTRUIR TODO (Webhook AutoDeploy)
    echo "⏳ Esperando 25s a que el Auto-mantenimiento de Hostinger termine..."
    sleep 25
    
    # --- RESTAURACIÓN DE LA FORTALEZA ---
    cd $SERVER_PATH
    
    git fetch origin main
    git reset --hard origin/main
    
    PARENT_DIR="/home/u211138134/domains/panel.ambrizydavalos.com"
    
    # 1. Limpiar el desastre del Auto Deploy
    rm -rf ../public_html/* || true
    
    # 2. Restaurar archivos desde nuestro clon puro
    mkdir -p ../public_html/api
    cp -r dist/* ../public_html/
    cp dist/server/index.js ../public_html/app.js
    
    # 3. Enlaces Maestros y .htaccess
    ln -sfn \$PARENT_DIR/nodejs/node_modules ../public_html/node_modules
    cp .htaccess ../public_html/.htaccess
    
    # 4. REINICIO DE PASSENGER (Para que tome los nuevos cambios)
    mkdir -p ../public_html/tmp
    touch ../public_html/tmp/restart.txt
    pkill -u \$SERVER_USER node || true
    pkill -f "app.js" || true
    
    echo "✅ SISTEMA BLINDADO DISTRIBUIDO Y RESTAURADO LUEGO DEL AUTO-BUILD."
EOF

echo "✨ Despliegue completado con éxito!"
