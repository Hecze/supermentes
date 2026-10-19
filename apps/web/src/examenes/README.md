# Hojas listas para imprimir: examen, práctica y balotario

Cada tema de un grado con banco (hoy, **4.º de primaria**: 384 temas) trae sus hojas armadas apenas se abre la
herramienta "Examen": gratis, sin esperar a la IA, en A4 y en blanco y negro para la fotocopiadora. Parten del tema
abierto en la barra lateral, que ya dice el grado y el curso: no se vuelve a preguntar. Cómo deben verse y por qué,
según los docentes: `obsidian/MATERIALES.md`.

## Una sola hoja, tres usos

Examen, práctica y balotario son **la misma hoja de preguntas** con otro largo y otra forma de imprimirse
(`ConfigHoja` en `tipos.ts`, armada en `armar.ts`):

| | Examen | Práctica | Balotario |
|---|---|---|---|
| Preguntas | ~10 | ~12, de menos a más | ~30 |
| Arriba | Nota | «Recuerda»: la idea y un ejemplo resuelto | "Para el examen del" |
| Espacio para resolver | Sí (recuadro de procedimiento en los problemas) | Sí | No: se resuelve en el cuaderno |
| Extra | Fila A y B | | «Armar examen»: saca el examen del balotario |

- **Tres gestos por pregunta, iguales en las tres:** cambiar (otros números u otra pregunta), **fijar** (ya no
  cambia: ni con «Otra versión» ni en la Fila B; en el balotario, la fijada pasa igualita al examen) y quitar.
- **Dificultad: Fácil, Normal o Difícil**, para toda la hoja (arriba) o para una sola pregunta (los botones − y + de
  cada pregunta). Normal es la pregunta de siempre: con la misma versión sale igualita. Fácil y difícil no son solo
  otros números: menos o más billetes, sin o con canje, distractores más lejanos o del error típico, un paso más
  (el vuelto), datos de más; siempre dentro del desempeño citado (`Contexto.nivel` y `TipoPregunta.niveles` en
  `tipos.ts`; en los problemas, el nivel del problema). La pregunta fijada guarda su dificultad.
- **«+ Tema»** la vuelve una **miscelánea**: muestra los temas del mismo curso y, al buscar, también los de otros
  cursos del grado (es la única vez que aparece otro curso). Cada tema va con su subtítulo (I, II, III…).
- **El encabezado del colegio** (colegio, grado y sección, docente) se escribe directo sobre la hoja y queda guardado
  en el navegador para todas las hojas.
- **Dos PDF** (`pdf.ts`): la hoja del alumno y la **clave**, solo para el docente: una tabla de respuestas de una
  línea para corregir rápido y, por pregunta, los pasos como en la pizarra; al final, qué evalúa cada pregunta,
  citado del currículo. En la pantalla, «Respuestas» marca con una X y muestra los pasos; nunca sale al imprimir.

## La idea: tipos de pregunta con semilla

Una hoja no es una lista fija de preguntas. Es una lista de **tipos de pregunta** ("Cuenta el dinero", "Lee el
ábaco", "Une con flechas"…) de un tema, cada uno con su **semilla**. Con otra semilla sale el mismo tipo de pregunta
con otros números y otra respuesta:

- **Otra versión:** los mismos tipos, en el mismo orden, con otros números (las fijadas no cambian).
- **Fila A y B:** dos versiones en un solo PDF, para que no se copien; la clave trae las dos.
- La misma configuración arma siempre la misma hoja: la clave cuadra con la versión impresa (cada hoja lleva su
  código, por ejemplo "Versión K7Q2").

## De dónde salen las preguntas

- `matematica/*.ts`: tipos con **dibujos y números que cambian**, una situación del Perú y alternativas incorrectas
  que son los errores típicos (olvidar las monedas, saltarse el cero…), cada uno con sus **pasos** para la clave.
  Uno por grupo: `numeros.ts` (dinero, ábaco, Base Diez, tablero), `calculo.ts` (las prácticas de cálculo de los
  juegos), `operaciones.ts`, `fracciones-medidas.ts`, `regularidad.ts`, `forma.ts` y `datos.ts`. `catalogo.ts` dice
  a qué temas va cada uno.
- `problemas/<grado>/<área>.json` (`problemas.ts`): por tema, la **teoría corta** («Recuerda»), un ejemplo resuelto y
  **problemas de tres niveles con sus pasos**, con recuadro de procedimiento como en el libro. Los escribió un modelo
  barato con el tema, sus desempeños oficiales, el banco del tema y el Cuadernillo de Matemática 4 del MINEDU como
  referencia (sin copiarlo), y cada uno pasó controles de aritmética y una resolución a ciegas por otro modelo
  (`scripts/generar-problemas.py`). Hoy: Matemática de 4.º, 685 problemas.
- `del-banco.ts`: **para todos los cursos**, con el banco del tema (`apps/web/src/banco`): marcar la correcta,
  "¿Tiene razón?" (revisar la respuesta de un compañero), unir con flechas y completar con la palabra.

Los dibujos son SVG en texto (`dibujos.ts`): los mismos en la pantalla y, pasados a imagen, en el PDF. Lo que es del
Perú va con **imagen real** (`peru/`, ver su README): los billetes y monedas del BCRP en las preguntas de dinero, y
fotos con licencia libre del cuy, la combi, la papa, el choclo, la chicha morada… en los problemas que hablan de eso.
Lo genérico (un carro, un huevo, una gallina) se queda en dibujo. El PDF incrusta las imágenes y pone sus créditos al
pie de la hoja.

## El currículo

Cada tipo de Matemática cita, letra por letra, el desempeño de 4.º que evalúa (`citas`, con su competencia); los
del banco y los problemas usan la cita del tema. La «i» de cada pregunta muestra "El tema abarca" y "La pregunta
abarca" con la parte exacta del desempeño resaltada, y la clave termina con "Qué evalúa cada pregunta", citado del
currículo. Un tipo sin cita en un grado no se ofrece en ese grado.

## Verificación

`npm run verificar:curriculo` (también en `npm run typecheck`, ver `verificar.ts`) falla si una cita no aparece tal
cual o es de otra competencia, si un tema del grado no tiene hojas, si un tema de Matemática tiene menos de 2 tipos
con dibujos, si una pregunta con números no trae sus pasos (o el último no dice la respuesta), si un problema está
incompleto, si un tipo con dificultad no sale bien en fácil o difícil (o sale casi igual que en normal), o si en 300
preguntas por tipo y 25 hojas por tema (examen, práctica, balotario, misceláneas y el examen que sale del balotario)
alguna sale rota: sin texto, con "NaN", alternativas repetidas, la correcta fuera de rango, casi siempre en la misma
letra o un dibujo más ancho que la hoja.

Para mirar los tipos a ojo: `node scripts/muestras-examen.mjs salida.html [filtro] [versiones]`.

## Sumar un tipo o un grado

1. Escribe el tipo en el archivo de su grupo con su cita textual (`TipoPregunta`) y sus pasos, y agrégalo a `temas`
   del grupo.
2. Revisa sus muestras y corre `npm run typecheck`.
3. Para otro grado: primero su banco (`apps/web/src/banco/README.md`); los tipos del banco funcionan solos. Los de
   Matemática se suman con `citas` de ese grado y un grupo en `GRUPOS` de `catalogo.ts`; los problemas, con
   `scripts/generar-problemas.py`.
