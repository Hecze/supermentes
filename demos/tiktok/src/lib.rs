//! Edición del TikTok de Supermentes (1080x1920, 30 fps, sin audio).
//!
//! Gancho de texto + un tramo de la toma por paso (texto grande arriba, la app en un marco de
//! celular, zoom suave a lo que se toca, fundidos entre pasos) + cierre con el logo. Los tramos los
//! corta `cargo run --release --bin cortes -- fuente` a `clips/`; el guion está en `pasos.rs`.
//! Zona segura de TikTok: nada importante en los 250 px de abajo ni en el borde derecho.
use fframes::{
    AnimateRuntimeInput, AudioMap, Color, Duration, FFramesContext, FFramesSyncedVideoFrame, Frame, Overlap, Scene, Scenes,
    Svgr, SyncVideoFrameInput, Video,
    animation::{AnimationRuntime, Easing},
    include_media_dir,
};
use std::sync::LazyLock;

pub mod pasos;
pub use pasos::{CIERRE, FUENTE_H, FUENTE_W, GANCHO, PASOS, Paso, TOMA, Zoom, clip};

include_media_dir!(pub struct EdicionMedia, "media");

// Colores del tema oscuro de la app (la pizarra con tizas).
const FONDO: &str = "#12201a";
const CUADRICULA: &str = "#1a2c24";
const SUPERFICIE: &str = "#172720";
const LINEA: &str = "#2b3f35";
const TINTA: &str = "#eaefe7";
const SUAVE_TXT: &str = "#a3b3a8";
const MARCADOR: &str = "#ffe45c";
const PLUMONES: [(&str, f32); 5] = [("#ff7d90", 18.0), ("#8aabff", 14.0), ("#5bd69b", 20.0), ("#ffb45e", 12.0), ("#bfa2ff", 16.0)];
const DISPLAY: &str = "Shantell Sans";
const CUERPO: &str = "Lexend";

pub const ANCHO: f32 = 1080.0;
pub const ALTO: f32 = 1920.0;
pub const GANCHO_DUR: f32 = 2.6;
pub const CIERRE_DUR: f32 = 3.4;
/// Fundido entre pasos.
pub const FUNDIDO: f32 = 0.3;

// La app en pantalla: 390x844 CSS escalado y centrado, debajo del texto.
const ESCALA: f32 = 1.72;
const APP_W: f32 = FUENTE_W * ESCALA;
const APP_H: f32 = FUENTE_H * ESCALA;
const APP_X: f32 = (ANCHO - APP_W) / 2.0;
const APP_Y: f32 = 322.0;
const RADIO: f32 = 44.0;

static RESORTE: LazyLock<AnimationRuntime> =
    LazyLock::new(|| AnimationRuntime::new(3.0, &Easing::Spring { mass: 1.0, stiffness: 190.0, damping: 18.0 }));
static SUAVE: LazyLock<AnimationRuntime> =
    LazyLock::new(|| AnimationRuntime::new(0.6, &Easing::CubicBezier(0.16, 1.0, 0.3, 1.0)));

/// 0 → 1 en 0.6 s desde `t`.
fn entra(frame: &Frame, t: f32) -> f32 {
    frame.animate_runtime(AnimateRuntimeInput { on_second: t, from: 0.0, to: 1.0, animation_runtime: &SUAVE })
}

/// Desplazamiento que cae de `d` px a 0 con resorte desde `t`.
fn sube(frame: &Frame, t: f32, d: f32) -> f32 {
    frame.animate_runtime(AnimateRuntimeInput { on_second: t, from: d, to: 0.0, animation_runtime: &RESORTE })
}

fn suave(x: f32) -> f32 {
    let x = x.clamp(0.0, 1.0);
    x * x * x * (x * (x * 6.0 - 15.0) + 10.0)
}

/// Fondo completo de cada escena (pizarra cuadriculada): así los fundidos son un fundido real.
fn fondo() -> Svgr<'static> {
    let mut lineas: Vec<Svgr> = Vec::new();
    let paso = 54.0;
    let mut x = 0.0;
    while x <= ANCHO {
        lineas.push(fframes::svgr!(<rect x={x} y="0" width="2" height={ALTO} fill={CUADRICULA} />));
        x += paso;
    }
    let mut y = 0.0;
    while y <= ALTO {
        lineas.push(fframes::svgr!(<rect x="0" y={y} width={ANCHO} height="2" fill={CUADRICULA} />));
        y += paso;
    }
    fframes::svgr!(<g>
        <rect width={ANCHO} height={ALTO} fill={FONDO} />
        {lineas}
    </g>)
}

