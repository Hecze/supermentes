# Canciones que ya existen

`canciones.json` tiene canciones educativas de YouTube para primaria, que el docente usa como material: las proyecta en clase o manda el link al grupo de WhatsApp de las familias.

Cada entrada:

| Campo | Qué es |
| --- | --- |
| `id` | Id del video de YouTube (se comprobó con oEmbed que existe y se puede insertar). |
| `titulo`, `canal`, `duracion` | Como están en YouTube (el canal, exacto). |
| `idioma` | `es` o `en` (Inglés). |
| `area` | Área del currículo (`comunicacion`, `matematica`…). |
| `grados` | Por grado, una **cita copiada letra por letra** de un desempeño de esa área en ese grado. Solo se ofrece en esos grados. |
| `temas` | Temas de las listas del JSON del currículo (no oficiales): sirven para encontrarla desde el tema del docente. |
| `resumen` | Qué enseña, en una oración. |

`npm run verificar:curriculo` (y `npm run typecheck`) falla si una cita no aparece tal cual en `packages/curriculo`.

## Cómo se armó (2026-10-17)

Búsqueda en YouTube por área y grado, solo canciones con letra que enseñan el tema, para niños, de canales educativos y en español (Inglés en inglés). Cada canción se asignó solo a los grados cuyo desempeño la respalda.

Huecos conocidos (no hay canción buena o ningún desempeño lo respalda; los irá llenando nuestro canal, `obsidian/CANCIONES.md`): cadenas alimenticias, célula, ecosistemas y sistema solar en Ciencia; perímetro, área, medidas, estadística y dinero en Matemática; tipos de texto (cuento, fábula, carta, noticia) y pronombres en Comunicación; símbolos patrios (no figuran en los desempeños de primaria), culturas preíncas y departamentos en Personal Social; arte tradicional peruano en 6.º; postura, equilibrio y juegos cooperativos en Educación Física.

Algunas se eligieron solo por título, canal y vistas porque YouTube bloqueó la lectura de descripciones: conviene revisarlas antes de usarlas en clase.
