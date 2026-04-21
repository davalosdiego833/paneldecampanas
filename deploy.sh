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
    
    # ESPERAR A QUE HOSTINGER AUTO-COMPILE - Le damos unos segundos
    sleep 3
    
    # REINICIO DE PASSENGER Y ENLACES (Para que tome los nuevos cambios)
    mkdir -p \$PARENT_DIR/public_html/tmp
    touch \$PARENT_DIR/public_html/tmp/restart.txt
    pkill -u \$SERVER_USER node || true
    
    echo "✅ SISTEMA BLINDADO DISTRIBUIDO."
EOF

echo "✨ Despliegue completado con éxito!"
