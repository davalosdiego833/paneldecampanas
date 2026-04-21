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

# 2. Subir cambios a GitHub (A una rama de backup para no disparar el Auto-Deploy de Hostinger en 'main')
echo "📦 Subiendo cambios a GitHub (rama data-backup)..."
git add .
git commit -m "data: Actualización automática de reportes ($(date +'%Y-%m-%d %H:%M'))" || true
git push origin HEAD:data-backup -f

if [ $? -ne 0 ]; then
    echo "❌ Error al subir a GitHub. Abortando."
    exit 1
fi

PARENT_DIR="/home/u211138134/domains/panel.ambrizydavalos.com"

# 3. Despliegue Directo via RSYNC (Evita el Auto-Builder)
echo "🌐 Sincronizando archivos críticos al servidor..."
rsync -avz -e "ssh -o BatchMode=yes -i $SSH_KEY -p $SERVER_PORT" dist/ $SERVER_USER@$SERVER_IP:$PARENT_DIR/public_html/dist/
rsync -avz -e "ssh -o BatchMode=yes -i $SSH_KEY -p $SERVER_PORT" package.json $SERVER_USER@$SERVER_IP:$PARENT_DIR/public_html/
rsync -avz -e "ssh -o BatchMode=yes -i $SSH_KEY -p $SERVER_PORT" .htaccess $SERVER_USER@$SERVER_IP:$PARENT_DIR/public_html/

# 4. Configurar Servidor via SSH
ssh -o BatchMode=yes -i $SSH_KEY -p $SERVER_PORT $SERVER_USER@$SERVER_IP << EOF
    PARENT_DIR="/home/u211138134/domains/panel.ambrizydavalos.com"
    
    # Asegurar enlaces y app.js
    cp \$PARENT_DIR/public_html/dist/server/index.js \$PARENT_DIR/public_html/app.js
    ln -sfn \$PARENT_DIR/nodejs/node_modules \$PARENT_DIR/public_html/node_modules
    
    # REINICIO DE PASSENGER
    mkdir -p \$PARENT_DIR/public_html/tmp
    touch \$PARENT_DIR/public_html/tmp/restart.txt
    pkill -u \$SERVER_USER node || true
    pkill -f "app.js" || true
    
    echo "✅ SISTEMA BLINDADO DISTRIBUIDO DESPLEGADO EXITOSAMENTE."
EOF

echo "✨ Despliegue completado con éxito!"
