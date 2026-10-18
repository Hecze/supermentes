# Entrega — Hack the Andes 2026

Todo lo que se entrega sale de esta carpeta; no se arma de cero. Cierra el domingo 18 de octubre de 2026, 9:00 (Lima).
Se puede reenviar para actualizar hasta el cierre.

| Qué | Dónde | Antes de enviar |
| --- | --- | --- |
| Descripción | `proyecto.md` | Tracción y "qué funciona hoy" al día |
| Deployment | `enlaces.env` → supermentes.app | Abre la landing, `/app` y un `/t/CÓDIGO` |
| GitHub | `enlaces.env` → Hecze/supermentes | Público desde el 18-oct |
| Presentación | supermentes.app/presentacion, armado desde `../presentacion/` | Editar `presentacion/slides/*.html` y hacer push |
| Avances publicados | `avances/` | Ya enviados con `andes project update --file` |

Enviar: `sh submit/enviar.sh` (muestra) y `sh submit/enviar.sh --enviar` (envía).

## Para Hector: cómo cerrar la entrega

Hoy no hay nada entregado (`andes project --output json` → `submission: null`). Todo lo de arriba está listo y verificado
en producción el 18-oct a las ~6:30.

1. Revisa `proyecto.md` y el deck (supermentes.app/presentacion). Para cambiar una diapositiva, edita
   `presentacion/slides/<id>.html` y haz push: se publica sola.
2. `sh submit/enviar.sh` para ver qué se manda, y `sh submit/enviar.sh --enviar` para mandarlo (necesita `andes` con
   sesión iniciada).
3. Se puede reenviar para corregir hasta las 9:00, pero **no se puede retirar** una entrega una vez hecha.

Demo sugerida (notas en `presentacion/slides/demo.html`): «Los dichos populares» de 4.º → Preparar (guía y sesión) →
Juego web, Concurso, «Como tarea» para un salón → el jurado escanea el QR, elige un nombre y responde → Revisar.
