//! Corta los tramos de `pasos.rs` de la toma (`fuente/toma.mp4`) a `clips/`.
//! Uso: cargo run --release --bin cortes -- <carpeta con toma.mp4>
use edicion::{PASOS, TOMA, clip};
use std::{path::PathBuf, process::Command};

fn main() {
    let origen = PathBuf::from(std::env::args().nth(1).expect("falta la carpeta de la toma"));
    std::fs::create_dir_all("clips").unwrap();
    let fuente = origen.join(TOMA);
    for (i, paso) in PASOS.iter().enumerate() {
        let salida = format!("clips/{}", clip(i));
        // Medio segundo extra congelado al final: el último cuadro nunca queda vacío.
        let ok = Command::new("ffmpeg")
            // -t va antes de -i: limita la toma (en segundos de la grabación), no el clip ya acelerado.
            .args(["-v", "error", "-y", "-ss", &paso.desde.to_string(), "-t", &(paso.hasta - paso.desde).to_string(), "-i"])
            .arg(&fuente)
            .args(["-vf", &format!("setpts=PTS/{},tpad=stop_mode=clone:stop_duration=0.5,fps=30,scale=out_range=tv,format=yuv420p", paso.velocidad)])
            .args(["-an", "-c:v", "libx264", "-crf", "12", "-preset", "fast", "-g", "10", "-pix_fmt", "yuv420p", &salida])
            .status()
            .expect("ffmpeg")
            .success();
        assert!(ok, "falló el corte de {salida}");
        println!("{salida}");
    }
}
