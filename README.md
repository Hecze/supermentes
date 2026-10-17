# Supermentes

Herramientas de IA para docentes del Perú. El docente cuenta qué va a enseñar (escribiéndolo, dictándolo, con una foto de la página del libro o subiendo un archivo), Supermentes arma una **ficha del tema** y, a partir de ella, crea solo lo que el docente pide: una canción, un examen gamificado, un juego web, un crucigrama o una versión adaptada para estudiantes con TDAH, dislexia o TEA.

Proyecto para Hack the Andes 2026.

## Estado

Interfaz completa con **datos de ejemplo**. Todas las pantallas pasan por `src/api`, así que el backend real se conecta ahí sin tocar las pantallas.

Ya funciona sin backend:

- **Crucigrama:** la grilla la arma un algoritmo (`src/lib/crucigrama.ts`) con el vocabulario de la ficha.
- **Juegos:** Memoria, Carrera de preguntas y Adivina la palabra se pueden jugar con el contenido del juego.
- **Enviar por WhatsApp:** abre WhatsApp con el mensaje para la clase.

## Correr el proyecto

```bash
npm install
npm run dev            # http://localhost:5173 con datos de ejemplo
npm run typecheck
npm run build
npm run build:preview  # un solo HTML en dist-preview/supermentes.html para compartir
```

Para usar el backend real: `VITE_API=real npm run dev`.

## Estructura

| Ruta | Qué hay |
| --- | --- |
| `src/api/types.ts` | Contratos de datos entre la UI y el backend |
| `src/api/mock.ts`, `src/api/ejemplos.ts` | Implementación con datos de ejemplo |
| `src/api/real.ts` | Llamadas a `/api/*` |
| `src/api/costos.ts` | Créditos que cuesta cada acción |
| `src/lib/crucigrama.ts` | Algoritmo de la grilla del crucigrama |
| `src/app/` | Estado global, catálogo de herramientas, cobro de créditos |
| `src/components/` | Estructura de la app y componentes de interfaz |
| `src/views/` | Una pantalla por sección |

## Endpoints que tiene que implementar el backend

Cada uno devuelve el tipo indicado de `src/api/types.ts`.

| Endpoint | Entrada | Devuelve |
| --- | --- | --- |
| `POST /api/ficha` | `multipart/form-data`: `tipo`, `texto`, `archivo`, `grado`, `area`, `duracion` | `Ficha` |
| `POST /api/cancion` | `{ ficha, opciones }` | `Cancion` |
| `POST /api/audio` | `{ cancion }` | `AudioCancion` |
| `POST /api/examen` | `{ ficha, opciones }` | `Examen` |
| `POST /api/ilustraciones` | `{ examen }` | `Examen` con `ilustracion` en cada pregunta |
| `POST /api/juego` | `{ ficha }` | `Juego` |
| `POST /api/adaptar` | `{ ficha, necesidades }` | `Adaptacion` |
| `GET /api/biblioteca` | | `Material[]` |

## Costos

La ficha, el crucigrama y la biblioteca no gastan créditos. Lo caro (audio e imágenes) se genera solo a pedido y después de una vista previa barata: primero la letra, después el audio; primero las preguntas, después las ilustraciones. Un juego se genera una vez y cambiar de plantilla es gratis.

## Pendiente para que funcione de verdad

1. Backend `/api` con Claude: ficha (lee fotos y PDF), letra, examen, juego y adaptación.
2. Audio de canciones con ElevenLabs.
3. Persistencia: biblioteca, juegos publicados con link y QR reales, y créditos en el servidor.
4. Descarga en PDF lista para imprimir.
5. Pictogramas de ARASAAC en la adaptación para TEA.
