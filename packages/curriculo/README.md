# @supermentes/curriculo

Base de conocimiento de Supermentes: el currículo oficial del Perú por nivel, grado y área, en JSON.

| Archivo | Fuente |
| --- | --- |
| `data/primaria.json` | [Programa Curricular de Educación Primaria](https://www.minedu.gob.pe/curriculo/pdf/programa-curricular-educacion-primaria.pdf) (1.º a 6.º) |
| `data/secundaria.json` | [Programa Curricular de Educación Secundaria](https://www.minedu.gob.pe/curriculo/pdf/programa-curricular-educacion-secundaria.pdf) (1.º a 5.º, edición 2016, RM 649-2016-MINEDU; PDF escaneado, extraído con OCR y revisado contra las imágenes) |

Cada archivo tiene `grados[] → areas[] → competencias[]`, con `capacidades`, el `estandar` del ciclo y los `desempenos` del grado copiados del documento oficial.

Los campos `temas` **no son texto oficial**:
- `areas[].temas`: temas cortos derivados de los desempeños, para que el docente reconozca de qué trata el grado.
- `competencias[].temas`: los temas como los nombran los libros y las sesiones ("El sustantivo y el adjetivo", "El ciclo del agua"), que esa competencia trabaja en el grado. Con ellos el buscador encuentra lo que el docente escribe y sabe a qué competencia pertenece cada tema.

La app (`apps/web/src/curriculo`) carga cada nivel solo cuando se necesita. El backend usará estos mismos archivos para que todo lo que se genere (canciones, juegos, exámenes) parta del currículo del grado y área elegidos.
