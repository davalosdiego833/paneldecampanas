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
    
    # RESPALDO DE CONFIGURACIÓN (Evitar pérdida por reset)
    [ -f .env ] && cp .env .env.bak
    
    git fetch origin main
    git reset --hard origin/main
    
    # RESTAURAR CONFIGURACIÓN SI SE PERDIÓ
    [ -f .env.bak ] && mv .env.bak .env
    
    # ASEGURAR HTACCESS EN PUBLIC_HTML (Puente Hostinger)
    mkdir -p ../public_html
    cp -r dist/* ../public_html/
    mkdir -p tmp
    
    # MOVER PUNTO DE ARRANQUE A LA RAÍZ Y LIMPIAR
    cp dist/server/index.js ./index.js
    
    # ELIMINAR CARPETA TEMPORAL QUE BLOQUEA EL MOTOR (public_html)
    rm -rf ../public_html
    
    # REFORZAR HTACCESS EN LA RAÍZ DEL APP (nodejs/)
    printf "PassengerNodejs /opt/alt/alt-nodejs20/root/usr/bin/node\nPassengerAppRoot /home/u211138134/domains/panel.ambrizydavalos.com/nodejs\nPassengerAppType node\nPassengerStartupFile index.js\n\nRewriteEngine On\nRewriteRule ^index\.html$ - [L]\nRewriteCond %%{REQUEST_FILENAME} !-f\nRewriteCond %%{REQUEST_FILENAME} !-d\nRewriteRule . /index.html [L]\n" > .htaccess
    
    # Limpieza de caché y reinicio
    rm -f db/resumen_snapshot.json
    mkdir -p tmp && touch tmp/restart.txt
    
    # VERIFICACIÓN DE INTEGRIDAD
    if grep -q "1.2.8" dist/server/index.js; then
        echo "✅ Código verificado: Versión 1.2.8 detectada."
    else
        echo "⚠️ ADVERTENCIA: No se encontró la marca de versión 1.2.8 en dist/server/index.js"
    fi
    
    echo "✅ Servidor restaurado a ESTÁNDAR HOSTINGER v1.2.8."
EOF

echo "✨ Despliegue completado con éxito!"
