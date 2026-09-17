#!/bin/bash
# Deploy scoped a la nueva campaña "El Poder de Elegirte":
# - dist/ (frontend + backend compilados) e index.html (código nuevo del dashboard)
# - poder_elegirte/ (datos crudos)
# - actualizar_snapshot.js (parser actualizado)
# - db/resumen_snapshot.json (snapshot con los datos ya procesados)
# Sin tocar git (add/commit/push) ni el resto del deploy.sh.
set -e
cd "/Users/diego/Desktop/panel de campañas"

SERVER_IP="195.35.10.40"
SERVER_USER="u211138134"
SERVER_PORT="65002"
SSH_KEY="$HOME/.ssh/id_rsa_panel"
PARENT_DIR="/home/u211138134/domains/panel.ambrizydavalos.com"
SSH_OPTS="-o KexAlgorithms=curve25519-sha256,ecdh-sha2-nistp256,diffie-hellman-group14-sha256 -o BatchMode=yes -i $SSH_KEY -p $SERVER_PORT"

echo "📤 Sincronizando dist/ (frontend compilado)..."
rsync -avz -e "ssh $SSH_OPTS" dist/ $SERVER_USER@$SERVER_IP:"$PARENT_DIR/public_html/dist/"
rsync -avz -e "ssh $SSH_OPTS" dist/ $SERVER_USER@$SERVER_IP:"$PARENT_DIR/nodejs/dist/"
rsync -avz -e "ssh $SSH_OPTS" dist/ $SERVER_USER@$SERVER_IP:"$PARENT_DIR/nodejs/backup_dist/"

echo "📤 Sincronizando index.html..."
rsync -avz -e "ssh $SSH_OPTS" index.html $SERVER_USER@$SERVER_IP:"$PARENT_DIR/public_html/index.html"
rsync -avz -e "ssh $SSH_OPTS" index.html $SERVER_USER@$SERVER_IP:"$PARENT_DIR/nodejs/index.html"

echo "📤 Sincronizando carpeta de datos: poder_elegirte"
rsync -avz -e "ssh $SSH_OPTS" poder_elegirte/ $SERVER_USER@$SERVER_IP:"$PARENT_DIR/nodejs/poder_elegirte/"

echo "📤 Sincronizando actualizar_snapshot.js"
rsync -avz -e "ssh $SSH_OPTS" actualizar_snapshot.js $SERVER_USER@$SERVER_IP:"$PARENT_DIR/nodejs/"

echo "📤 Sincronizando snapshot db/resumen_snapshot.json"
rsync -avz -e "ssh $SSH_OPTS" db/resumen_snapshot.json $SERVER_USER@$SERVER_IP:"$PARENT_DIR/nodejs/db/resumen_snapshot.json"
rsync -avz -e "ssh $SSH_OPTS" db/resumen_snapshot.json $SERVER_USER@$SERVER_IP:"$PARENT_DIR/public_html/db/resumen_snapshot.json" 2>/dev/null || true
rsync -avz -e "ssh $SSH_OPTS" db/resumen_snapshot.json $SERVER_USER@$SERVER_IP:"$PARENT_DIR/db/resumen_snapshot.json" 2>/dev/null || true

echo "🌐 Publicando assets del build en public_html/assets..."
ssh $SSH_OPTS $SERVER_USER@$SERVER_IP "
mkdir -p '$PARENT_DIR/public_html/assets'
cp -r '$PARENT_DIR/nodejs/dist/assets/'* '$PARENT_DIR/public_html/assets/' 2>/dev/null || true
mkdir -p '$PARENT_DIR/public_html/tmp'
touch '$PARENT_DIR/public_html/tmp/restart.txt'
touch '$PARENT_DIR/nodejs/db/resumen_snapshot.json' '$PARENT_DIR/db/resumen_snapshot.json' '$PARENT_DIR/public_html/db/resumen_snapshot.json' 2>/dev/null || true
echo '✅ Listo en servidor.'
"

echo "✅ Deploy de 'El Poder de Elegirte' completado."
