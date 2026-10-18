#!/bin/sh
# Envía (o actualiza) la entrega de Hack the Andes con lo que hay en esta carpeta: la descripción de
# proyecto.md y los enlaces de enlaces.env. Se puede correr varias veces hasta el cierre.
#   sh submit/enviar.sh            → muestra lo que se va a enviar
#   sh submit/enviar.sh --enviar   → lo envía
set -e
cd "$(dirname "$0")"
. ./enlaces.env
echo "Descripción: submit/proyecto.md ($(wc -l < proyecto.md) líneas)"
echo "Deployment:  $DEPLOYMENT_URL"
echo "GitHub:      $GITHUB_URL"
echo "Deck:        $PRESENTATION_URL"
[ "$1" = "--enviar" ] || { echo "Revisa y corre con --enviar para mandarlo."; exit 0; }
andes project submit --file proyecto.md --deployment-url "$DEPLOYMENT_URL" --github-url "$GITHUB_URL" --presentation-url "$PRESENTATION_URL"
