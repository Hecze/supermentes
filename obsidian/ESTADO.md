---
actualizado: 2026-10-17
---

# Estado — Supermentes

> Única fuente de verdad de "dónde quedamos". Se reemplaza, no se acumula (≤ 60 líneas).

## En qué estamos
Herramientas de IA para docentes del Perú (Hack the Andes 2026, repo `Hecze/supermentes`, rama `main`). Monorepo Turborepo: el sitio en `apps/web`, funciones de Vercel en `api/` y `middleware.ts` en la raíz, notas en `obsidian/`.

- **En producción:** https://supermentes.vercel.app (proyecto de Vercel `supermentes`, cuenta de Hecze).
- **Landing en `/`** con lista de espera real: `api/lista-espera.ts` guarda cada registro como archivo privado en Vercel Blob. Contador público, enlace para invitar (`?ref=`) y fuente (`utm_source`). CSV de inscritos: `/api/lista-espera?formato=csv&clave=…` (clave en la variable `LISTA_CLAVE` de Vercel).
- **App en `/app`, privada:** solo entra quien tiene el enlace `/app?acceso=…` (clave en la variable `APP_ACCESO` de Vercel). Interfaz completa con datos de ejemplo; todo pasa por `apps/web/src/api`.

## Siguiente paso
- Elegir el título principal de la landing (hay opciones propuestas).
- Backend `/api` con Claude (ficha, letra, examen, juego, adaptación): contratos en `apps/web/src/api/types.ts`, endpoints en el README.
- Audio con ElevenLabs, persistencia (biblioteca, créditos, links/QR), pictogramas ARASAAC.

## Riesgos
- La rama de producción de Vercel quedó como `claude/fervent-feynman-xbn417` (la rama por defecto de GitHub). Hasta cambiarla a `main` (GitHub → Settings → Default branch, y Vercel → Settings → Environments → Production), los pushes a `main` crean solo vistas previas y producción se despliega a mano.
- El `package-lock.json` debe incluir los binarios de Linux (`@rolldown/binding-linux-x64-gnu`, etc.) o el build de Vercel falla. Si npm los omite, regenerarlo con `rm -rf node_modules package-lock.json && npm install`.
- El repo es de Hecze: coordinar con él antes de pushear cambios de estructura a `main`.

## Dónde mirar
- `README.md` de la raíz: páginas, lista de espera, principios de diseño, endpoints y costos.
