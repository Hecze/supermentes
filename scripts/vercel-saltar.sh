#!/bin/sh
# «Ignored Build Step» de Vercel (vercel.json → ignoreCommand): sale con 0 para saltar el build y con 1 para hacerlo.
# Vercel construye de a uno: con varios push seguidos a main, los builds esperan en cola. Cuando le toca a uno que ya
# no es el último commit de main, se salta en segundos y la cola llega antes a la versión nueva. Si no se puede
# preguntar a GitHub (el repo es público), se construye igual.
[ "$VERCEL_GIT_COMMIT_REF" = "main" ] && [ -n "$VERCEL_GIT_COMMIT_SHA" ] || exit 1
ultimo=$(GIT_TERMINAL_PROMPT=0 timeout 20 git ls-remote https://github.com/Hecze/supermentes.git refs/heads/main 2>/dev/null | cut -f1)
if [ -n "$ultimo" ] && [ "$ultimo" != "$VERCEL_GIT_COMMIT_SHA" ]; then
  echo "Se salta $VERCEL_GIT_COMMIT_SHA: main ya va en $ultimo y ese es el que se publica."
  exit 0
fi
echo "Es el último commit de main: se construye."
exit 1
