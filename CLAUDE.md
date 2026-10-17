# Supermentes

Herramientas de IA para docentes del Perú, hechas para Hack the Andes 2026 (entrega: 18 de octubre de 2026, 9:00 a. m., hora de Lima).

Antes de trabajar, lee:
- `obsidian/VISION.md`: qué construimos, para quién y los principios de diseño.
- `obsidian/MAPA.md`: el producto en una página (flujo, estado de cada pieza, decisiones abiertas).
- `obsidian/ESTADO.md`: dónde quedamos, qué sigue y los riesgos conocidos.
- `obsidian/HACKATHON.md`: condiciones del evento, reto de tracción y créditos gratis.
- `README.md`: páginas, principios de diseño, endpoints y costos.

Cómo trabajamos:
- Varias personas y sesiones de Claude trabajan en paralelo: cada una en su rama y luego merge a `main`. No reescribas historia de `main` (nada de rebase ni force-push).
- Producción: https://www.supermentes.app (Vercel, proyecto `supermentes`). La landing está en `/` y la app en `/app`.
- Todo en español peruano, con palabras del aula y no técnicas: el docente promedio tiene poca experiencia digital y usa laptop.
- Nos centramos en **primaria**. Los alumnos juegan en **el celular de sus papás**: el docente (en laptop) manda el link del juego al grupo de WhatsApp de las familias y los papás le prestan el celular a su hijo o hija. Todo lo que juega el alumno se diseña primero para celular en vertical (ver `apps/web/src/juegos/README.md`).
- Los temas salen del Currículo Nacional (`packages/curriculo`): no se crean temas libres sin respaldo del currículo.
- Al terminar algo importante, actualiza `obsidian/ESTADO.md` (se reemplaza, no se acumula).
