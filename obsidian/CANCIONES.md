---
actualizado: 2026-10-19
---

# Canciones: el canal de YouTube de Supermentes

## La decisión (19-oct)

- El estudio de mercado dice que el docente paga **S/ 15 al mes**. Eso no cubre crear canciones con IA para cada docente.
- Las canciones salen de **un canal de YouTube propio**. La app no crea canciones ni guarda audio: muestra los videos del canal.
- Crear canciones dentro de la app queda, como mucho, para un plan de colegios. **No a corto ni a mediano plazo.**
- Meta: canciones para **cada tema de cada grado** (miles).

**La idea que lo hace barato:** una canción es de un tema, no de un docente. La hacemos una vez y la ven todos los docentes de ese tema, gratis para siempre (YouTube pone el almacenamiento y la transmisión). El mismo principio sirve para lo demás: generar una vez por tema y servirlo a todos (como el banco de 4.º).

## Cómo crear el canal

1. **Cuenta de Google del proyecto**, no personal, con verificación en 2 pasos (mejor un correo de supermentes.app).
2. youtube.com → **Crear un canal** → con nombre personalizado «Supermentes». Así queda como *cuenta de marca*: en Configuración → Permisos se agrega al equipo como administradores, sin compartir la contraseña.
3. **Verificar el canal por teléfono** (youtube.com/verify): permite videos de más de 15 min, miniaturas propias y subir más videos por día.
4. Configuración → Canal → Configuración avanzada → Público: **«Sí, es contenido creado para niños»**. YouTube lo exige para música infantil (ley COPPA). Efectos: sin comentarios ni campanita, anuncios solo "contextuales"; el video se puede insertar en la app igual.
5. Identificador **@supermentes**, foto, banner y descripción con el enlace a supermentes.app.
6. **Listas por grado y área** («4.º primaria · Matemática»): ordenan el canal para docentes y familias, y ayudan a que lo encuentren.
7. Copiar el **ID del canal** (Configuración → Configuración avanzada, empieza con `UC…`).
8. **Google Cloud** (console.cloud.google.com, con la misma cuenta):
   - Proyecto «supermentes» → habilitar **YouTube Data API v3** → crear una **clave de API** restringida a esa API (solo sirve para leer).
   - Para subir desde la app (fase 2): credencial **OAuth** (aplicación web) y pantalla de consentimiento en **«En producción»**. En «Prueba», el permiso vence a los 7 días y la subida deja de funcionar sin aviso. No hace falta verificar la app: solo la usa la cuenta del canal. Se autoriza una vez y se guarda el *refresh token*.

## Variables (Vercel → Settings → Environment Variables)

| Variable | Para qué | Cuándo |
| --- | --- | --- |
| `YOUTUBE_CHANNEL_ID` | El canal (`UC…`) | Fase 1 |
| `YOUTUBE_API_KEY` | Leer videos y listas del canal | Fase 1 |
| `ADMINS` | Ids de Clerk que pueden entrar a la página Canal (`user_…,user_…`) | Fase 1 |
| `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN` | Subir videos desde la app | Fase 2 |

Nada de esto se escribe en el código: todo sale de las variables.

## Cómo entra un video a la app, sin burocracia

Una **página oculta «Canal»**. Que la URL sea secreta no basta: solo entran las cuentas de `ADMINS`.

1. Eliges el tema con el mismo buscador de la app (grado → tema). La página muestra sus desempeños oficiales y propone la cita (la del banco, si existe).
2. Arrastras el video. En la fase 1 lo eliges de «últimos videos del canal».
3. La app arma el título, la descripción (con la cita del desempeño y el enlace), las etiquetas, la lista del grado y la marca «creado para niños».
   - El video sube **directo del navegador a YouTube**. Por Vercel no podría: sus funciones aceptan hasta 4,5 MB por pedido.
   - Al terminar, guarda el vínculo tema ↔ video con su cita verificada contra `packages/curriculo`.
4. Un video puede servir a varios temas y grados (por ejemplo, una canción de multiplicar sirve en 3.º y 4.º), cada uno con su propia cita.

**Límites de la API de YouTube** (documentación oficial, consultada el 19-oct):

| Operación | Costo |
| --- | --- |
| Subir un video | 100 por día, en una cuenta aparte |
| Leer videos o listas | 1 unidad cada 50 |
| Agregar a una lista | 50 unidades |
| Poner miniatura | 50 unidades |
| Editar un video | 50 unidades |
| Total diario | 10 000 unidades |

Subir 100 videos al día con lista y miniatura gasta todo el cupo. Se puede pedir más cupo gratis (formulario de auditoría de la API).

## Los datos, pensados para miles de temas

**Fuente de verdad: Neon**, dos tablas chicas:

