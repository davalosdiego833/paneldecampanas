#!/bin/bash

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
    git fetch origin main
    git reset --hard origin/main
    # Hostinger Node.js suele reiniciar al detectar cambios en archivos clave
    # Forzar eliminación de snapshot para recarga de datos
    rm -f db/resumen_snapshot.json
    
    # DISPARADOR DE REINICIO (Phusion Passenger / Hostinger)
    mkdir -p tmp
    touch tmp/restart.txt
    
    # VERIFICACIÓN DE INTEGRIDAD
    if grep -q "1.1.0_fix_comparativo_final" dist/server/index.js; then
        echo "✅ Código verificado: Versión 1.1.0_fix_comparativo_final detectada."
    else
        echo "⚠️ ADVERTENCIA: No se encontró la marca de versión en dist/server/index.js"
    fi
    
    echo "✅ Servidor actualizado, reiniciado y caché de datos limpia."
EOF

echo "✨ Despliegue completado con éxito!"
