# Más recursos

`recursos.json` es el catálogo de la sección **Más recursos**: solo material oficial que ya existe en internet, enlazado a su fuente original. Nada inventado ni resumido: si no se encuentra la fuente, no entra. Todos los libros dicen «Todos los derechos reservados»: se enlazan, no se vuelven a subir.

Cada entrada (tipo en `catalogo.ts`):

| Campo | Qué es |
| --- | --- |
| `tipo` | `libro`, `teoria` (fichas por tema), `examen`, `guia` o `norma` |
| `titulo`, `subtitulo` | Como se publicó |
| `fuente` | Quién lo publica (MINEDU, Congreso…) |
| `url`, `pdf` | El enlace principal y el PDF directo. Las páginas de PerúEduca se arman con JavaScript y no se pueden comprobar: ahí el enlace es el PDF |
| `partes` | Si son varios archivos: la prueba con su registro y su manual con la clave, o las fichas de un tema de menos a más (En inicio, En proceso, Logro esperado) |
| `tema` | El tema como lo nombra la fuente (no es texto del currículo): sirve para mostrar primero las fichas del tema abierto |
| `grados`, `areas` | Ids del currículo (`primaria-4`, `matematica`); vacío = sirve para todos |
| `descripcion` | Qué es y para qué le sirve al docente, en una oración |
| `verificado` | Fecha en que se comprobó que el enlace abre |

`npm run typecheck` revisa la forma (campos, enlaces https, ids que existen). `npm run verificar:enlaces` comprueba, con internet, que cada enlace siga abriendo.

## Fuentes (revisadas el 19-oct-2026)

- **Libros y cuadernos:** PerúEduca (MINEDU). Matemática y Comunicación de 1.º a 6.º (urbanos 3.º–6.º, rurales multigrado y cuadernos de autoaprendizaje), Castellano como segunda lengua, tutoría y guías del docente.
- **Fichas por tema:** Refuerzo Escolar 2025–2026 de PerúEduca, Matemática y Comunicación de 2.º a 6.º. Se agrupan por tema con la lista oficial en Excel de cada grado; los desempeños de esa lista son «precisados» por MINEDU y no sirven como cita: las citas salen siempre de `packages/curriculo`.
- **Exámenes:** pruebas diagnósticas de MINEDU (Lectura, Escritura y Matemática, 2.º–6.º) con su registro y su manual, e informes de la Evaluación Muestral 2013 de 6.º con preguntas liberadas.
- **Normas:** gob.pe (MINEDU y Congreso): CNEB, programa de primaria, norma del año escolar 2026, evaluación (RVM 094-2020 y su modificación), convivencia, Reforma Magisterial, tutoría, educación inclusiva y otras vigentes.

## Falta

- **Personal Social y Ciencia y Tecnología:** sus cuadernos solo están en repositorio.minedu.gob.pe, que pide «verificar que eres humano» y no se puede comprobar con un script. Por revisar a mano en el navegador antes de agregarlos:
  - Personal Social 2, cuaderno de autoaprendizaje: https://repositorio.minedu.gob.pe/handle/20.500.12799/8342
  - Ciencia y Tecnología 2, 3 y 4, mi cuaderno de autoaprendizaje: https://repositorio.minedu.gob.pe/handle/20.500.12799/6834, https://repositorio.minedu.gob.pe/handle/20.500.12799/6888, https://repositorio.minedu.gob.pe/handle/20.500.12799/6889
  - Guía docente de los cuadernos de Ciencia y Tecnología: https://repositorio.minedu.gob.pe/handle/20.500.12799/8332
  - Manual del docente de los cuadernos de Personal Social y Ciencia y Tecnología: https://repositorio.minedu.gob.pe/handle/20.500.12799/6406
  - Cuadernos de trabajo urbanos de Matemática 1, 2 y 4 y de Comunicación 1: https://repositorio.minedu.gob.pe/handle/20.500.12799/7861, https://repositorio.minedu.gob.pe/handle/20.500.12799/7862, https://repositorio.minedu.gob.pe/handle/20.500.12799/7864, https://repositorio.minedu.gob.pe/handle/20.500.12799/6836
- **Pruebas liberadas de la ECE** (2.º y 4.º) y de las evaluaciones muestrales recientes: están en umc.minedu.gob.pe, que no respondió desde aquí.
- **Educación Física y Educación Religiosa:** no se encontraron libros oficiales.
