# Supermentes

Herramientas de IA para docentes del Perú. El docente crea un tema (escribe qué va a enseñar y, si quiere, agrega una foto de la página del libro o un archivo), Supermentes arma una **ficha del tema** y, a partir de ella, crea solo lo que el docente pide: una canción, un juego web, un crucigrama o su propio examen adaptado (sube el PDF y recibe un PDF ambientado en lo que le gusta a la clase o adaptado para estudiantes con TDAH, dislexia, TEA o que necesitan lectura fácil).

Proyecto para Hack the Andes 2026.

## Páginas

| Ruta | Qué es |
| --- | --- |
| `/` | Landing con la lista de espera (`index.html`, `src/landing/`) |
| `/app` | La app para docentes (`app/index.html`, `src/main.tsx`). La landing no la enlaza y no aparece en buscadores (`noindex`) |
| `/api/lista-espera` | Función de Vercel que guarda la lista de espera (`api/lista-espera.ts`) |
| `/j/CODIGO` | Juego compartido para los alumnos: solo el juego, sin cuenta (`j/index.html`, `src/alumno/`). En `/j` se escribe el código |
| `/api/juegos-compartidos` | Guarda cada juego compartido en Vercel Blob con un código de 6 letras (`api/juegos-compartidos.ts`) |
| `/api/resultados` | Guarda el mejor puntaje de cada alumno en un juego compartido y se los muestra al docente que lo envió (`api/resultados.ts`) |

## Currículo nacional (base de conocimiento)

`packages/curriculo/data/*.json` tiene el currículo oficial del MINEDU por nivel, grado y área (competencias, capacidades, estándares y desempeños). En la app:

- **Biblioteca → Currículo nacional:** el docente elige grado y curso y lee el documento; desde los temas del grado puede crear un tema con un clic.
- **Busca tu tema:** no hay temas libres. El docente elige grado (y si quiere, curso) y busca: aparecen los temas del currículo y, si la palabra no es un tema, los desempeños que la mencionan. Antes de preparar el tema ve la competencia y los desempeños en que se basa (`apps/web/src/curriculo/buscar.ts`).
- **Ficha del tema y herramientas:** muestran en qué currículo se basa todo lo que se genera. El backend debe usar `gradoId` y `areaId` de la ficha para incluir esas competencias y desempeños en cada generación.

## Lista de espera

- Cada registro es un archivo **privado** en Vercel Blob (`lista-espera/<huella del correo>.json`): un archivo por correo, así que no hay duplicados y volver a enviar el formulario solo completa los datos.
- `GET /api/lista-espera` devuelve `{ total }` para el contador de la landing (cacheado 2 minutos en la CDN).
- `GET /api/lista-espera?formato=csv&clave=LISTA_CLAVE` descarga todos los registros en CSV, con la columna `invitados` (cuántas personas se unieron con el enlace de cada uno). La clave está en las variables de entorno del proyecto en Vercel.
- `DELETE /api/lista-espera?correo=…&clave=LISTA_CLAVE` borra un registro (pruebas o spam).
- Para medir cada red social, comparte la landing con `?utm_source=instagram` (o `facebook`, `tiktok`, `whatsapp`…); queda guardado en la columna `fuente`.
- Cada inscrito recibe un enlace `/?ref=CODIGO` para invitar a otros.

## Principios de diseño

Pensado para docentes con poca experiencia digital: simple a primera vista y potente cuando lo necesitas, como una hoja de cálculo.

- **Una pregunta y un botón principal por pantalla.** "¿Qué necesitas para tu clase?", "¿Con qué ritmo?", "¿Qué le gusta a tu clase?".
- **No es un chat.** Los temas se eligen desde un solo selector, y "Buscar otro tema" abre un buscador del currículo en una ventana.
- **El resultado se ve como una hoja.** Lo que ves es lo que se imprime, y cualquier texto se corrige con un clic.
- **Lo avanzado queda plegado** en "Más opciones" o "Cambiar…", nunca en la primera vista.
- **Palabras del aula, no técnicas.** "Le cuesta concentrarse" antes que "TDAH"; los créditos solo aparecen bajo el botón que los gasta.

## Estado

Interfaz completa con **datos de ejemplo**. Todas las pantallas pasan por `src/api`, así que el backend real se conecta ahí sin tocar las pantallas.

Ya funciona sin backend:

