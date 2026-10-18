# Supermentes

**Tu clase de mañana, lista en minutos y con el Currículo Nacional del Perú: juegos, canciones, exámenes y sesiones de aprendizaje.**

- App: https://www.supermentes.app/app
- Repo: https://github.com/Hecze/supermentes
- Equipo: Dropout Hack (Hector Zerrillo y Harold Medrano), track Educación Escolar.

## El problema

Preparar material que enganche a los alumnos toma horas, y sin él los alumnos se distraen. Hoy los docentes compran paquetes de sesiones y fichas por Facebook y WhatsApp. Las herramientas con IA que existen (MagicSchool, SchoolHub) están pensadas para otros países y ninguna trabaja con el Currículo Nacional de Educación Básica (CNEB), que es con lo que el director revisa al docente.

## Para quién

Docentes de primaria del Perú, sobre todo de colegios públicos. Tienen poca experiencia digital y preparan la clase en laptop. Sus alumnos practican en casa en el celular de sus papás.

## Cómo funciona

1. **Busca tu tema** como en YouTube: mientras escribe salen los temas del Currículo Nacional de su grado. Un clic y el tema queda creado con su competencia y sus desempeños oficiales.
2. **Elige lo que necesita** para su clase:
   - **Juego para el celular**: 17 juegos (concurso tipo Kahoot, Vuela cóndor, Corre cuy, ¿Verdad o mentira?, memoria, pupiletras…). Lo manda al grupo de WhatsApp de las familias con un link o un QR y los niños juegan sin cuenta.
   - **Resultados de los alumnos**: el docente ve quién jugó, su mejor puntaje y sus estrellas.
   - **Canción**: 206 canciones que ya existen en YouTube para 1.º a 6.º, o una nueva con ritmo peruano (festejo, huayno, cumbia).
   - **Examen, práctica y balotario** listos para imprimir, como los pidieron los profes: con su clave (respuesta y pasos de cada pregunta), "otra versión", Fila A y B para que no se copien y misceláneas de varios temas.
   - **Sesión de aprendizaje** en el formato del MINEDU, lista para entregar al director.
   - **Crucigrama** con las palabras del tema.
   - **Videos y fichas de su tema** encontrados en internet.
3. Todo se imprime, se baja en PDF o se manda por WhatsApp.

No es un chatbot: se elige y se toca, no se conversa. Una pregunta y un botón por pantalla.

## El currículo es el eje

Un director o un jurado puede preguntar "¿por qué esto cumple el currículo?". Cada juego, canción, pregunta de examen y criterio de la sesión muestra un icono «i» con el desempeño oficial del grado que trabaja, **citado letra por letra**. Un verificador automático falla el build si una cita no aparece tal cual en el currículo: hoy son 886 citas verificadas (cálculo, canciones, banco de temas y exámenes).

## Qué funciona hoy

- **Currículo Nacional completo** como base de datos: Inicial, Primaria 1.º–6.º y Secundaria 1.º–5.º (secundaria extraída con OCR del PDF escaneado del MINEDU).
- **IA real en producción** (Claude): ficha del tema, juego, canción y sesión de aprendizaje, con respuestas validadas contra un esquema, tiempo límite y "Reintentar".
- **4.º de primaria completo sin esperar a la IA**: los 384 temas del currículo traen juegos, 2 canciones y sus hojas (examen, práctica y balotario) listos al instante.
- **Juegos compartidos de verdad**: link `/j/CODIGO` y QR, sin cuenta para el alumno, y resultados para el docente.
- **Landing con lista de espera** real, con enlace para invitar y registro de dónde llega cada docente.

Stack: Vite + React, funciones en Vercel y Vercel Blob para los datos, monorepo con Turborepo. IA: Claude por OpenRouter; búsqueda de videos y fichas con Exa.

## Tracción

- Lista de espera real en la landing (contador público).
- Entrevista con un docente (Isaac): vio la canción «Refranes con cajón» de 4.º y le gustó.

## Limitaciones

- **No hay cuentas**: los temas y la clave de resultados viven en el navegador del docente.
- **El audio de la canción** generada está en pruebas; las canciones de YouTube sí se reproducen.
- **Fuera de 4.º primaria**, el material depende de la IA (segundos de espera) en vez de estar listo al instante.
- **No está probado en un aula real** con alumnos.
- **Modelo de negocio sin validar**: la hipótesis es un plan de S/ 15–20 al mes pagado por Yape, como hoy pagan por fichas en Facebook; después, colegios privados y UGEL.

## Lo que no es

No reemplaza al docente, no diagnostica a ningún alumno y no les pide cuenta ni datos a los alumnos.