/// El logo de la app: cinco plumones en su estuche. `x, y` es la esquina superior izquierda; `s`, la escala
/// (a 1, el estuche mide 40 x 32 px como en la app).
fn logo(x: f32, y: f32, s: f32) -> Svgr<'static> {
    let barras: Vec<Svgr> = PLUMONES
        .iter()
        .enumerate()
        .map(|(i, (color, alto))| {
            let bx = 6.0 + i as f32 * 6.5;
            fframes::svgr!(<rect x={bx} y={28.0 - alto} width="4" height={*alto} rx="2" fill={*color} />)
        })
        .collect();
    fframes::svgr!(<g transform={format!("translate({x} {y}) scale({s})")}>
        <rect x="0" y="0" width="44" height="32" rx="8" fill={SUPERFICIE} stroke={LINEA} stroke-width="1.2" />
        {barras}
    </g>)
}

pub struct Demo {
    gancho: Gancho,
    pasos: Vec<PasoScene>,
    cierre: Cierre,
}

impl Default for Demo {
    fn default() -> Self {
        Self::new()
    }
}

impl Demo {
    pub fn new() -> Self {
        let pasos = PASOS
            .iter()
            .enumerate()
            .map(|(i, paso)| PasoScene {
                paso,
                clip: clip(i),
                // Si el texto sigue igual que en el paso anterior no se vuelve a animar.
                titulo_nuevo: i == 0 || PASOS[i - 1].titulo != paso.titulo,
            })
            .collect();
        Self { gancho: Gancho, pasos, cierre: Cierre }
    }
}

impl std::fmt::Debug for Demo {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("Demo")
    }
}

impl Video for Demo {
    const FPS: usize = 30;
    const WIDTH: usize = 1080;
    const HEIGHT: usize = 1920;
    const BACKGROUND_COLOR: Color = Color::BLACK;

    fn duration(&self) -> Duration<'_> {
        Duration::Auto
    }

    fn audio(&self) -> AudioMap<'_> {
        AudioMap::none()
    }

    fn define_scenes(&self) -> Scenes<'_> {
        let mut v: Vec<&dyn Scene> = vec![&self.gancho];
        v.extend(self.pasos.iter().map(|p| p as &dyn Scene));
        v.push(&self.cierre);
        Scenes::from(v)
    }

    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        fframes::svgr!(
            <svg xmlns="http://www.w3.org/2000/svg" width={ANCHO} height={ALTO} viewBox={format!("0 0 {ANCHO} {ALTO}")}>
                <rect width={ANCHO} height={ALTO} fill={FONDO} />
                {ctx.render_scenes(&frame)}
            </svg>
        )
    }
}

/// 0–2.6 s: la pregunta grande, línea por línea. «¿cuánto te demoras» va resaltado con plumón.
#[derive(Debug)]
struct Gancho;

impl Scene for Gancho {
    fn name(&self) -> &'static str {
        "Gancho"
    }

    fn duration(&self) -> Duration<'_> {
        Duration::Seconds(GANCHO_DUR)
    }

    fn render_frame<'a>(&'a self, frame: Frame, _ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let tam = 128.0;
        let alto_linea = 150.0;
        let y0 = 860.0 - alto_linea * (GANCHO.len() as f32 - 1.0) / 2.0;
        let lineas: Vec<Svgr> = GANCHO
            .iter()
            .enumerate()
            .map(|(i, l)| {
                let t = 0.05 + i as f32 * 0.12;
                let y = y0 + i as f32 * alto_linea;
                // Plumón amarillo debajo de «¿cuánto te» y «demoras».
                let resaltar = i == 1 || i == 2;
                let ancho_plumon = l.chars().count() as f32 * tam * 0.56 * suave((frame.seconds() - t - 0.35) / 0.4);
                let plumon = if resaltar {
                    fframes::svgr!(<rect x={ANCHO / 2.0 - ancho_plumon / 2.0} y={y - tam * 0.38} width={ancho_plumon.max(0.1)} height={tam * 0.5} rx="14" fill={MARCADOR} opacity="0.32" />)
                } else {
                    Svgr::empty()
                };
                fframes::svgr!(
                    <g opacity={entra(&frame, t)} transform={format!("translate(0 {})", sube(&frame, t, 60.0))}>
                        {plumon}
                        <text x={ANCHO / 2.0} y={y} font-family={DISPLAY} font-size={tam} font-weight="800" letter-spacing="-2" fill={TINTA} text-anchor="middle">{l.to_string()}</text>
                    </g>
                )
            })
            .collect();
        fframes::svgr!(<g>{fondo()}{lineas}</g>)
    }
}

