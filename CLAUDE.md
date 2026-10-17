# Supermentes

Herramientas de IA para docentes del Perú, hechas para Hack the Andes 2026 (entrega: 18 de octubre de 2026, 9:00 a. m., hora de Lima).

Antes de trabajar, lee:
- `obsidian/VISION.md`: qué construimos, para quién y los principios de diseño.
- `obsidian/ESTADO.md`: dónde quedamos, qué sigue y los riesgos conocidos.
- `obsidian/HACKATHON.md`: condiciones del evento, reto de tracción y créditos gratis.
- `README.md`: páginas, principios de diseño, endpoints y costos.

Cómo trabajamos:
- Varias personas y sesiones de Claude trabajan en paralelo: cada una en su rama y luego merge a `main`. No reescribas historia de `main` (nada de rebase ni force-push).
- Producción: https://www.supermentes.app (Vercel, proyecto `supermentes`). La landing está en `/` y la app en `/app`.
- Todo en español peruano, con palabras del aula y no técnicas: el docente promedio tiene poca experiencia digital y usa laptop.
- Los temas salen del Currículo Nacional (`packages/curriculo`): no se crean temas libres sin respaldo del currículo.
- Al terminar algo importante, actualiza `obsidian/ESTADO.md` (se reemplaza, no se acumula).
