# Banco de contenido por tema

Contenido listo para cada tema del Currículo Nacional, para que el docente tenga juegos y canciones **apenas crea el tema**, sin esperar ni gastar en la IA. Hoy cubre **todos los temas de 4.º de primaria** (384, las 10 áreas).

Por tema (`primaria-4/<área>.json`, uno por área; se descarga solo cuando se abre un tema de esa área):

- `cita`: fragmento copiado **letra por letra** de un desempeño oficial del área en el grado, y `competencia` (su número). Es lo que muestra la «i».
- `palabras` (6–8, con pista), `preguntas` (8, con 3 distractores que son errores típicos) y `pares` (6): alimentan los 17 juegos (`juegoDelBanco` las pasa a la forma de `/api/juego`).
- `canciones` (2, con ritmos distintos del Perú: cumbia, huayno, festejo, marinera, saya, valicha, tondero, landó): título, `estilo` para el músico y `letra` con `[Estrofa 1]`, `[Coro]`… Se ven en la pantalla de Canción y suenan con Lyria vía OpenRouter (`api/audio.ts`); el audio se guarda en Blob la primera vez y después sale al instante.

## Verificación

`npm run verificar:curriculo` (corre también en `npm run typecheck`, ver `verificar.ts`) falla si:

- una cita no aparece tal cual en los desempeños del área y grado, o es de otra competencia;
- un tema del banco no está en el currículo, o un tema del currículo de un grado con banco falta en el banco;
- un tema de un grado con banco tiene menos de **2 juegos** o menos de **2 canciones** apenas se crea.

`node scripts/cobertura.mjs primaria-4` da el resumen por grado.

## Cómo se hizo y cómo sumar un grado

Lo escribieron agentes de IA por lotes de hasta 16 temas de una misma área, cada uno con los desempeños oficiales del grado en la mano y un validador (formato, largos, cita letra por letra, distractores distintos, ritmos y coro). Para otro grado: armar los lotes con los temas de `packages/curriculo` (función `temasDe`), generarlos igual y dejar los archivos en `<gradoId>/<área>.json`; el verificador lo exige completo apenas aparece la carpeta.
