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
   - **Sesión de aprendizaje** lista para presentar, en el formato del MINEDU, con cada criterio citado del currículo; se arma al instante con el tema, se ajusta y se imprime o descarga en Word. **En construcción, no debe usarse:** todavía tiene partes que no salen de una norma del MINEDU; sale solo cuando cumpla todas (todo o nada, ver `CLAUDE.md`).
   - **Examen, práctica y balotario** del tema, generados desde cero y listos para imprimir con su clave. **Listo** en 4.º (`apps/web/src/examenes`, sin IA al usarlo).
   - **Canción**: letra con ritmo peruano **lista** (`api/cancion.ts`); audio con ElevenLabs **pendiente**
     (falta la key).
   - **Juego** con preguntas del tema, compartido por QR a los celulares. **Listo** (`api/juego.ts`): preguntas, parejas y palabras del tema con IA; los juegos y el QR ya funcionaban.
4. La landing con lista de espera mide la tracción. **Listo.**

## Lo que falta, en orden
1. **Producción:** Hector carga `OPENROUTER_API_KEY` (la de Harold) y `VITE_API=real` en Vercel. Sin esto, nada de lo
   anterior se ve en el link que abre el jurado.
2. `api/juego.ts` con Claude (preguntas, parejas y palabras del tema).
3. Audio de la canción con ElevenLabs, si llega la key a tiempo. Si no, la demo muestra la letra.
4. Entrega temprana con `andes project submit` y un avance en la bitácora.
5. Presentación y ensayo del pitch de 3 minutos.
6. Recorrer todo en una ventana privada, desde el link de producción.

## Qué no hacer (hasta después del evento)
- **No migrar a Next ni a Mastra.** Vite + funciones de Vercel ya resuelven todo; migrar rompe lo que
  Hector sube en paralelo. Mastra recién si aparece un flujo con forma de agente.
- **No adaptar el examen del docente.** Se quitó (18-oct): nos centramos en generar los materiales que pidió Lucho (`MATERIALES.md`).
- **No ilustraciones del examen.** Caras, lentas y no cambian la demo (se quitaron).
- **Sin créditos ni pagos.** Con cuenta, uso sin límite (19-oct).
- **No biblioteca compartida ni persistencia.** El currículo ya da la biblioteca que se ve.
- **No audio con "melodías que ya conocen".** Ahí el profe canta; generarlas choca con derechos de autor.
- **No más juegos nuevos.** Los seis que hay alcanzan; mejor que funcionen con el tema.
- **No app móvil.** La web en el celular basta.