/// Cierre: logo, nombre, la frase y el llamado a unirse.
#[derive(Debug)]
struct Cierre;

impl Scene for Cierre {
    fn name(&self) -> &'static str {
        "Cierre"
    }

    fn duration(&self) -> Duration<'_> {
        Duration::Seconds(CIERRE_DUR)
    }

    fn overlap(&self) -> Overlap {
        Overlap::Previous(FUNDIDO)
    }

    fn render_frame<'a>(&'a self, frame: Frame, _ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let t0 = FUNDIDO;
        let fin = CIERRE_DUR + FUNDIDO;
        let visible = entra(&frame, 0.0).min(1.0 - suave((frame.seconds() - (fin - 0.4)) / 0.4));
        let cx = ANCHO / 2.0;
        let s = 5.0 * (0.85 + 0.15 * entra(&frame, t0));
        let logo_y = 520.0 + sube(&frame, t0, 40.0);
        let pill_w = 860.0;
        let pill_y = 1290.0;
        fframes::svgr!(
            <g opacity={visible} text-anchor="middle">
                {fondo()}
                <g opacity={entra(&frame, t0)}>{logo(cx - 22.0 * s, logo_y, s)}</g>
                <g opacity={entra(&frame, t0 + 0.15)} transform={format!("translate(0 {})", sube(&frame, t0 + 0.15, 50.0))}>
                    <text x={cx} y="900" font-family={DISPLAY} font-size="132" font-weight="800" letter-spacing="-3" fill={TINTA}>{"Supermentes"}</text>
                </g>
                <g opacity={entra(&frame, t0 + 0.35)} transform={format!("translate(0 {})", sube(&frame, t0 + 0.35, 40.0))}>
                    <text x={cx} y="1050" font-family={CUERPO} font-size="52" font-weight="700" fill={TINTA}>{CIERRE.0}</text>
                    <text x={cx} y="1120" font-family={CUERPO} font-size="52" font-weight="700" fill={TINTA}>{CIERRE.1}</text>
                </g>
                <g opacity={entra(&frame, t0 + 0.6)} transform={format!("translate(0 {})", sube(&frame, t0 + 0.6, 40.0))}>
                    <rect x={cx - pill_w / 2.0} y={pill_y} width={pill_w} height="120" rx="60" fill={MARCADOR} />
                    <text x={cx} y={pill_y + 78.0} font-family={CUERPO} font-size="50" font-weight="700" fill={FONDO}>{CIERRE.2}</text>
                </g>
                <text x={cx} y="1560" font-family={CUERPO} font-size="34" font-weight="500" fill={SUAVE_TXT} opacity={entra(&frame, t0 + 0.9)}>{"Para docentes del Perú · Currículo Nacional"}</text>
            </g>
        )
    }
}

/// Un tramo de la toma con su texto y su zoom.
#[derive(Debug)]
struct PasoScene {
    paso: &'static Paso,
    clip: String,
    titulo_nuevo: bool,
}

impl PasoScene {
    /// Escala y desplazamiento (en px de la tarjeta) en el segundo `t` de la toma.
    fn camara(&self, t: f32) -> (f32, f32, f32) {
        let k = APP_W / FUENTE_W;
        for z in self.paso.zooms {
            if t < z.desde || t > z.hasta {
                continue;
            }
            let p = suave((t - z.desde) / 0.6).min(1.0 - suave((t - (z.hasta - 0.5)) / 0.5));
            let s = 1.0 + (z.escala - 1.0) * p.clamp(0.0, 1.0);
            // Sin mostrar bordes: el desplazamiento queda entre (1 - s) * tamaño y 0.
            let ox = (APP_W / 2.0 - s * z.x * k).clamp((APP_W - s * APP_W).min(0.0), 0.0);
            let oy = (APP_H / 2.0 - s * z.y * k).clamp((APP_H - s * APP_H).min(0.0), 0.0);
            return (s, ox, oy);
        }
        (1.0, 0.0, 0.0)
    }

