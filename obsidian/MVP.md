---
actualizado: 2026-10-17
---

# MVP para Hack the Andes — y qué no hacer

> Qué tiene que funcionar de verdad el **domingo 18, 9:00 a. m.** y qué queda fuera a propósito.
> El producto completo está en [[MAPA]]; la evaluación, en [[HACKATHON]].

## El criterio
El jurado puntúa **tracción × 6 + esfuerzo técnico × 8 + pitch × 6**, y la organización pide "algo que
funcione de verdad, no una demo". Por eso: un recorrido corto que un docente pueda hacer solo, de punta a
punta, con IA real, desde el link y en una ventana privada.

## El recorrido de la demo
1. El docente busca su tema en el Currículo Nacional (grado, curso, tema). **Listo.**
2. Supermentes arma la **ficha** con Claude. **Listo** (`api/ficha.ts`).
3. Elige qué necesita:
   - **Adaptar examen**: sube su examen de siempre (PDF o foto) y descarga el PDF adaptado: ambientado en lo que le gusta a su clase y/o para quien aprende distinto. **Listo** (`api/examen.ts`, PDF con jsPDF).
   - **Canción**: letra con ritmo peruano **lista** (`api/cancion.ts`); audio con ElevenLabs **pendiente**
     (falta la key).
   - **Juego** con preguntas del tema, compartido por QR a los celulares. Los juegos y el QR funcionan;
     **falta** `api/juego.ts` para que las preguntas del tema salgan de la IA.
4. La landing con lista de espera mide la tracción. **Listo.**

## Lo que falta, en orden
1. **Producción:** Hector carga `ANTHROPIC_API_KEY` y `VITE_API=real` en Vercel. Sin esto, nada de lo
   anterior se ve en el link que abre el jurado.
2. `api/juego.ts` con Claude (preguntas, parejas y palabras del tema).
3. Audio de la canción con ElevenLabs, si llega la key a tiempo. Si no, la demo muestra la letra.
4. Entrega temprana con `andes project submit` y un avance en la bitácora.
5. Presentación y ensayo del pitch de 3 minutos.
6. Recorrer todo en una ventana privada, desde el link de producción.

## Qué no hacer (hasta después del evento)
- **No migrar a Next ni a Mastra.** Vite + funciones de Vercel ya resuelven todo; migrar rompe lo que
  Hector sube en paralelo. Mastra recién si aparece un flujo con forma de agente.
- **La inclusión va dentro de "Adaptar examen"**: ya no es una herramienta aparte (los alumnos no dan exámenes en el celular; el docente quiere su PDF adaptado y listo).
- **No ilustraciones del examen.** Caras, lentas y no cambian la demo (se quitaron).
- **No cuentas, login, créditos en el servidor ni pagos.** Para la demo, todo abierto.
- **No biblioteca compartida ni persistencia.** El currículo ya da la biblioteca que se ve.
- **No audio con "melodías que ya conocen".** Ahí el profe canta; generarlas choca con derechos de autor.
- **No más juegos nuevos.** Los seis que hay alcanzan; mejor que funcionen con el tema.
- **No app móvil.** La web en el celular basta.
