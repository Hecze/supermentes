---
actualizado: 2026-10-17
---

# Estado — Supermentes

> Única fuente de verdad de "dónde quedamos". Se reemplaza, no se acumula (≤ 60 líneas).

## En qué estamos
Herramientas de IA para docentes del Perú (Hack the Andes 2026, repo de Hecze: `Hecze/supermentes`). La interfaz está completa con datos de ejemplo; todo pasa por `apps/web/src/api`. 2026-10-17: el repo se reorganizó como monorepo Turborepo (`apps/web` + `obsidian/`).

## Siguiente paso
- Backend `/api` con Claude (ficha, letra, examen, juego, adaptación) — contratos en `apps/web/src/api/types.ts`, endpoints en el README.
- Audio con ElevenLabs, persistencia (biblioteca, créditos, links/QR), pictogramas ARASAAC.

## Riesgos
- El repo es de Hecze: coordinar con él antes de pushear cambios de estructura a `main`.

## Dónde mirar
- `README.md` de la raíz: principios de diseño, endpoints y costos.
