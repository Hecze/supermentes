use edicion::{Demo, EdicionMedia};
use fframes::{CombinedMediaProvider, EncoderOptions, MediaDirectory, MediaProvider, RenderOptions, StaticMediaProvider, Video, cli};
use fframes_skia_renderer::{SkiaFFramesRenderer, SkiaPipelineConcurrencyPolicy, SkiaPipelineConfig, metal::SkiaMetalCtx};
use fframes::cli::clap;
use std::process::ExitCode;

#[derive(Debug, clap::Args)]
struct Nada {}

fn main() -> ExitCode {
    let args = cli::parse::<Nada>();
    let video = Demo::new();
    let estatico = EdicionMedia::prepare().expect("media");
    let carpeta = MediaDirectory::read_folder(std::path::Path::new("clips")).expect("falta clips/: corre primero el bin cortes");
    let clips = carpeta.process_media_source().expect("clips");
    let media = CombinedMediaProvider::from([&estatico as &dyn MediaProvider, &clips]);
    let gpu = SkiaMetalCtx::new(Demo::WIDTH, Demo::HEIGHT).expect("GPU context");
    cli::new(
        &video,
        RenderOptions {
            media: Some(&media),
            video_encoder_options: EncoderOptions {
                preferred_encoder: Some("libx264"),
                codec_params: Some(&[("crf", "18"), ("preset", "slow")]),
                ..Default::default()
            },
            default_font: "Lexend",
            ..Default::default()
        },
    )
    .args(args)
    .backend(
        SkiaFFramesRenderer::new_metal(
            &gpu,
            SkiaPipelineConfig { concurrency_policy: SkiaPipelineConcurrencyPolicy::MaxPerformance, ..Default::default() },
        )
        .expect("skia renderer"),
    )
    .preview(fframes_native_player::cli_preview)
    .run()
}
