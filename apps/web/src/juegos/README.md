# Juegos

## Cómo se usan de verdad

- **El docente usa laptop.** Elige el tema, prueba el juego y toca "Enviar a las familias".
- **Los alumnos juegan en el celular de sus papás.** El link llega al grupo de WhatsApp de las familias; los papás le prestan el celular a su hijo o hija. Muchas veces se abre dentro de WhatsApp, en un celular Android de gama baja y con datos limitados.
- **Nos centramos en primaria.** Los juegos de estilo juvenil (Duelo, Invasión) aparecen primero solo en 5.º y 6.º.
- El proyector es un uso secundario: Tira y afloja y la Ruleta son solo para la clase y no se mandan por link.

Reglas para todo lo que juega el alumno:

1. **Celular en vertical primero**, y que también funcione al girarlo. Probar a 360 × 640.
2. **Botones para el pulgar:** al menos ~54 px de alto, separados, y nada que dependa del teclado ni del mouse (ni hover, ni doble clic).
3. **Letra grande:** las preguntas, desde 22–26 px en un celular chico. Los niños de los primeros grados recién están leyendo.
4. **Liviano:** cada juego se descarga solo al abrirlo (2–4 KB comprimidos), sin imágenes ni audio que bajar: dibujos SVG y sonidos sintetizados.
5. **Sin salidas:** ni publicidad ni links fuera del juego; al terminar, "Otra vez" u "Otro juego" (solo de celular).
6. **Navegador viejo:** si no soporta lo que usamos (container queries, 2022+), la página del alumno lo dice en lugar de verse rota.

## Diseño

Repositorio de juegos educativos para la clase. La idea central: **un juego no es "de fracciones" ni "de sustantivos"; consume una forma de contenido**. Así un mismo juego sirve para cualquier tema y nivel, y el docente ve todos los juegos compatibles con su tema.

```
Tema del docente ──┐
                   ├──► Contenido (retos, parejas, palabras) ──► preparar() de cada juego ──► juegos compatibles
Habilidad + nivel ─┘
```

## Contenido (`tipos.ts`)

| Forma | Qué es | La usan |
| --- | --- | --- |
| `Reto` | Pregunta con una respuesta correcta y distractores (siempre incorrectos) | Globos, Botones rápidos, Tira y afloja, Carrera, Atrapa al cuy, Ruleta |
| `Par` | Dos cosas que van juntas (3/4 y su dibujo, Rímac y río) | Memoria |
| `Palabra` | Palabra y pista | Adivina la palabra, Pupiletras |

Un `Contenido` puede traer además `generar()`: retos sin fin, para la matemática.

## De dónde sale el contenido (`contenido.ts`)

- **Cálculo** (`matematica/`): 22 habilidades con niveles por grado (contar, tablas, fracciones, decimales, ecuaciones, medidas…). Se generan con algoritmos: **gratis, sin fin y siempre correctas**, y los distractores empiezan por los errores típicos (1/5 + 2/5 = 3/10, 2 + 3 × 4 = 20, 7² = 14). `deducir.ts` reconoce la habilidad a partir del título y el propósito del tema, sin pedirle nada al backend.
- **El tema**: su vocabulario (gratis, ya está en la ficha) y, si el docente lo pide, las preguntas y parejas que crea la IA (`POST /api/juego`, 1 crédito). Cada pareja y cada palabra se convierten también en retos, así que alimentan a casi todos los juegos.

## Compatibilidad (`catalogo.tsx`)

Cada juego declara `preparar(contenido)`: deja solo lo que cabe (respuestas cortas para un globo, textos de hasta 16 letras para una carta) y devuelve `null` si no alcanza. La compatibilidad sale de los datos, no de etiquetas: si la IA devuelve respuestas largas, Globos simplemente no aparece.

## Agregar un juego

1. Un componente `default export` que recibe `PropsJuego` (`contenido`, `ritmo`, `semilla`, `terminar`) y dibuja toda la escena (`absolute inset-0`). Al acabar llama a `terminar({ estrellas, titulo, detalle, puntaje })`. Reporta siempre `puntaje`: es lo que el docente ve en su tabla de resultados, y más alto tiene que ser mejor.
2. Su miniatura en `miniaturas.tsx` (SVG, 160 × 100).
3. Una entrada en `JUEGOS` con `preparar` y `Componente: lazy(() => import(…))`: cada juego se descarga solo cuando se abre.

`motor/` trae lo común: la partida (portada, pantalla final con estrellas y récord), pantalla completa (también en iPhone), sonidos sintetizados (sin archivos), confeti, cuenta regresiva, la llamita y piezas como `TextoMat` (fracciones apiladas) y `Enunciado`.

## Compartir con los alumnos (`compartir/`)

