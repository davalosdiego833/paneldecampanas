#!/bin/bash
export PATH=$PATH:/usr/local/bin:/opt/homebrew/bin

# Configuración
SERVER_IP="195.35.10.40"
SERVER_USER="u211138134"
SERVER_PORT="65002"
SERVER_PATH="domains/panel.ambrizydavalos.com/nodejs"
SSH_KEY="$HOME/.ssh/id_rsa_panel"

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

SSH_OPTS="-o KexAlgorithms=curve25519-sha256,ecdh-sha2-nistp256,diffie-hellman-group14-sha256 -o BatchMode=yes -i $SSH_KEY -p $SERVER_PORT"

# 3. Despliegue Directo via RSYNC (Evita el Auto-Builder)
echo "🌐 Sincronizando archivos críticos al servidor..."
rsync -avz -e "ssh $SSH_OPTS" dist/ $SERVER_USER@$SERVER_IP:$PARENT_DIR/public_html/dist/
# Respaldo de seguridad en zona blindada para auto-restauración
rsync -avz -e "ssh $SSH_OPTS" dist/ $SERVER_USER@$SERVER_IP:$PARENT_DIR/nodejs/backup_dist/
rsync -avz -e "ssh $SSH_OPTS" assets/ $SERVER_USER@$SERVER_IP:$PARENT_DIR/public_html/assets/ 2>/dev/null || true
rsync -avz -e "ssh $SSH_OPTS" themes/ $SERVER_USER@$SERVER_IP:$PARENT_DIR/public_html/themes/
rsync -avz -e "ssh $SSH_OPTS" package.json $SERVER_USER@$SERVER_IP:$PARENT_DIR/public_html/
rsync -avz -e "ssh $SSH_OPTS" package.json $SERVER_USER@$SERVER_IP:$PARENT_DIR/nodejs/package.json
rsync -avz -e "ssh $SSH_OPTS" package.json $SERVER_USER@$SERVER_IP:$PARENT_DIR/nodejs/backup_package.json
rsync -avz -e "ssh $SSH_OPTS" .htaccess $SERVER_USER@$SERVER_IP:$PARENT_DIR/public_html/
rsync -avz -e "ssh $SSH_OPTS" .htaccess $SERVER_USER@$SERVER_IP:$PARENT_DIR/nodejs/backup_htaccess

# 3.1 Blindaje de Datos (Zona Inmune en folder nodejs)
echo "🛡️ Protegiendo archivos de datos y campañas..."
rsync -avz --exclude "comentarios_polizas.json" --exclude "actividad.json" --exclude "staff_activity.json" -e "ssh $SSH_OPTS" db/ $SERVER_USER@$SERVER_IP:$PARENT_DIR/nodejs/db/
rsync -avz --exclude "comentarios_polizas.json" --exclude "actividad.json" --exclude "staff_activity.json" -e "ssh $SSH_OPTS" db/ $SERVER_USER@$SERVER_IP:$PARENT_DIR/public_html/db/ 2>/dev/null || true
rsync -avz -e "ssh $SSH_OPTS" administrador/ $SERVER_USER@$SERVER_IP:$PARENT_DIR/nodejs/administrador/
rsync -avz -e "ssh $SSH_OPTS" camino_cumbre/ $SERVER_USER@$SERVER_IP:$PARENT_DIR/nodejs/camino_cumbre/
rsync -avz -e "ssh $SSH_OPTS" convenciones/ $SERVER_USER@$SERVER_IP:$PARENT_DIR/nodejs/convenciones/
rsync -avz -e "ssh $SSH_OPTS" graduacion/ $SERVER_USER@$SERVER_IP:$PARENT_DIR/nodejs/graduacion/
rsync -avz -e "ssh $SSH_OPTS" legion_centurion/ $SERVER_USER@$SERVER_IP:$PARENT_DIR/nodejs/legion_centurion/
rsync -avz -e "ssh $SSH_OPTS" mdrt/ $SERVER_USER@$SERVER_IP:$PARENT_DIR/nodejs/mdrt/
rsync -avz -e "ssh $SSH_OPTS" proactivatech/ $SERVER_USER@$SERVER_IP:$PARENT_DIR/nodejs/proactivatech/
rsync -avz -e "ssh $SSH_OPTS" reto_por_ciento/ $SERVER_USER@$SERVER_IP:$PARENT_DIR/nodejs/reto_por_ciento/
rsync -avz -e "ssh $SSH_OPTS" "estatus polizas/" $SERVER_USER@$SERVER_IP:"'$PARENT_DIR/nodejs/estatus polizas/'"

# 4. Subir scripts de generación al servidor
echo "📤 Subiendo scripts de procesamiento..."
rsync -avz -e "ssh $SSH_OPTS" actualizar_snapshot.js $SERVER_USER@$SERVER_IP:$PARENT_DIR/nodejs/
rsync -avz -e "ssh $SSH_OPTS" generar_alertas.js $SERVER_USER@$SERVER_IP:$PARENT_DIR/nodejs/
rsync -avz -e "ssh $SSH_OPTS" scripts/ $SERVER_USER@$SERVER_IP:$PARENT_DIR/nodejs/scripts/


# 5. Configurar Servidor via SSH
ssh $SSH_OPTS $SERVER_USER@$SERVER_IP << EOF
    PARENT_DIR="/home/u211138134/domains/panel.ambrizydavalos.com"
    
    # Preparar ejecución en raíz (public_html)
    # Copiamos todos los archivos del servidor para que los imports relativos funcionen
    cp \$PARENT_DIR/public_html/dist/server/*.js \$PARENT_DIR/public_html/ 2>/dev/null || true
    cp \$PARENT_DIR/public_html/dist/server/*.js \$PARENT_DIR/nodejs/ 2>/dev/null || true
    # Hostinger busca app.js
    cp \$PARENT_DIR/public_html/index.js \$PARENT_DIR/public_html/app.js 2>/dev/null || true
    
    ln -sfn \$PARENT_DIR/nodejs/node_modules \$PARENT_DIR/public_html/node_modules 2>/dev/null || true
    
    # REINICIO DE PASSENGER (Solo touch, sin pkill)
    mkdir -p \$PARENT_DIR/public_html/tmp
    touch \$PARENT_DIR/public_html/tmp/restart.txt
    
    echo "✅ SISTEMA BLINDADO DISTRIBUIDO DESPLEGADO EXITOSAMENTE."
EOF

echo "✨ Despliegue completado con éxito!"

