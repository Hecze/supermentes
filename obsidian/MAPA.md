---
actualizado: 2026-10-17
---

# Mapa — Supermentes

> Todo el producto en una página: qué hace, qué funciona de verdad y qué falta. El porqué está en
> [[VISION]], dónde quedamos en [[ESTADO]] y el evento en [[HACKATHON]].

## El flujo

```mermaid
flowchart LR
  L[Landing /<br/>lista de espera] -. enlace privado .-> A
  A[Docente en /app] --> T[Elige grado, curso y tema<br/>del Currículo Nacional]
  F[Foto del libro o<br/>su sesión, opcional] --> FI
  T --> FI[Ficha del tema<br/>competencias, desempeños,<br/>vocabulario]
  FI --> C[Canción]
  EX[Examen del docente<br/>PDF o foto] --> E[Adaptar examen<br/>PDF adaptado]
  FI --> E
  FI --> J[Juego web]
  FI --> X[Crucigrama]
  C & E & X --> H[Hoja: imprimir, PDF<br/>o WhatsApp]
  J --> Q[Link + QR para<br/>los alumnos]
  H & Q --> B[Biblioteca]
```

## Qué hace cada pieza y cómo está

| Pieza | Qué hace | Hoy | Costo | Falta |
| --- | --- | --- | --- | --- |
| Landing `/` | Lista de espera con contador, referidos y fuente | **Real** en producción | Gratis | Promoción (reto de tracción) |
| Currículo | CNEB de Inicial, Primaria y Secundaria como base | **Real** (`packages/curriculo`) | Gratis | — |
| Ficha del tema | Resume el tema con sus desempeños | Ejemplo | Gratis | `POST /api/ficha` con Claude (lee foto/PDF) |
| Canción | Letra con ritmo peruano y luego el audio | Ejemplo | 1 + 3 créditos | `/api/cancion` (Claude) y `/api/audio` (ElevenLabs) |
| Adaptar examen | El docente sube su examen (PDF o foto) y descarga un PDF ambientado en lo que le gusta a la clase y/o para TDAH, dislexia, TEA o lectura fácil (formato incluido: letra grande, casillas, apoyos) | Código real (`api/examen.ts`; PDF en el navegador). En producción sale el ejemplo hasta configurar la clave | 1 crédito | `OPENROUTER_API_KEY` y `VITE_API=real` en Vercel |
| Juego web | 6 juegos para cualquier tema; 22 habilidades de cálculo | **Real** con cálculo y vocabulario | Gratis / 1 crédito | `/api/juego` para preguntas del tema |
| Compartir juego | Código de 6 letras y QR para el celular del alumno | **Real** (`api/juegos-compartidos.ts`) | Gratis | Probar en el aula |
| Crucigrama | Grilla con las palabras del docente | **Real** (algoritmo) | Gratis | — |
| Biblioteca | Currículo + materiales de otros profes | Currículo real, materiales de ejemplo | Gratis | Persistencia |
| Créditos | 30 al mes por docente | Solo en el navegador | — | Guardarlos en el servidor; decidir quién paga |

**Lectura rápida:** lo que no usa IA ya funciona (currículo, juegos de cálculo, crucigrama,
compartir). Todo lo que necesita IA sigue con datos de ejemplo: el backend con Claude es el
cuello de botella.

## Piezas técnicas

- **Repo:** `Hecze/supermentes`, rama `main`, monorepo Turborepo. App en `apps/web` (Vite + React),
  funciones de Vercel en `api/`, currículo en `packages/curriculo`, notas en `obsidian/`.
- **Producción:** https://www.supermentes.app (Vercel, cuenta de Hecze). Datos en Vercel Blob.
- **Contratos UI ↔ backend:** `apps/web/src/api/types.ts`. Cambiar de ejemplo a real: `VITE_API=real`.
- **IA prevista:** Claude (texto y lectura de fotos), ElevenLabs (audio), ARASAAC (pictogramas).

## Decisiones abiertas

- **Quién paga.** El docente de colegio público no va a pagar con tarjeta. Opciones: colegios
  privados, UGEL/MINEDU, o freemium con donante. Sin decidir; propuesta con evidencia en [[NEGOCIO]].
- **Costo por docente.** Cuánto cuesta en Claude + ElevenLabs un docente activo al mes con 30
  créditos. Estimado en [[NEGOCIO]] (~US$ 1.3 con uso típico); sin medir en producción.
- **Qué mostrar en la entrega** (domingo 18, 9:00 a. m.). Cuáles herramientas tienen que funcionar
  con IA real y cuáles pueden quedar como ejemplo.
- **Canal.** Grupos de WhatsApp de docentes y referidos de la lista de espera parecen el canal
  natural; sin probar.
