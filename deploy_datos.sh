#!/bin/bash
# Sube UNICAMENTE carpetas de datos (una o varias) + el snapshot de db al
# servidor, sin tocar dist/, sin git add/commit/push, sin npm run compile.
# Uso: bash deploy_datos.sh "carpeta1" "carpeta2" ...
set -e
cd "$(dirname "$0")"

if [ "$#" -eq 0 ]; then
  echo "Uso: bash deploy_datos.sh <carpeta1> [carpeta2] ..."
  exit 1
fi

SERVER_IP="195.35.10.40"
SERVER_USER="u211138134"
SERVER_PORT="65002"
SSH_KEY="$HOME/.ssh/id_rsa_panel"
PARENT_DIR="/home/u211138134/domains/panel.ambrizydavalos.com"
SSH_OPTS="-o KexAlgorithms=curve25519-sha256,ecdh-sha2-nistp256,diffie-hellman-group14-sha256 -o BatchMode=yes -i $SSH_KEY -p $SERVER_PORT"

for FOLDER in "$@"; do
  echo "📤 Sincronizando carpeta de datos: $FOLDER"
  # IMPORTANTE: los nombres de carpeta NO deben llevar espacios. El rsync de macOS
  # (2.6.9) no soporta --protect-args, y con espacios crea mal la carpeta remota
  # (la corta en el primer espacio) sin importar cómo se escape. Si una carpeta
  # nueva necesita espacios, usa guion_bajo en su lugar.
  ssh $SSH_OPTS $SERVER_USER@$SERVER_IP "mkdir -p '$PARENT_DIR/nodejs/$FOLDER'"
  rsync -avz -e "ssh $SSH_OPTS" "$FOLDER/" "$SERVER_USER@$SERVER_IP:$PARENT_DIR/nodejs/$FOLDER/"
done

echo "📤 Sincronizando snapshot db/resumen_snapshot.json"
rsync -avz -e "ssh $SSH_OPTS" db/resumen_snapshot.json $SERVER_USER@$SERVER_IP:"$PARENT_DIR/nodejs/db/resumen_snapshot.json"
rsync -avz -e "ssh $SSH_OPTS" db/resumen_snapshot.json $SERVER_USER@$SERVER_IP:"$PARENT_DIR/public_html/db/resumen_snapshot.json" 2>/dev/null || true
rsync -avz -e "ssh $SSH_OPTS" db/resumen_snapshot.json $SERVER_USER@$SERVER_IP:"$PARENT_DIR/db/resumen_snapshot.json" 2>/dev/null || true

ssh $SSH_OPTS $SERVER_USER@$SERVER_IP "touch '$PARENT_DIR/nodejs/db/resumen_snapshot.json' '$PARENT_DIR/db/resumen_snapshot.json' '$PARENT_DIR/public_html/db/resumen_snapshot.json' 2>/dev/null || true"

echo "✅ Datos sincronizados al servidor: $*"
