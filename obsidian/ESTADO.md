---
actualizado: 2026-10-17
---

# Estado — Supermentes

> Única fuente de verdad de "dónde quedamos". Se reemplaza, no se acumula (≤ 60 líneas).

## En qué estamos
Herramientas de IA para docentes del Perú (Hack the Andes 2026, repo `Hecze/supermentes`, rama `main`). Monorepo Turborepo: el sitio en `apps/web`, funciones de Vercel en `api/` en la raíz, notas en `obsidian/`.

- **En producción:** https://www.supermentes.app (proyecto de Vercel `supermentes`, cuenta de Hecze).
- **Landing en `/`** con lista de espera real: `api/lista-espera.ts` guarda cada registro como archivo privado en Vercel Blob. Contador público, enlace para invitar (`?ref=`) y fuente (`utm_source`). CSV de inscritos: `/api/lista-espera?formato=csv&clave=…` (clave en la variable `LISTA_CLAVE` de Vercel).
- **App en `/app`:** abierta, pero la landing no la enlaza y no aparece en buscadores. Interfaz completa con datos de ejemplo; todo pasa por `apps/web/src/api`.
- **Base de conocimiento:** el Currículo Nacional (MINEDU) por grado y curso en `packages/curriculo/data/{inicial,primaria,secundaria}.json` (competencias, capacidades, estándar del ciclo, desempeños y temas sugeridos). Los temas no son libres: se buscan en el currículo ("Busca tu tema") y cada uno guarda `gradoId` + `areaId` + su competencia y desempeños; la app lo muestra en Biblioteca → Currículo nacional y en cada herramienta ("A partir de… y del Currículo Nacional de…"). Completo: Inicial, Primaria (1.º–6.º) y Secundaria (1.º–5.º, extraída con OCR del PDF escaneado).
- **Temas al instante (sin fotos ni archivos):** un buscador como el de YouTube; mientras el docente escribe salen temas del currículo y un clic crea el tema con su competencia y desempeños. La IA completa la ficha en segundo plano (`app/temaInstantaneo.ts`), con tiempo límite de 90 s y "Reintentar": ya no hay pantalla de carga.
- **Juegos web** (`apps/web/src/juegos`, ver su README): diecisiete juegos que consumen formas de contenido (retos, parejas, palabras), no temas fijos; entre ellos un Concurso estilo Kahoot y los de mecánica viral para el celular (Vuela cóndor tipo Flappy Bird, Corre cuy tipo Subway Surfers, ¿Verdad o mentira?, Une con flechas y Michi). El docente elige qué practican (el tema o una de 22 habilidades de cálculo generadas sin IA) y ve solo los compatibles, separados en "para la casa (celular)" y "para la clase (proyector)". **Uso real:** el docente (laptop) los manda al WhatsApp de las familias y los niños juegan en el celular de sus papás: `/j/CODIGO`, sin cuenta; cada juego compartido queda en Vercel Blob (`api/juegos-compartidos.ts`, prefijo `juegos/`). Foco en primaria.
- **Sustento curricular (el eje, ver `CLAUDE.md`):** cada juego tiene un icono "i" que muestra, con texto oficial, qué competencia y desempeño abarca el tema y qué parte exacta del desempeño practica el juego (resaltada). Cada nivel de cálculo cita su desempeño grado por grado (`juegos/matematica/curriculo.ts`, 140 citas) y `npm run verificar:curriculo` (dentro de `typecheck`) falla si una no coincide letra por letra. El tema guarda sus desempeños oficiales (`Ficha.curriculo.desempenos`). Las miniaturas muestran el contenido del tema.
- **Resultados de los alumnos:** el niño pone su nombre en un popup la primera vez (sin cuenta; el código viene en el link) y cuando supera su puntaje lo manda a `api/resultados.ts` (Blob, `resultados/CODIGO/ID.json`; solo escribe si mejora, para cuidar las 2.000 escrituras/mes del plan Hobby). El docente lo ve en "Resultados de juegos" del menú, de todos sus temas: alumno, puntaje más alto, estrellas. Para verlos usa una clave que recibió al publicar y que se guarda en su navegador. En `npm run dev`, sin token de Blob, las funciones usan un Blob en memoria.

