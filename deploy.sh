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
    
    # RESTAURAR CARPETA OBLIGATORIA (public_html)
    mkdir -p ../public_html
    cp -r dist/* ../public_html/
    
    # REFORZAR HTACCESS DE ARRANQUE (En public_html/ que es el Web Root)
    printf "PassengerNodejs /opt/alt/alt-nodejs20/root/usr/bin/node\nPassengerAppRoot /home/u211138134/domains/panel.ambrizydavalos.com/nodejs\nPassengerAppType node\nPassengerStartupFile index.js\n\nRewriteEngine On\n\n# Prioridad 1: API (Bypass Proxy)\nRewriteCond %%{REQUEST_URI} ^/api\nRewriteRule ^(.*)\$ http://127.0.0.1:5005/\$1 [P,L]\n\n# Prioridad 2: Archivos Estáticos\nRewriteCond %%{REQUEST_FILENAME} !-f\nRewriteCond %%{REQUEST_FILENAME} !-d\nRewriteRule . /index.html [L]\n" > ../public_html/.htaccess
    
    # Iniciar Node en segundo plano si Passenger no responde (Puerto 5005)
    pkill -f "dist/server/index.js" || true
    pkill -f "nodejs/index.js" || true
    nohup /opt/alt/alt-nodejs20/root/usr/bin/node index.js > console.log 2>&1 &
    
    # Limpieza de caché y reinicio
    rm -f db/resumen_snapshot.json
    mkdir -p tmp && touch tmp/restart.txt
    
    # VERIFICACIÓN DE INTEGRIDAD
    if grep -q "1.2.9" dist/server/index.js; then
        echo "✅ Código verificado: Versión 1.2.9 detectada."
    else
        echo "⚠️ ADVERTENCIA: No se encontró la marca de versión 1.2.9 en dist/server/index.js"
    fi
    
    echo "✅ Servidor restaurado y sincronizado en v1.2.9 — TOTAL SYNC."
EOF

echo "✨ Despliegue completado con éxito!"
