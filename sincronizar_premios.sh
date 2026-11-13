#!/bin/bash
# Sube SOLO la carpeta premios/ (datos ya descargados por descargar_premios.js)
# al servidor real, sin recompilar ni tocar el resto del sitio.
# Uso: ./sincronizar_premios.sh
#
# Estricto (2026-11-12): antes decía "✅ actualizados" aunque rsync fallara
# (el servidor cerró la sesión SSH y el ✅ salió igual). Ahora:
#   1. reintenta la subida hasta 3 veces si rsync falla,
#   2. si no logra subir, sale con código 1 (el orquestador NO avisa éxito),
#   3. al terminar descarga el data.json de cada clave DEL SITIO y lo compara
#      byte a byte con el local; solo dice ✅ si TODAS coinciden (si no, sale con código 2).
# Códigos: 0 ok y verificado, 1 no se pudo subir, 2 subió pero el sitio no coincide.

export PATH=$PATH:/usr/local/bin:/opt/homebrew/bin

cd "$(dirname "$0")" || exit 1

SERVER_IP="195.35.10.40"
SERVER_USER="u211138134"
SERVER_PORT="65002"
SSH_KEY="$HOME/.ssh/id_rsa_panel"
PARENT_DIR="/home/u211138134/domains/panel.ambrizydavalos.com"
SITIO="https://panel.ambrizydavalos.com"
SSH_OPTS="-o KexAlgorithms=curve25519-sha256,ecdh-sha2-nistp256,diffie-hellman-group14-sha256 -o BatchMode=yes -o ConnectTimeout=20 -i $SSH_KEY -p $SERVER_PORT"
INTENTOS=3
ESPERA=20

echo "📤 Subiendo premios/ al servidor real..."

subido=0
for i in $(seq 1 $INTENTOS); do
    # --delete: el servidor debe reflejar EXACTAMENTE lo que hay en local (así, si
    # se borra algo aquí -p. ej. capturas de debug viejas- también desaparece allá).
    if rsync -avz --delete -e "ssh $SSH_OPTS" premios/ $SERVER_USER@$SERVER_IP:$PARENT_DIR/nodejs/premios/; then
        subido=1
        break
    fi
    if [ "$i" -lt "$INTENTOS" ]; then
        echo "⚠️  Falló la subida (intento $i de $INTENTOS). Reintentando en ${ESPERA}s..."
        sleep $ESPERA
    fi
done

if [ "$subido" -ne 1 ]; then
    echo ""
    echo "❌ NO SE PUDO SUBIR premios/ al servidor después de $INTENTOS intentos."
    echo "   El sitio sigue con los datos anteriores. Causa probable: el servidor cierra la sesión SSH"
    echo "   (bloqueo temporal de IP o límite del hosting). Revisa Hostinger o reintenta en unos minutos:"
    echo "   ./sincronizar_premios.sh"
    exit 1
fi

# Copia secundaria (public_html): si falla no es crítico, el sitio lee de nodejs/premios.
rsync -avz --delete -e "ssh $SSH_OPTS" premios/ $SERVER_USER@$SERVER_IP:$PARENT_DIR/public_html/premios/ >/dev/null 2>&1 || true

# --- Verificación: lo que sirve el sitio debe ser IDÉNTICO a lo local ---
echo ""
echo "🔎 Verificando contra el sitio real..."
TMP=$(mktemp)
total=0
fallos=0
for dir in premios/*/; do
    clave=$(basename "$dir")
    [ -f "premios/$clave/data.json" ] || continue
    total=$((total + 1))
    if curl -s --max-time 30 -o "$TMP" "$SITIO/premios/$clave/data.json?v=$(date +%s)" \
        && cmp -s "$TMP" "premios/$clave/data.json"; then
        :
    else
        echo "   ❌ $clave: el sitio NO tiene la misma captura que el local"
        fallos=$((fallos + 1))
    fi
done
rm -f "$TMP"

if [ "$fallos" -gt 0 ]; then
    echo ""
    echo "❌ La subida terminó pero $fallos de $total reportes NO coinciden con el sitio."
    exit 2
fi

echo "✅ Reportes de Premios actualizados en la página real y verificados ($total de $total coinciden con el sitio)."
exit 0