- **Sesión de aprendizaje** (primera en "¿Qué necesitas para tu clase?"): `api/sesion.ts` + `views/Sesion.tsx`. 45 o 90 min, formato MINEDU (datos, competencia y capacidades oficiales, criterios con cita verificada contra `packages/curriculo` e icono "i", enfoque, momentos con tiempos que suman, ficha de aplicación y escala para 30). Se corrige con un clic, se imprime y se descarga en Word (.doc hecho con el HTML de la hoja). ~35 s, 1 crédito.
- **Canciones que ya existen:** 206 canciones de YouTube para 1.º a 6.º de primaria (Comunicación, Matemática, Ciencia y Tecnología, Personal Social, Inglés, Arte y Cultura, Educación Física) en `apps/web/src/canciones/canciones.json`. Cada grado cita letra por letra un desempeño de su área (lo verifica `npm run typecheck`); la pantalla de Canción las muestra primero, con Ver, Copiar link y la «i».

## Siguiente paso
- **Entrega (domingo 18, 9:00):** `proyecto.md` listo en la raíz; presentación lista en `presentacion/` (falta compartirla por link y llenar las cifras de tracción; lista de espera en 1). Aún no se entrega: `andes project submit --file ./proyecto.md`.
- Backend `/api` con Claude (ficha, letra, examen adaptado, juego): contratos en `apps/web/src/api/types.ts`, endpoints en el README. Cada endpoint debe recibir `ficha.curriculo.desempenos` y devolver, por ítem, la cita textual del desempeño que trabaja (validada contra `packages/curriculo`), para que canción, examen y preguntas del tema tengan el mismo icono "i" que los juegos de cálculo.
- Audio con ElevenLabs, persistencia (biblioteca, créditos, links/QR), pictogramas ARASAAC.
- Juegos: que `/api/juego` cree más preguntas de las que entran en una partida (hoy las del tema se repiten al reintentar; el cálculo ya es procedural), clasificar en grupos y, cuando haya cuentas, pasar la clave de resultados a la cuenta del docente.

## Riesgos
- Hasta el 17-oct, en producción las funciones con IA (`ficha`, `juego`, `examen`, `cancion`) no cargaban (`FUNCTION_INVOCATION_FAILED`) por importar `./_ia` sin `.js`. Arreglado; `npm run typecheck` ahora lo marca (tsconfig de `api/` en NodeNext). Además necesitan `OPENROUTER_API_KEY` en Vercel.
- El `package-lock.json` debe incluir los binarios de Linux (`@rolldown/binding-linux-x64-gnu`, etc.) o el build de Vercel falla. Si npm los omite, regenerarlo con `rm -rf node_modules package-lock.json && npm install`.
- El repo es de Hecze: coordinar antes de pushear cambios de estructura a `main`. Varias sesiones trabajan en paralelo (juegos, tracción): cada una en su rama y luego merge a `main`.
- Vercel Blob (plan Hobby): 2.000 escrituras y listados al mes para todo, lista de espera y juegos juntos; si se pasan, Blob se bloquea 30 días. Los juegos solo escriben al publicar y cuando un alumno mejora su puntaje. Con muchos docentes de verdad, pasar resultados a una base (Upstash Redis) o a un plan pagado.
- Los commits con el autor git de Harold (`harold18m`) no despliegan en Vercel ("must have access to the project"); los de autor `Claude <noreply@anthropic.com>` sí.
- La rama de producción de Vercel aún no es `main`: los push crean previews y producción se publica a mano (o cambiar *Settings → Environments → Production → Branch Tracking*).

## Dónde mirar
- `obsidian/DATOS.md`: cifras con fuente (horas extra del docente, aprendizajes, cuánto pagan, costos de IA).
- `presentacion/`: el deck del pitch (link en su README).
- `obsidian/GTM.md`: tracción para el jurado, quién paga y guiones de TikTok.
- `obsidian/MVP.md`: qué tiene que funcionar para la entrega y qué no hacer.
- `obsidian/MAPA.md`: el producto en una página (flujo, estado de cada pieza, decisiones abiertas).
- `obsidian/VISION.md`: visión y principios del producto.
- `obsidian/HACKATHON.md`: condiciones del evento, entrega y créditos gratis.
- `README.md` de la raíz: páginas, lista de espera, currículo, principios de diseño, endpoints y costos.
- `packages/curriculo/README.md`: fuentes oficiales y formato de los JSON.
