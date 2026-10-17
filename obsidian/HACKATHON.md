---
actualizado: 2026-10-17
---

# Hack the Andes 2026

> Condiciones del evento y créditos que nos dieron. El estado del proyecto está en [[ESTADO]].

## El evento
- **Dónde y cuánto:** Lima, 30 horas desde el sábado 17 de octubre de 2026.
- **Entrega:** domingo **18 de octubre de 2026, 9:00 a. m. (hora de Lima)**.
- **Tema elegido:** educación, "herramientas para docentes".
- **Objetivo:** algo que funcione de verdad, no una demo. Lo que se muestre tiene que poder usarlo un docente real.
- **Reto de tracción:** conseguir gente interesada. Por eso la landing (`/`) tiene lista de espera con contador, enlace para invitar (`?ref=`) y fuente (`utm_source`); se promociona por redes. El CSV de inscritos se baja con `/api/lista-espera?formato=csv&clave=…` (clave: variable `LISTA_CLAVE` en Vercel).

## Equipo
- **Dropout Hack**, track `education` (Educación Escolar): Hector Zerrillo y Harold Medrano.
- Todos los integrantes pueden publicar avances y actualizar la entrega. El proyecto lleva el
  nombre del equipo (`andes team rename --name "…"` para cambiarlo).

## Cómo nos evalúan
- **Nota de cada jurado sobre 100:** tracción × 6 + esfuerzo técnico × 8 + pitch × 6 (cada
  criterio de 1 a 5). Pesa más lo técnico; tracción y pitch empatan. El resultado es el promedio
  de los jurados.
- **Pitch:** 3 minutos + 2 de preguntas, en la computadora de la organización y desde los
  enlaces entregados (no se conecta la laptop). Problema → quién lo tiene → solución
  funcionando → evidencia. Separar lo que ya funciona de lo que es idea.
- **Se congela al abrir la evaluación:** la organización guarda una copia de la entrega, los
  enlaces y la bitácora; los cambios posteriores no llegan al jurado.

## Entrega (`andes project submit`)
Se puede entregar temprano y corregir después; cualquier integrante la actualiza.
1. **URL del despliegue** funcionando: https://www.supermentes.app
2. **URL de la presentación:** https://claude.ai/artifact/Vbx4ZRLX8eDRKFCyLz6UiV (copia en `presentacion/`; compartirla por link antes de entregar).
3. **URL del repo:** https://github.com/Hecze/supermentes
4. **Descripción en Markdown:** problema, para quién, cómo funciona y **limitaciones**
   (`--file ./proyecto.md`).

Probar app y presentación en una **ventana privada**, sin sesión iniciada ni archivos locales.
La descripción y los avances se hacen públicos: nada de claves, tokens ni datos de usuarios.

## Bitácora (`andes project update`)
Avances para mentores y jurado, visibles en la galería. Publicar tras una decisión importante,
una prueba con usuarios, una demo funcional o un bloqueo: qué cambió, por qué y el siguiente
paso. Al 2026-10-17 la bitácora está vacía y no hay entrega.

## Créditos y perks
Los **códigos** no van en el repo: pídelos a Hector (están en su Notion, página "Hack the Andes 2026: créditos y perks") o en el canal del evento.

### Vencen primero
- **Tavily:** solo del 17 al 19 de octubre. Disponibilidad limitada.
- **Lovable:** hasta el 20 de octubre, 5:00 p. m. (Lima). Hasta 120 canjes.
- **Zavu:** el cupón se habilita el domingo 18 de octubre.
- **n8n:** 100 licencias; caducan una semana después del evento.
- **Exa:** hasta 300 canjes.

### Qué da cada uno
| Perk | Qué da | Dónde se canjea |
| --- | --- | --- |
| ElevenLabs | Programa Startups / Creators | Preguntar a la organización |
| Lovable | Pro Plan 1 mensual, 100 créditos | lovable.dev → Settings → Plans & Credits (si ya tienes cuenta de pago, workspace nuevo) |
| n8n | n8n Cloud Pro (el texto dice 1 mes, la imagen 1 semana) | https://n8n.notion.site/voucher-code |
| Exa | US$50 de Search API | https://exa.ai |
| Tavily | 8,000 créditos | app.tavily.com (enlace de canje del evento) |
| Grok | Beneficio por referido | Enlace de referido del evento |
| Apify | Ver guía del evento | Guía "Hack the Andes x Apify" (Notion del evento) |
| AtomicMemory | 5 meses de Plan Pro | https://lp.atomicstrata.ai/andes |
| Qatom | 6 meses de Plan Max | https://www.qatom.ai/hack-the-andes |
| Zavu | 3 meses de Plan Pro | Consultar al equipo de Zavu |
| Maritime (vía IALABS) | US$100 en créditos | https://maritime.sh (condiciones con IALABS) |

### Para qué nos pueden servir (sin probar)
- **ElevenLabs:** audio de las canciones y lectura en voz alta de la versión accesible.
- **Exa / Tavily:** buscar recursos educativos y estrategias DUA con fuentes.
- **AtomicMemory:** guardar el perfil de cada clase (intereses, adaptaciones).
- **Grok:** quizá imágenes para ilustrar exámenes (verificar si incluye API).
- Qatom, Zavu y Maritime: revisar qué ofrecen antes de planear con ellos.
