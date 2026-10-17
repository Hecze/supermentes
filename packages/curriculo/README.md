# @supermentes/curriculo

Base de conocimiento de Supermentes: el currículo oficial del Perú por nivel, grado y área, en JSON.

| Archivo | Fuente |
| --- | --- |
| `data/inicial.json` | [Programa Curricular de Educación Inicial](https://www.minedu.gob.pe/curriculo/pdf/programa-curricular-educacion-inicial.pdf) (3, 4 y 5 años) |
| `data/primaria.json` | [Programa Curricular de Educación Primaria](https://www.minedu.gob.pe/curriculo/pdf/programa-curricular-educacion-primaria.pdf) (1.º a 6.º) |
| `data/secundaria.json` | [Programa Curricular de Educación Secundaria](https://www.minedu.gob.pe/curriculo/pdf/programa-curricular-educacion-secundaria.pdf) (1.º a 5.º, PDF escaneado, extraído con OCR) |

Cada archivo tiene `grados[] → areas[] → competencias[]`, con `capacidades`, el `estandar` del ciclo y los `desempenos` del grado copiados del documento oficial. El campo `temas` de cada área **no es texto oficial**: son temas cortos derivados de los desempeños para que el docente reconozca de qué trata el grado.

La app (`apps/web/src/curriculo`) carga cada nivel solo cuando se necesita. El backend usará estos mismos archivos para que todo lo que se genere (canciones, juegos, exámenes) parta del currículo del grado y área elegidos.
