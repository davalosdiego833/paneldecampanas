#!/bin/bash
# Sube SOLO la carpeta premios/ (datos ya descargados por descargar_premios.js)
# al servidor real, sin recompilar ni tocar el resto del sitio.
# Uso: ./sincronizar_premios.sh

export PATH=$PATH:/usr/local/bin:/opt/homebrew/bin

SERVER_IP="195.35.10.40"
SERVER_USER="u211138134"
SERVER_PORT="65002"
SSH_KEY="$HOME/.ssh/id_rsa_panel"
PARENT_DIR="/home/u211138134/domains/panel.ambrizydavalos.com"
SSH_OPTS="-o KexAlgorithms=curve25519-sha256,ecdh-sha2-nistp256,diffie-hellman-group14-sha256 -o BatchMode=yes -i $SSH_KEY -p $SERVER_PORT"

echo "📤 Subiendo premios/ al servidor real..."
rsync -avz -e "ssh $SSH_OPTS" premios/ $SERVER_USER@$SERVER_IP:$PARENT_DIR/nodejs/premios/
rsync -avz -e "ssh $SSH_OPTS" premios/ $SERVER_USER@$SERVER_IP:$PARENT_DIR/public_html/premios/ 2>/dev/null || true
echo "✅ Reportes de Premios actualizados en la página real."
