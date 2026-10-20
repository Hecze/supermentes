---
actualizado: 2026-10-20
---

# La sesión de aprendizaje y la norma del MINEDU

> Para qué es: el docente hace la sesión porque el Estado se la exige y solo quiere cumplir (no le pagan esas horas;
> muchos la sacan de ChatGPT con un formato que no cuadra). Le damos una que pueda presentar tal cual; quien quiera la
> baja en Word y la edita. Regla en `CLAUDE.md`. El código: `apps/web/src/sesion/` y `apps/web/src/views/Sesion.tsx`.

## Lo que dice la norma

- **No hay un formato obligatorio.** Programa Curricular de Primaria: «Sin importar los esquemas o estructuras que la
  planificación tenga, es importante concebir una lógica al planificar»; la planificación «No debe ser rígida». Por
  eso **seguimos a las sesiones que publica el MINEDU**: sus partes, su orden y cómo nombran cada paso.
- **Elementos básicos** (cartilla de planificación 2017): título, propósitos (competencias, desempeños y enfoques
  transversales), preparación («¿Qué necesitamos hacer antes de la sesión? y ¿qué recursos o materiales se
  utilizarán…?») y momentos («Inicio - desarrollo - cierre»).
- **Criterios de evaluación** (RVM 094-2020, 5.1.1.1): «se elaboran a partir de los estándares y sus desempeños […] y
  se deben ajustar a la situación o problema a enfrentar». Las sesiones de ejemplo ponen los desempeños y los evalúan
  con el instrumento del anexo; así lo hacemos.
- **El evaluador observa la clase, no el documento** (rúbricas de observación 2025) y penaliza que el docente solo
  explique y haga practicar ejercicios tipo.

## Cómo se arma hoy y de dónde sale cada parte

Las sesiones de ejemplo son las de primaria del MINEDU (unidades 2017),
https://www.minedu.gob.pe/curriculo/pdf/unidades-primaria/ (por ejemplo `cuarto-grado/cuarto-grado-u1-s7.pdf`).

| Parte | Fuente |
|---|---|
| «Grado: 4.º de primaria» y «Unidad didáctica ___ - sesión ___» | Encabezado de las sesiones de ejemplo. |
| «Título:» | Sesiones de ejemplo; cartilla 2017 (a partir de la actividad principal). |
| 1. Propósitos y evidencias de aprendizaje: «Competencias/capacidades \| Desempeños \| ¿Qué nos dará evidencias de aprendizaje?» | Sesiones de ejemplo. Competencia, capacidades y desempeños, tal cual `packages/curriculo`. |
| Instrumento «Escala de valoración (Anexo 1)» | Programa Curricular («escalas de valoración»); sesiones de Arte y Cultura de 4.º. |
| «Enfoques transversales \| Actitudes o acciones observables» | Sesiones de ejemplo. Las 7 actitudes se copiaron tal cual del CNEB, pp. 22-29 (`sesion/enfoques.ts`); el docente elige el de su unidad; por defecto, orientación al bien común (el que más usan las de 4.º). |
| 2. Preparación de la sesión, con sus dos preguntas | Sesiones de ejemplo y cartilla 2017. |
| 3. Momentos: inicio, desarrollo y cierre con «Tiempo aproximado» | Sesiones de ejemplo: 10/25/10 en 45 min (Arte, sesión 2) y 10/70/10 en 90 min (la mayoría). |
| Agrupamientos «En grupo clase», «En grupos pequeños»… | Sesiones de ejemplo. |
| Inicio: saludo, saberes previos, propósito, en qué se fijará el docente, normas de convivencia | Sesiones de ejemplo (s7: «Recuerda, junto con los estudiantes, las normas de convivencia…»); cartilla 2017 y RVM 094 (comunicar los criterios). |
| Desarrollo | Según el área y la competencia, abajo. |
| Cierre: propósito, recuento, reflexión, aspectos positivos | Sesiones de ejemplo (quinto s9, Arte s1, cuarto s2); cartilla 2017. |
| 4. Reflexiones sobre el aprendizaje (tres preguntas) | Tal cual las sesiones de ejemplo. |
| Anexo 1: «Escala de valoración para la competencia…», «Desempeños del grado», «Nombres y apellidos», «Nunca / A veces / Siempre» | Tercer grado, unidad 1, sesión 14. |