- `videos`: `youtube_id` (clave), título, duración, ritmo, idioma, estado y fecha. La letra es opcional, para imprimirla.
- `video_temas`: `youtube_id`, `grado_id`, `area_id`, `tema_id`, `cita`, `competencia` y orden.

Reglas del diseño:

- **`tema_id` estable**: `grado/área/slug-del-tema`, por ejemplo `primaria-4/matematica/valor-posicional`. Si un tema cambia de nombre en `packages/curriculo`, su vínculo queda huérfano. La página Canal lo muestra para reasignarlo; nada se pierde en silencio.
- **Tamaño:** 5 000 videos ocupan unos pocos MB. La base no pesa; lo que cuesta es **despertarla**. Neon cobra por tiempo encendido: si cada visita (o una caché corta) la despierta, queda prendida casi todo el día y deja de ser gratis.
- **Los docentes nunca leen de Neon.** Cuando un admin guarda, se escribe un JSON por grado en Blob (unos 20–40 KB, como el banco). La app lo lee por el CDN con caché, así que Neon solo se enciende cuando un admin guarda.
- **Revisión diaria** (cron de Vercel, incluido en el plan): consulta en YouTube el estado de todos los videos (1 unidad cada 50) y esconde los borrados, privados o que no se pueden insertar. Así ningún docente encuentra un video roto en plena clase.
- Las 206 canciones externas (`apps/web/src/canciones/canciones.json`) pueden pasar después a la misma tabla, marcadas como externas.

## La fábrica: producir miles de canciones

- La app solo muestra canciones que ya están en YouTube. Las **768 letras** que se generaron para 4.º (2 por tema, con cita y ritmo) se quitaron del banco el 19-oct; si sirven para la fábrica, están en git: `git show 4fe872e:apps/web/src/banco/primaria-4/<área>.json`, campo `canciones`.
- Un script interno, no la app, hace el recorrido completo: letra → Lyria (canción completa) → video con la letra (ffmpeg: fondo y letra que avanza) → subida por la API ya vinculada a su tema.
- **Costo único:** unos US$ 0,08 por canción completa (Lyria 3 Pro vía OpenRouter, precio del 17-oct).
  - 4.º primaria (768 canciones): unos US$ 61.
  - Toda primaria (unas 4 400 canciones, 2 por tema): unos US$ 350, una sola vez. Después es gratis para todos.
- **Ritmo de subida:** 100 por día, o sea unos 45 días para toda primaria (o pedir más cupo).
- **Antes de publicar, revisar:**
  - los términos de Lyria y de OpenRouter para publicar y monetizar;
  - la etiqueta de «contenido alterado o sintético» que pide YouTube.

## Costos que no se ven a primera vista

- **El plan Hobby de Vercel no permite uso comercial.** Al cobrar S/ 15 hay que pasar a Pro (US$ 20 al mes por miembro).
- **Hobby acepta hasta 12 funciones por despliegue** (con más, falla todo el despliegue). Hoy son 8. Lo del canal va en **una sola función**, `api/canal.ts`, que atiende la página Canal, la subida y la revisión diaria (como `api/cuentas.ts`).
- **En Vercel, evitar:**
  - la optimización de imágenes: usar las miniaturas de `i.ytimg.com` tal cual;
  - guardar videos o audio en Blob: van a YouTube;
  - funciones largas: ya no hay canciones con IA;
  - los eventos personalizados de Analytics, que son de Pro. Qué canciones se usan lo dice YouTube Studio, gratis.
- **IA por docente:** con S/ 15 al mes, lo que se genere para cada docente tiene que costar centavos. Desde el 19-oct no hay créditos (uso sin límite): hace falta un tope por cuenta y por día en los endpoints con IA, o un docente (o un abuso) se come el margen de muchos. La salida es la misma: generar una vez por tema (ficha, preguntas, sesión base) y servirlo a todos. Medir cuánto cuesta cada herramienta por uso antes de lanzar.
- **Anuncios:** YouTube puede mostrar anuncios contextuales en videos para niños aunque el canal no esté monetizado, y en clase se ven. El insertado con `youtube-nocookie.com` y `rel=0` muestra solo videos del canal al final, pero los anuncios no se pueden quitar del todo.

## Fases

0. **Ya (19-oct):** la app deja de crear canciones. Se van «Crear canción», la música con IA y los endpoints `/api/cancion` y `/api/audio`. Después, también las letras del banco: **solo se muestran canciones que están en YouTube**, en una sola lista.
1. **Con el canal creado:**
   - las tablas, el JSON por grado y la revisión diaria;
   - en la pantalla Canción, los videos del canal entran en la misma lista, primero (no se separan de los de otros canales: el nombre del canal ya lo dice);
   - la página Canal: vincular videos ya subidos.
2. **Subida desde la página Canal**, con título, descripción, lista y cita armados solos.
3. **La fábrica:** el script que produce y sube las canciones del banco, grado por grado.
