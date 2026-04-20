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
    
    # Iniciar Node en segundo plano si no está corriendo (Puerto 5005)
    if ! ps aux | grep -v grep | grep -q "dist/server/index.js"; then
        nohup /opt/alt/alt-nodejs20/root/usr/bin/node dist/server/index.js > console.log 2>&1 &
        sleep 2
    fi
    
    # .htaccess que PRIORIZA API sobre Estático
    printf "RewriteEngine On\n\n# Prioridad 1: API\nRewriteCond %%{REQUEST_URI} ^/api\nRewriteRule ^(.*)\$ http://127.0.0.1:5005/\$1 [P,L]\n\n# Prioridad 2: Archivos Estáticos\nRewriteRule ^index\.html$ - [L]\nRewriteCond %%{REQUEST_FILENAME} !-f\nRewriteCond %%{REQUEST_FILENAME} !-d\nRewriteRule . /index.html [L]\n" > ../public_html/.htaccess
    
    # Limpieza de caché y reinicio
    rm -f db/resumen_snapshot.json
    touch tmp/restart.txt
    
    # VERIFICACIÓN DE INTEGRIDAD
    if grep -q "1.2.6" dist/server/index.js; then
        echo "✅ Código verificado: Versión 1.2.6 detectada."
    else
        echo "⚠️ ADVERTENCIA: No se encontró la marca de versión 1.2.6 en dist/server/index.js"
    fi
    
    echo "✅ Servidor actualizado, reiniciado y blindaje de configuración activo."
EOF

echo "✨ Despliegue completado con éxito!"
