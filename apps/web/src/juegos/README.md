# Juegos

Repositorio de juegos educativos para la clase. La idea central: **un juego no es "de fracciones" ni "de sustantivos"; consume una forma de contenido**. Así un mismo juego sirve para cualquier tema y nivel, y el docente ve todos los juegos compatibles con su tema.

```
Tema del docente ──┐
                   ├──► Contenido (retos, parejas, palabras) ──► preparar() de cada juego ──► juegos compatibles
Habilidad + nivel ─┘
```

## Contenido (`tipos.ts`)

| Forma | Qué es | La usan |
| --- | --- | --- |
| `Reto` | Pregunta con una respuesta correcta y distractores (siempre incorrectos) | Globos, Botones rápidos, Tira y afloja, Carrera |
| `Par` | Dos cosas que van juntas (3/4 y su dibujo, Rímac y río) | Memoria |
| `Palabra` | Palabra y pista | Adivina la palabra |

Un `Contenido` puede traer además `generar()`: retos sin fin, para la matemática.

## De dónde sale el contenido (`contenido.ts`)

- **Cálculo** (`matematica/`): 22 habilidades con niveles por grado (contar, tablas, fracciones, decimales, ecuaciones, medidas…). Se generan con algoritmos: **gratis, sin fin y siempre correctas**, y los distractores empiezan por los errores típicos (1/5 + 2/5 = 3/10, 2 + 3 × 4 = 20, 7² = 14). `deducir.ts` reconoce la habilidad a partir del título y el propósito del tema, sin pedirle nada al backend.
- **El tema**: su vocabulario (gratis, ya está en la ficha) y, si el docente lo pide, las preguntas y parejas que crea la IA (`POST /api/juego`, 1 crédito). Cada pareja y cada palabra se convierten también en retos, así que alimentan a casi todos los juegos.

## Compatibilidad (`catalogo.tsx`)

Cada juego declara `preparar(contenido)`: deja solo lo que cabe (respuestas cortas para un globo, textos de hasta 16 letras para una carta) y devuelve `null` si no alcanza. La compatibilidad sale de los datos, no de etiquetas: si la IA devuelve respuestas largas, Globos simplemente no aparece.

## Agregar un juego

1. Un componente `default export` que recibe `PropsJuego` (`contenido`, `ritmo`, `semilla`, `terminar`) y dibuja toda la escena (`absolute inset-0`). Al acabar llama a `terminar({ estrellas, titulo, detalle, puntaje? })`.
2. Su miniatura en `miniaturas.tsx` (SVG, 160 × 100).
3. Una entrada en `JUEGOS` con `preparar` y `Componente: lazy(() => import(…))`: cada juego se descarga solo cuando se abre.

`motor/` trae lo común: la partida (portada, pantalla final con estrellas y récord), pantalla completa (también en iPhone), sonidos sintetizados (sin archivos), confeti, cuenta regresiva, la llamita y piezas como `TextoMat` (fracciones apiladas) y `Enunciado`.

## Compartir con los alumnos (`compartir/`)

El docente toca "Compartir con mis alumnos" y la app publica un `Publicado`: qué juego, el ritmo y de dónde sale el contenido. El cálculo se guarda como habilidad y nivel (el celular del alumno genera los ejercicios); el tema guarda su contenido. `api/juegos-compartidos.ts` lo valida, lo guarda en Vercel Blob y devuelve un código de 6 letras sin caracteres confusos (sin I, L, O, 0 ni 1).

Los alumnos entran a `/j/CODIGO` (QR, WhatsApp) o escriben el código en `/j`. La página (`src/alumno/`) es liviana: solo el juego, con "Otro juego" para seguir con el mismo contenido. Si el servidor no responde, el juego viaja comprimido dentro del link (`/j/#d=…`) y abre igual.

## Juegos

| Juego | Inspirado en | Dónde |
| --- | --- | --- |
| Globos | Balloon Pop (Wordwall, Arcademic) | Celular y proyector |
| Botones rápidos | Hit the Button (Topmarks) | Celular y proyector |
| Tira y afloja | Tug of War (Arcademic) | Proyector, 2 equipos (táctil o teclas A S D F / H J K L) |
| Memoria | Matching pairs (Wordwall) | Celular y proyector |
| Carrera de llamas | Math Racing, sin reloj | Celular y proyector |
| Adivina la palabra | Ahorcado, sin horca | Celular y proyector |