    fn titulo<'a>(&'a self, frame: &Frame) -> Svgr<'a> {
        let t0 = FUNDIDO * 0.5;
        let (op, dy) = if self.titulo_nuevo { (entra(frame, t0), sube(frame, t0, 30.0)) } else { (1.0, 0.0) };
        let tam = 64.0;
        let lineas: Vec<&str> = self.paso.titulo.split('\n').collect();
        let n = lineas.len();
        let textos: Vec<Svgr> = lineas
            .iter()
            .enumerate()
            .map(|(i, l)| {
                let y = 200.0 + i as f32 * 76.0;
                // La última línea lleva el plumón de la herramienta, que se dibuja al entrar.
                let plumon = if i == n - 1 {
                    let p = if self.titulo_nuevo { suave((frame.seconds() - t0 - 0.25) / 0.45) } else { 1.0 };
                    let w = l.chars().count() as f32 * tam * 0.54 * p;
                    fframes::svgr!(<rect x={ANCHO / 2.0 - w / 2.0} y={y - tam * 0.3} width={w.max(0.1)} height={tam * 0.42} rx="12" fill={self.paso.color} opacity="0.35" />)
                } else {
                    Svgr::empty()
                };
                fframes::svgr!(<g>
                    {plumon}
                    <text x={ANCHO / 2.0} y={y} font-family={DISPLAY} font-size={tam} font-weight="800" letter-spacing="-1.5" fill={TINTA} text-anchor="middle">{l.to_string()}</text>
                </g>)
            })
            .collect();
        fframes::svgr!(<g opacity={op} transform={format!("translate(0 {dy})")}>{textos}</g>)
    }
}

impl Scene for PasoScene {
    fn name(&self) -> &'static str {
        "Paso"
    }

    fn duration(&self) -> Duration<'_> {
        Duration::Seconds((self.paso.hasta - self.paso.desde) / self.paso.velocidad - FUNDIDO)
    }

    fn overlap(&self) -> Overlap {
        Overlap::Previous(FUNDIDO)
    }

    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let entrada = suave(frame.seconds() / FUNDIDO);
        let input = SyncVideoFrameInput { start_from: 0.0, looping: false, editor_fallback_image: None };
        let imagen = match frame.get_synced_video_frame(ctx, &self.clip, &input) {
            Some(v) => {
                let img = v.into_image();
                let (s, ox, oy) = self.camara(self.paso.desde + frame.seconds() * self.paso.velocidad);
                // La imagen se declara ya ampliada: con un `scale` se rasterizaría al tamaño de la tarjeta y se vería blanda.
                fframes::svgr!(
                    <image href={img.href()} x={ox} y={oy} width={APP_W * s} height={APP_H * s} preserveAspectRatio="none" />
                )
            }
            None => Svgr::empty(),
        };
        let marco = 12.0;
        fframes::svgr!(
            <g opacity={entrada}>
                {fondo()}
                {self.titulo(&frame)}
                <g transform={format!("translate({APP_X} {APP_Y})")}>
                    <defs>
                        <clipPath id="tarjeta"><rect width={APP_W} height={APP_H} rx={RADIO} /></clipPath>
                    </defs>
                    <rect x={-marco - 4.0} y={-marco + 22.0} width={APP_W + 2.0 * marco + 8.0} height={APP_H + 2.0 * marco} rx={RADIO + marco} fill="#000" opacity="0.5" />
                    <rect x={-marco} y={-marco} width={APP_W + 2.0 * marco} height={APP_H + 2.0 * marco} rx={RADIO + marco} fill="#0b1510" stroke={LINEA} stroke-width="3" />
                    <g clip-path="url(#tarjeta)">
                        <rect width={APP_W} height={APP_H} fill={SUPERFICIE} />
                        {imagen}
                    </g>
                </g>
            </g>
        )
    }
}
