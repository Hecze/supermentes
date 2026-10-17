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
- **Juegos web** (`apps/web/src/juegos`, ver su README): doce juegos que consumen formas de contenido (retos, parejas, palabras), no temas fijos; entre ellos un Concurso estilo Kahoot. El docente elige qué practican (el tema o una de 22 habilidades de cálculo generadas sin IA) y ve solo los compatibles, separados en "para la casa (celular)" y "para la clase (proyector)". **Uso real:** el docente (laptop) los manda al WhatsApp de las familias y los niños juegan en el celular de sus papás: `/j/CODIGO`, sin cuenta; cada juego compartido queda en Vercel Blob (`api/juegos-compartidos.ts`, prefijo `juegos/`). Foco en primaria.

## Siguiente paso
- Backend `/api` con Claude (ficha, letra, examen, juego, adaptación): contratos en `apps/web/src/api/types.ts`, endpoints en el README. Cada generación debe partir de los desempeños de `packages/curriculo` para el `gradoId`/`areaId` del tema.
- Audio con ElevenLabs, persistencia (biblioteca, créditos, links/QR), pictogramas ARASAAC.
- Juegos: clasificar en grupos (necesita que `/api/juego` devuelva grupos) y, cuando haya cuentas, ver los resultados de los alumnos.

## Riesgos
- El `package-lock.json` debe incluir los binarios de Linux (`@rolldown/binding-linux-x64-gnu`, etc.) o el build de Vercel falla. Si npm los omite, regenerarlo con `rm -rf node_modules package-lock.json && npm install`.
- El repo es de Hecze: coordinar antes de pushear cambios de estructura a `main`. Varias sesiones trabajan en paralelo (juegos, tracción): cada una en su rama y luego merge a `main`.
- La rama de producción de Vercel aún no es `main`: los push crean previews y producción se publica a mano (o cambiar *Settings → Environments → Production → Branch Tracking*).

## Dónde mirar
- `obsidian/MVP.md`: qué tiene que funcionar para la entrega y qué no hacer.
- `obsidian/MAPA.md`: el producto en una página (flujo, estado de cada pieza, decisiones abiertas).
- `obsidian/VISION.md`: visión y principios del producto.
- `obsidian/HACKATHON.md`: condiciones del evento, entrega y créditos gratis.
- `README.md` de la raíz: páginas, lista de espera, currículo, principios de diseño, endpoints y costos.
- `packages/curriculo/README.md`: fuentes oficiales y formato de los JSON.
