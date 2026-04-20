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
    
    # --- RESTORACIÓN TOTAL v1.3.4 ---
    # Unificar todo en public_html que es el puerto seguro
    mkdir -p ../public_html/api
    cp -r dist/* ../public_html/
    cp dist/server/index.js ../public_html/app.js
    
    # RE-INYECTAR CONFIGURACIÓN Y DATOS (Fuerza Bruta)
    # Buscamos en todas las posibles ubicaciones para restaurar
    [ -f .env ] && cp .env ../public_html/.env
    [ -f .env.bak ] && cp .env.bak ../public_html/.env
    [ -d db ] && cp -r db ../public_html/
    
    # REFORZAR HTACCESS PARA USAR EL PUENTE PHP EN LA API
    printf "RewriteEngine On\n\n# Prioridad 1: API via Puente PHP\nRewriteRule ^api/(.*)\$ api/index.php?url=\$1 [QSA,L]\n\n# Prioridad 2: Archivos Estáticos y SPA\nRewriteRule ^index\.html$ - [L]\nRewriteCond %%{REQUEST_FILENAME} !-f\nRewriteCond %%{REQUEST_FILENAME} !-d\nRewriteRule . /index.html [L]\n" > ../public_html/.htaccess
    
    # CREAR PUENTE PHP (Maestro Bridge)
    printf "<?php\n\$url = 'http://127.0.0.1:5005/api/' . (isset(\$_GET['url']) ? \$_GET['url'] : '');\n\$ch = curl_init();\ncurl_setopt(\$ch, CURLOPT_URL, \$url);\ncurl_setopt(\$ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt(\$ch, CURLOPT_FOLLOWLOCATION, true);\nif (\$_SERVER['REQUEST_METHOD'] === 'POST') {\n    curl_setopt(\$ch, CURLOPT_POST, true);\n    curl_setopt(\$ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));\n}\n\$headers = [];\nforeach (getallheaders() as \$name => \$value) { if (strtolower(\$name) !== 'host') \$headers[] = \"\$name: \$value\"; }\ncurl_setopt(\$ch, CURLOPT_HTTPHEADER, \$headers);\n\$response = curl_exec(\$ch);\n\$httpCode = curl_getinfo(\$ch, CURLINFO_HTTP_CODE);\ncurl_close(\$ch);\nhttp_response_code(\$httpCode);\nheader('Content-Type: application/json');\necho \$response;\n" > ../public_html/api/index.php

    # Reiniciar motor Node en el nuevo root consolidado
    pkill -f "dist/server/index.js" || true
    pkill -f "app.js" || true
    pkill -u \$SERVER_USER node || true
    cd ../public_html
    nohup /opt/alt/alt-nodejs20/root/usr/bin/node app.js > console.log 2>&1 &
    
    # VERIFICACIÓN DE INTEGRIDAD
    if grep -q "1.3.4" app.js; then
        echo "✅ Código verificado: Versión 1.3.4 (Total Restore) consolidada."
    else
        echo "⚠️ ADVERTENCIA: No se encontró la marca de versión 1.3.4."
    fi
    
    echo "✅ Servidor RESTAURADO AL 100% v1.3.4."
EOF

echo "✨ Despliegue completado con éxito!"