**Desarrollo por área y competencia** (`sesion/procesos.ts`; cada forma guarda los enlaces de las sesiones que sigue):

| Forma | Sesiones del MINEDU que sigue |
|---|---|
| Matemática (todas las competencias): familiarización con el problema, búsqueda y ejecución de estrategias, socialización de representaciones, formalización y reflexión, otros problemas | cuarto s7 y s8; quinto s11 y s12 |
| Comunicación, «Lee»: antes, durante y después de la lectura | cuarto s4 y s16; quinto s3 |
| Comunicación, «Escribe»: planificación, escritura y revisión | quinto s8 y s9 |
| Comunicación, «Se comunica oralmente»: antes, durante y después | cuarto s3 (asamblea); quinto s2 |
| Ciencia y Tecnología, «Indaga»: problema, hipótesis, plan de acción, datos, socialización | cuarto s13 y s14; quinto s19 |
| Personal Social, «Construye su identidad» y «Convive y participa» | cuarto s1, s2 y s5; quinto s1 y s4 |
| Arte y Cultura, «Aprecia» y «Crea proyectos» | Arte de 4.º, sesiones 1 y 2 |
| Educación Física, «Interactúa a través de sus habilidades sociomotrices» | Educación Física de 4.º, sesiones 1 y 2 |

**Con aviso «formato impreciso»** (no encontramos una sesión de ejemplo del MINEDU; el desarrollo es general):
Inglés, Educación Religiosa, Castellano como segunda lengua; en Ciencia y Tecnología, «Explica el mundo físico» y
«Diseña y construye soluciones tecnológicas»; en Personal Social, las de historia, espacio y ambiente y recursos
económicos; en Educación Física, motricidad y vida saludable; y toda la secundaria (falta revisar sus sesiones).
Matemática usa la misma forma en sus cuatro competencias porque las sesiones de ejemplo son de dos de ellas (forma y
datos) y siguen el mismo enfoque del área.

## Sin IA: lo que cambia según el tema

La sesión no llama a la IA (para no gastar): se arma con el currículo y con lo que ya existe del tema
(`apps/web/src/sesion/contexto.ts`). Donde hay banco (hoy 4.º de primaria), los saberes previos llevan una pregunta del
tema; en Matemática, el banco de problemas pone la situación problemática del inicio (un problema de nivel medio), la
idea que se formaliza y otro problema para trasladar lo aprendido. Sin banco, esos pasos quedan generales.

## Lo que se quitó (no tenía fuente)

Datos informativos (institución, docente, fecha), «Motivación» y «Conflicto cognitivo» como pasos fijos, cantidades
(«resuelven un ejercicio»), tarea, referencias, ficha de aplicación, el «qué le gusta a tu salón» y los criterios
copiados en una columna aparte. La revisión del 19-oct, parte por parte, está en el historial de esta nota.

## Fuentes revisadas

- CNEB: https://www.minedu.gob.pe/curriculo/pdf/curriculo-nacional-de-la-educacion-basica.pdf
- Programa Curricular de Educación Primaria: https://www.minedu.gob.pe/curriculo/pdf/programa-curricular-educacion-primaria.pdf
- RVM 094-2020-MINEDU: https://cdn.www.gob.pe/uploads/document/file/662983/RVM_N__094-2020-MINEDU.pdf (la RVM 048-2024 la modifica en promoción y registro, no en lo citado).
- Cartilla de planificación curricular (2017, «documento de trabajo en proceso de validación»): https://www.minedu.gob.pe/curriculo/pdf/cartilla-planificacion-curricular.pdf
- Sesiones de primaria del MINEDU: https://www.minedu.gob.pe/curriculo/pdf/unidades-primaria/
- Rúbricas de observación de aula 2025: https://evaluaciondocente.perueduca.pe/media/11748537639Instructivo-para-la-aplicaci%C3%B3n.pdf
