//! El guion del TikTok: qué tramo de la toma entra, con qué texto y dónde se hace zoom.
//! Los tiempos son segundos de `fuente/toma.mp4` (ver `fuente/pasos-relativos.tsv`) y las
//! coordenadas, píxeles CSS de la vista de celular (390x844). En los textos `\n` corta la línea.

#[derive(Debug)]
pub struct Zoom {
    pub desde: f32,
    pub hasta: f32,
    pub x: f32,
    pub y: f32,
    pub escala: f32,
}

#[derive(Debug)]
pub struct Paso {
    pub desde: f32,
    pub hasta: f32,
    pub titulo: &'static str,
    /// Color del plumón que subraya el texto (el de la herramienta en la app).
    pub color: &'static str,
    /// 1 = tiempo real; 2 = el doble de rápido (las esperas y el tipeo se aceleran).
    pub velocidad: f32,
    pub zooms: &'static [Zoom],
}

const fn z(desde: f32, hasta: f32, x: f32, y: f32, escala: f32) -> Zoom {
    Zoom { desde, hasta, x, y, escala }
}

pub const TOMA: &str = "toma.mp4";
pub const FUENTE_W: f32 = 390.0;
pub const FUENTE_H: f32 = 844.0;

pub const GANCHO: &[&str] = &["Profe,", "¿cuánto te", "demoras", "preparando", "una clase?"];
pub const CIERRE: (&str, &str, &str) = ("Crea canciones, juegos y", "exámenes para tu clase en minutos", "Únete gratis: supermentes.app");

const TEMA: &str = "Eliges tu tema del\nCurrículo Nacional";
const FICHA: &str = "La IA arma la ficha\nen segundos";
const CANCION: &str = "Una canción para\nmemorizarlo";
const EXAMEN: &str = "Un examen que sí\nquieren resolver";
const JUEGO: &str = "Un juego para\ntoda la clase";

const AMARILLO: &str = "#ffe45c";
const VERDE: &str = "#5bd69b";
const ROSA: &str = "#ff7d90";
const AZUL: &str = "#8aabff";

const fn p(desde: f32, hasta: f32, velocidad: f32, titulo: &'static str, color: &'static str, zooms: &'static [Zoom]) -> Paso {
    Paso { desde, hasta, titulo, color, velocidad, zooms }
}

pub static PASOS: &[Paso] = &[
    // Abre «Buscar mi tema», elige Matemática, escribe «fracciones» y toca «Fracciones usuales».
    p(1.6, 12.3, 2.0, TEMA, AMARILLO, &[z(4.0, 9.7, 150.0, 240.0, 1.3)]),
    // «Preparar tema» y un segundo de espera…
    p(12.9, 15.0, 1.0, FICHA, VERDE, &[]),
    // …y la ficha ya está: se abre «Revisa lo que entendimos» y se recorre.
    p(26.0, 34.4, 1.7, FICHA, VERDE, &[]),
    // Cumbia y «Crear la canción»; la letra aparece y se recorre.
    p(37.0, 42.6, 1.6, CANCION, ROSA, &[z(37.0, 42.6, 130.0, 410.0, 1.35)]),
    p(53.1, 60.6, 1.5, CANCION, ROSA, &[]),
    // Fútbol, «Más opciones» → «Una misión con niveles» y «Crear el examen»; las preguntas.
    p(66.6, 74.4, 1.8, EXAMEN, AZUL, &[z(66.6, 74.4, 150.0, 520.0, 1.3)]),
    p(89.7, 96.8, 1.4, EXAMEN, AZUL, &[]),
    // Globos: «¡Jugar!», se juega una pregunta y se abre el QR para las familias.
    p(104.1, 110.3, 1.3, JUEGO, VERDE, &[z(104.1, 105.4, 195.0, 450.0, 1.25)]),
    p(110.3, 114.6, 1.2, JUEGO, VERDE, &[]),
];

pub fn clip(i: usize) -> String {
    format!("paso-{:02}.mp4", i + 1)
}
