# Banco de contenido por tema

Contenido listo para cada tema del Currículo Nacional, para que el docente tenga juegos **apenas crea el tema**, sin esperar ni gastar en la IA. Hoy cubre **todos los temas de 4.º de primaria** (384, las 10 áreas).

Por tema (`primaria-4/<área>.json`, uno por área; se descarga solo cuando se abre un tema de esa área):

- `cita`: fragmento copiado **letra por letra** de un desempeño oficial del área en el grado, y `competencia` (su número). Es lo que muestra la «i».
- `palabras` (6–8, con pista), `preguntas` (8, con 3 distractores que son errores típicos) y `pares` (6): alimentan los 17 juegos (`juegoDelBanco` las pasa a la forma de `/api/juego`).

Canciones no: la app solo muestra las que están en YouTube (`obsidian/CANCIONES.md`).

## Verificación

`npm run verificar:curriculo` (corre también en `npm run typecheck`, ver `verificar.ts`) falla si:

- una cita no aparece tal cual en los desempeños del área y grado, o es de otra competencia;
- un tema del banco no está en el currículo, o un tema del currículo de un grado con banco falta en el banco;
- un tema de un grado con banco tiene menos de **2 juegos** apenas se crea.

`node scripts/cobertura.mjs primaria-4` da el resumen por grado.

## Cómo se hizo y cómo sumar un grado

Lo escribieron agentes de IA por lotes de una misma área, cada uno con los desempeños oficiales del grado en la mano y un validador. Para otro grado, por área:

1. `node scripts/banco-lote.mjs <gradoId> <área>`: los desempeños oficiales numerados por competencia y la lista exacta de temas (con la competencia que les toca).
2. Escribir los temas con ese material y el estilo de 4.º, por partes.
3. `node scripts/validar-banco.mjs <gradoId> <área> <archivo o carpeta> [--parcial]`: formato y largos como los de 4.º, la cita letra por letra en su competencia, todos los temas una vez, la pista sin la palabra, opciones distintas y cuántos juegos arma cada tema con la lógica de la app (en 4.º, 13 a 17).
4. Dejar `<gradoId>/<área>.json` de **todas** las áreas del grado a la vez: el verificador exige el grado completo apenas aparece la carpeta.
