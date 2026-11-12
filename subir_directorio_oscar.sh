#!/bin/bash
# Sube SOLO el directorio de asesores y el snapshot (nombre de Oscar 119223). No toca dist/ ni git.
cd "$(dirname "$0")" || exit 1
P=/home/u211138134/domains/panel.ambrizydavalos.com
S="-o KexAlgorithms=curve25519-sha256,ecdh-sha2-nistp256,diffie-hellman-group14-sha256 -o BatchMode=yes -i $HOME/.ssh/id_rsa_panel -p 65002"
H=u211138134@195.35.10.40
rsync -avz -e "ssh $S" administrador/directorio_asesores.xlsx $H:$P/nodejs/administrador/directorio_asesores.xlsx
for D in nodejs/db public_html/db db; do
  rsync -avz -e "ssh $S" db/resumen_snapshot.json $H:$P/$D/resumen_snapshot.json 2>/dev/null || true
done
ssh $S $H "touch $P/nodejs/administrador/directorio_asesores.xlsx $P/nodejs/db/resumen_snapshot.json $P/db/resumen_snapshot.json $P/public_html/db/resumen_snapshot.json 2>/dev/null; chmod 644 $P/nodejs/administrador/directorio_asesores.xlsx"
echo "✅ Listo: Oscar en el directorio y snapshot publicados"
