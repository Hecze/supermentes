# Exámenes listos para imprimir

Cada tema de un grado con banco (hoy, **4.º de primaria**: 384 temas) trae su examen armado apenas se abre la
herramienta "Examen": gratis, sin esperar a la IA, en A4 y en blanco y negro para la fotocopiadora. También están
todos en Biblioteca → "Exámenes listos".

## La idea: tipos de pregunta con semilla

Un examen no es una lista fija de preguntas. Es una lista de **tipos de pregunta** ("Cuenta el dinero", "Lee el
ábaco", "Une con flechas"…), cada uno con su **semilla** (`ConfigExamen` en `tipos.ts`). Con otra semilla sale el
mismo tipo de pregunta con otros números y otra respuesta:

- **Otra versión:** los mismos tipos, en el mismo orden, con otros números (para otra sección o el próximo año).
- **Fila A y B:** dos versiones en un solo PDF, para que no se copien; la hoja de respuestas trae las dos.
- **Cambiar una pregunta:** solo esa, sin repetir ninguna otra del examen (`clave`).
- La misma configuración arma siempre el mismo examen: el PDF de respuestas cuadra con la versión impresa (cada
  hoja lleva su código, por ejemplo "Versión K7Q2").

## De dónde salen los tipos

- `matematica/*.ts`: tipos con **dibujos y números que cambian**, una situación del Perú y alternativas incorrectas
  que son los errores típicos (olvidar las monedas, saltarse el cero…). Uno por grupo: `numeros.ts` (dinero,
  ábaco, Base Diez, tablero), `calculo.ts` (las prácticas de cálculo de los juegos), `operaciones.ts`,
  `fracciones-medidas.ts`, `regularidad.ts`, `forma.ts` y `datos.ts`. `catalogo.ts` dice a qué temas va cada uno.
- `del-banco.ts`: **para todos los cursos**, con el banco del tema (`apps/web/src/banco`): marcar la correcta,
  "¿Tiene razón?" (revisar la respuesta de un compañero), unir con flechas y completar con la palabra. En cada
  versión cambian las preguntas elegidas y el orden de las alternativas.

Los dibujos son SVG en texto (`dibujos.ts`): los mismos en la pantalla y, pasados a imagen, en el PDF (`pdf.ts`).

## El currículo

Cada tipo de Matemática cita, letra por letra, el desempeño de 4.º que evalúa (`citas`, con su competencia); los
del banco usan la cita del tema. La «i» de cada pregunta muestra "El tema abarca" y "La pregunta abarca" con la
parte exacta del desempeño resaltada, y el PDF de respuestas termina con "Qué evalúa cada reto", citado del
currículo. Un tipo sin cita en un grado no se ofrece en ese grado.

## Verificación

`npm run verificar:curriculo` (también en `npm run typecheck`, ver `verificar.ts`) falla si una cita no aparece tal
cual o es de otra competencia, si un tema del grado no tiene examen, si un tema de Matemática tiene menos de 2 tipos
con dibujos, o si en 300 preguntas por tipo y 25 exámenes por tema (Fila A y B) alguna sale rota: sin texto, con
"NaN", alternativas repetidas, la correcta fuera de rango o un dibujo más ancho que la hoja.

Para mirar los tipos a ojo: `node scripts/muestras-examen.mjs salida.html [filtro] [versiones]`.

## Sumar un tipo o un grado

1. Escribe el tipo en el archivo de su grupo con su cita textual (`TipoPregunta`) y agrégalo a `temas` del grupo.
2. Revisa sus muestras y corre `npm run typecheck`.
3. Para otro grado: primero su banco (`apps/web/src/banco/README.md`); los tipos del banco funcionan solos. Los de
   Matemática se suman con `citas` de ese grado y un grupo en `GRUPOS` de `catalogo.ts`.
