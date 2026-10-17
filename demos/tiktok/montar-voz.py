# Versión "voz en off": el video promocional (sin cara) de base y la voz de Harold encima, frase por escena.
# La música del video baja sola cuando él habla (sidechain) y sus frases salen como subtítulos.
#   python3 montar-voz.py   → ~/Downloads/supermentes-tiktok/supermentes-tiktok-VOZ.mp4
# Entradas: el video de WhatsApp (BASE) y las microtomas de la toma 9 (frase-NN.mp4).
import os, re, subprocess

D = os.path.expanduser('~/Downloads/supermentes-tiktok')
BASE = os.path.expanduser(os.environ.get('BASE', '~/Downloads/WhatsApp Video 2026-10-17 at 18.35.21.mp4'))
TOMA = f'{D}/toma-9'
FF = os.path.expanduser('~/.webreel/bin/ffmpeg/ffmpeg')
FUENTES = os.path.dirname(os.path.abspath(__file__)) + '/media'

# (segundo del video base donde entra la voz, microtoma, subtítulo). Escenas del base: gancho 0–3,
# tema 3–7.5, canciones 7.5–15, juegos 15–23, exámenes 23–26, cierre 26–30.
VOCES = [
    (0.3, 1, 'Profe, ¿siete horas de más cada *semana*?'),
    (3.4, 4, 'Eliges tu grado, tu curso y tu *tema*.'),
    (7.8, 6, '¿Quieres una *canción*? En cumbia o en huayno.'),
    (15.4, 8, '¿Un *juego*? Lo juegan desde el celular, sin cuenta.'),
    (23.2, 7, '¿Un *examen*? Con lo que le gusta a tu salón.'),
    (26.4, 11, 'No cuesta nada. Únete en *supermentes.app*.'),
]


def voz(n):
    """Inicio y fin de la voz dentro de la microtoma (sin los silencios de los bordes)."""
    f = f'{TOMA}/frase-{n:02d}.mp4'
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f],
                               capture_output=True, text=True).stdout)
    r = subprocess.run(['ffmpeg', '-i', f, '-vn', '-af', 'silencedetect=n=-32dB:d=0.25', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
    sil = list(zip([float(x) for x in re.findall(r'silence_start: ([\d.]+)', r)],
                   [float(x) for x in re.findall(r'silence_end: ([\d.]+)', r)] + [dur]))
    ini, fin = 0.0, dur
    for s, e in sil:
        if s <= ini + 0.05: ini = max(ini, e)
        if e >= fin - 0.05: fin = min(fin, s)
    return f, max(0, ini - 0.05), min(dur, fin + 0.1)


def grupos(texto, a, b):
    partes, actual = [], []
    for p in texto.split():
        actual.append(p)
        if len(actual) == 3 or p.endswith((',', '?', '.')):
            partes.append(' '.join(actual)); actual = []
    if actual: partes.append(' '.join(actual))
    total, t, out = sum(len(g) for g in partes), a, []
    for g in partes:
        d = (b - a) * len(g) / total
        out.append((t, t + d, g)); t += d
    return out


def hora(s):
    return f'0:{int(s // 60):02d}:{s % 60:05.2f}'


def main():
    tramos = []  # (entra, archivo, desde, hasta, texto)
    for entra, n, texto in VOCES:
        f, a, b = voz(n)
        tramos.append((entra, f, a, b, texto))
    lineas = ['[Script Info]', 'ScriptType: v4.00+', 'PlayResX: 1080', 'PlayResY: 1920', '', '[V4+ Styles]',
              'Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV',
              'Style: Voz,Lexend,76,&H00FFFFFF,&H00141A17,&H00000000,1,1,8,2,2,70,140,380',
              '', '[Events]', 'Format: Layer, Start, End, Style, Text']
    for entra, f, a, b, texto in tramos:
        for ga, gb, g in grupos(texto, entra, entra + (b - a)):
            partes = g.upper().split('*')
            t = ''.join(p if i % 2 == 0 else '{\\c&H4BC8F5&}' + p + '{\\c&HFFFFFF&}' for i, p in enumerate(partes))
            lineas.append(f'Dialogue: 0,{hora(ga)},{hora(gb)},Voz,{{\\fscx75\\fscy75\\t(0,90,\\fscx100\\fscy100)}}{t}')
    with open(f'{D}/voz.ass', 'w') as fh:
        fh.write('\n'.join(lineas) + '\n')

    entradas, filtros = ['-i', BASE], []
    # Video: el base (1080x1200) arriba de un fondo desenfocado de sí mismo, en 1080x1920.
    filtros.append('[0:v]split[a][b];[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,'
                   'boxblur=30:2,eq=brightness=-0.25[fondo];[fondo][b]overlay=0:180,setsar=1,'
                   f'ass={D}/voz.ass:fontsdir={FUENTES},format=yuv420p[v]')
    voces = []
    for i, (entra, f, a, b, _) in enumerate(tramos):
        entradas += ['-i', f]
        ms = int(entra * 1000)
        filtros.append(f'[{i + 1}:a]atrim={a}:{b},asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=stereo,'
                       f'adelay={ms}|{ms}[v{i}]')
        voces.append(f'[v{i}]')
    filtros.append(''.join(voces) + f'amix=inputs={len(voces)}:normalize=0,apad,loudnorm=I=-15:TP=-1.5:LRA=11,asplit[voz][llave]')
    # La música baja ~12 dB mientras habla y vuelve sola después.
    filtros.append('[0:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.9[musica];'
                   '[musica][llave]sidechaincompress=threshold=0.02:ratio=10:attack=15:release=350[musicab];'
                   '[musicab][voz]amix=inputs=2:duration=first:normalize=0[a]')
    salida = f'{D}/supermentes-tiktok-VOZ.mp4'
    subprocess.run([FF, '-v', 'error', '-y', *entradas, '-filter_complex', ';'.join(filtros), '-map', '[v]', '-map', '[a]',
                    '-c:v', 'libx264', '-crf', '19', '-preset', 'medium', '-c:a', 'aac', '-b:a', '192k',
                    '-movflags', '+faststart', '-shortest', salida], check=True)
    for entra, f, a, b, texto in tramos:
        print(f'{entra:5.1f}s  {b - a:4.1f}s  {texto}')
    print(salida)


main()