El docente toca "Enviar a las familias" y la app publica un `Publicado`: qué juego, el ritmo y de dónde sale el contenido. El cálculo se guarda como habilidad y nivel (el celular del alumno genera los ejercicios); el tema guarda su contenido. `api/juegos-compartidos.ts` lo valida, lo guarda en Vercel Blob y devuelve un código de 6 letras sin caracteres confusos (sin I, L, O, 0 ni 1).

Los papás reciben `/j/CODIGO` por WhatsApp (en clase también sirve el QR o escribir el código en `/j`). La página (`src/alumno/`) es liviana: solo el juego, con "Otro juego" (solo juegos de celular) para seguir con el mismo contenido. Si el servidor no responde, el juego viaja comprimido dentro del link (`/j/#d=…`) y abre igual.

## Resultados para el docente (`compartir/resultados.ts`)

Sin cuentas ni registro, como en Kahoot:

- **El código va en el link.** `/j/CODIGO` ya trae el código; el alumno no escribe nada.
- **El nombre, una sola vez.** La primera vez que abre un juego, un popup le pregunta "¿Cómo te llamas?". El celular guarda su nombre y un id al azar (`localStorage`), así reconoce al mismo alumno las siguientes veces. Abajo del juego dice "Juegas como Ana · No soy yo", por si el celular lo comparten hermanos.
- **Se guarda el mejor puntaje.** Al terminar una partida, si el alumno superó su mejor puntaje, el celular lo manda a `POST /api/resultados`. El servidor guarda un archivo por alumno y por código (`resultados/CODIGO/ID.json`) con su mejor puntaje y sus estrellas; dos alumnos que terminan a la vez no se pisan. Si no lo superó, el celular ni llama: así se cuidan las 2.000 escrituras al mes del plan Hobby de Vercel Blob, que comparte la lista de espera. Por eso no se cuentan las veces que jugó.
- **Solo el docente los ve.** Al publicar, el servidor devuelve una `clave` secreta que se queda en la laptop del docente (`localStorage`); el juego guardado nunca la devuelve.
- **Una vista simple y fácil de encontrar.** "Resultados de juegos" está en el menú y no depende del tema abierto: muestra todos los juegos enviados, agrupados por tema y grado, con el tema abierto primero. Cada juego abre una tabla con alumno, puntaje más alto, estrellas y cuándo (`GET /api/resultados?codigo&clave`, solo del juego que se abre). En Juego web queda una sola línea, "Mandaste un juego de este tema. Ver resultados", para no empujar la lista de juegos.
- **Reintentar no es memorizar.** Cada partida trae ejercicios nuevos: el cálculo se genera en el celular con otra semilla y Memoria arma parejas nuevas en cada partida. Las preguntas del tema que crea la IA son un banco fijo: cambian el orden y las opciones, pero se repiten. Para que no se memoricen, el backend debería crear más preguntas de las que entran en una partida.

Los endpoints que escriben tienen un tope por conexión (`demasiadas` en `api/_juegos.ts`). Pendiente: la clave vive en el navegador del docente. Si borra los datos del navegador o cambia de laptop, deja de ver esos resultados. Cuando haya cuentas, la clave pasa a su cuenta.

En desarrollo (`npm run dev`), Vite corre las funciones de `api/`. Si el `.env.local` de la raíz no trae `BLOB_READ_WRITE_TOKEN`, usan un Blob en memoria (`scripts/blob-en-memoria.mjs`): se puede probar compartir y ver resultados sin credenciales y sin tocar los datos de producción.

## Juegos

| Juego | Inspirado en | Dónde |
| --- | --- | --- |
| Globos | Balloon Pop (Wordwall, Arcademic) | Celular y proyector |
| Botones rápidos | Hit the Button (Topmarks) | Celular y proyector |
| Tira y afloja | Tug of War (Arcademic) | Proyector, 2 equipos (táctil o teclas A S D F / H J K L) |
| Memoria | Matching pairs (Wordwall) | Celular y proyector |
| Carrera de llamas | Math Racing, sin reloj | Celular y proyector |
| Adivina la palabra | Ahorcado, sin horca | Celular y proyector |
| Pupiletras | Sopa de letras (también se imprime) | Celular y proyector |
| Atrapa al cuy | Whack-a-mole (Wordwall) | Celular y proyector |
| Ruleta de preguntas | Ruleta aleatoria (Wordwall), la guía el docente | Proyector |
| Concurso | Kahoot: reloj, cuatro colores con figuras y puntos por rapidez | Celular y proyector |
| Duelo de robots | Juegos de pelea, sin sangre (contra la máquina o de a dos) | Celular y proyector (5.º–6.º) |
| Invasión | Arcades de naves (Space Invaders), sin violencia | Celular y proyector (5.º–6.º) |