- **Crucigrama:** el docente escribe sus palabras y pistas (la app solo sugiere las del tema); la grilla se ajusta sola, sin pasar de 20 × 20 para que quepa en una hoja, y la arma un algoritmo (`src/lib/crucigrama.ts`) en vivo. Se imprime o se descarga como PNG con fondo transparente (solo las casillas en blanco).
- **Juegos:** doce juegos que sirven para cualquier tema (Concurso estilo Kahoot, Globos, Botones rápidos, Memoria, Carrera de llamas, Atrapa al cuy, Adivina la palabra, Pupiletras, Duelo de robots, Invasión, Tira y afloja y Ruleta de preguntas): el docente ve solo los compatibles con lo que practica. Con cálculo (22 habilidades con niveles por grado, generadas con algoritmos) y con el vocabulario del tema son gratis y sin fin. El pupiletras también se imprime. Ver `src/juegos/README.md`.
- **Mandar un juego a las familias:** el docente toca "Enviar a las familias" y sale el mensaje de WhatsApp para el grupo de papás con el link (`supermentes.app/j/CODIGO`); los niños juegan en el celular de casa, sin cuenta. También hay código para escribir en `/j` y QR en grande para la clase. Si el servidor no responde, el juego viaja dentro del link y abre igual.
- **Resultados de los alumnos:** la primera vez, el niño escribe su nombre en un popup (sin cuenta; el código ya viene en el link). Cuando supera su puntaje, se guarda, y el docente ve en **Resultados de juegos** (en el menú, sin importar el tema abierto) una tabla simple: quién jugó, su puntaje más alto y sus estrellas. Los ejercicios de cálculo cambian en cada intento, así que reintentar no es memorizar.
- **Enviar por WhatsApp:** abre WhatsApp con el mensaje para la clase.
- **Imprimir:** imprime solo la hoja (examen, crucigrama o letra), siempre en blanco. El examen adaptado además se descarga como PDF (`apps/web/src/lib/pdfExamen.ts`, con jsPDF en el navegador), y aparte el PDF de respuestas.

## Correr el proyecto

```bash
npm install
npm run dev            # landing en http://localhost:5173 y app en /app/ (la lista de espera solo funciona desplegada)
npm run typecheck
npm run build
npm run build:preview -w @supermentes/web  # un solo HTML en apps/web/dist-preview/supermentes.html para compartir
```

Para usar el backend real: `VITE_API=real npm run dev`.

Se despliega en Vercel desde la rama `main` (proyecto `supermentes`).

## Estructura

Monorepo con Turborepo: la app vive en `apps/web/` (las rutas de abajo son relativas a esa carpeta), las funciones de Vercel siguen en `api/` de la raíz, el código compartido iría en `packages/` y las notas del proyecto en `obsidian/`.

| Ruta | Qué hay |
| --- | --- |
| `src/api/types.ts` | Contratos de datos entre la UI y el backend |
| `src/api/mock.ts`, `src/api/ejemplos.ts` | Implementación con datos de ejemplo |
| `src/api/real.ts` | Llamadas a `/api/*` |
| `src/api/costos.ts` | Créditos que cuesta cada acción |
| `src/lib/crucigrama.ts` | Algoritmo de la grilla del crucigrama |
| `src/juegos/` | Juegos: contenido, generadores de cálculo, catálogo con compatibilidad y motor común |
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
| `POST /api/examen` | multipart: `ficha`, `opciones` (`{ interes, necesidades }`), `examen` (PDF o foto) | `Examen` adaptado |
| `POST /api/juego` | `{ ficha }` | `Juego` |
| `GET /api/biblioteca` | | `Material[]` |

## Costos

La ficha, el crucigrama (palabras del docente + algoritmo) y la biblioteca no gastan créditos. Lo caro (audio e imágenes) se genera solo a pedido y después de una vista previa barata: primero la letra, después el audio; primero las preguntas, después las ilustraciones. Los juegos de cálculo y con el vocabulario del tema son gratis; las preguntas y parejas del tema se crean una vez (1 crédito) y sirven para todos los juegos.

## Pendiente para que funcione de verdad

1. Backend `/api` con Claude: ficha (lee fotos y PDF), letra, examen adaptado y juego.
2. Audio de canciones con ElevenLabs.
3. Persistencia: biblioteca, créditos en el servidor y guardar lo que el docente corrige en la hoja.
4. Pictogramas de ARASAAC en el examen adaptado para TEA.
