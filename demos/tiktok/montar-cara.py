# Monta la versión con cara al estilo TikTok: Harold a cámara en el gancho y el cierre (con zoom de golpe en
# cada frase), la demo con su cara en un círculo, subtítulos de 2-3 palabras que rebotan, titular en el
# gancho, "whoosh" en cada corte y todo un 10 % más rápido.
#   TOMA=~/Downloads/supermentes-tiktok/toma-5 python3 montar-cara.py   → <toma>/supermentes-tiktok-cara.mp4
# Normalmente lo llama editor.html (vía servidor.py).
# Entradas en ~/Downloads/supermentes-tiktok/: cara.mp4 y cara-marcas.json (del grabador), tomas/*.mp4 y
# supermentes-tiktok.mp4. Los cortes salen solos: cada frase está entre dos marcas del grabador y se recorta
# a donde hay voz (silencedetect), así una toma nueva se monta sin tocar nada.
import json, os, re, subprocess

D = os.path.expanduser('~/Downloads/supermentes-tiktok')
TOMA = os.environ.get('TOMA', D)  # carpeta con cara.mp4 y cara-marcas.json (por defecto, la de arriba)
FF = os.path.expanduser('~/.webreel/bin/ffmpeg/ffmpeg')  # el de Homebrew no trae libass
FUENTES = os.path.dirname(os.path.abspath(__file__)) + '/media'
VELOCIDAD = 1.1

# El guion del grabador, en orden: qué se ve debajo (None = su cara) y el texto (entre * va en amarillo).
# Las frases a cámara van en dos partes para alternar el zoom.
GUION = [
    (None, ['Profe, ¿siete horas de más cada *semana*?', 'Y más de la *mitad*, solo preparando *clases*']),
    ('busqueda', ['Con *Supermentes* eliges tu tema']),
    ('ficha', ['y en segundos tienes tu *clase* lista']),
    ('cancion', ['Una *canción*, en cumbia o en huayno']),
    ('examen', ['Un *examen* con lo que le gusta a tu salón']),
    ('juego', ['Y un *juego* para toda la clase']),
    (None, ['Tu clase de mañana, en *cinco minutos*', 'Únete *gratis* en *supermentes.app*']),
]
DESDE = {'ficha': 3.0}  # la toma de la ficha empieza con la pantalla de carga
TITULAR = (0.0, 3.4, '7 HORAS DE MÁS', 'a la semana')  # gancho arriba, en tiempo del video
CIERRE = (38.2, 3.7)  # tarjeta final del video sin cara: desde, duración


def silencios():
    r = subprocess.run(['ffmpeg', '-i', f'{TOMA}/cara.mp4', '-vn', '-af', 'silencedetect=n=-30dB:d=0.3', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
    inicios = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', r)]
    fines = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', r)]
    return list(zip(inicios, fines + [1e9] * (len(inicios) - len(fines))))


def guion(datos):
    """Las tomas nuevas traen su guion en las marcas (texto y qué se ve); las viejas usan GUION."""
    if 've' not in datos[0]:
        if 'siete horas' in datos[0]['texto']:
            return GUION
        # Primer guion (toma 1): 7 frases, cara al inicio y al final, demo en el medio.
        VISTAS = [None, 'busqueda', 'ficha', 'cancion', 'examen', 'juego', None]
        textos = {m['frase']: m['texto'] for m in datos}
        return [(VISTAS[k - 1], [textos[k]]) for k in sorted(textos)]
    por_frase = {}
    for m in datos:
        por_frase[m['frase']] = (m['ve'], [m['texto']])
    return [por_frase[k] for k in sorted(por_frase)]


def frases():
    """(inicio, fin, toma, texto) de cada frase: entre dos marcas, recortada a donde hay voz."""
    # Si repitió una frase con ←, vale la última vez que se mostró.
    datos = json.load(open(f'{TOMA}/cara-marcas.json'))['marcas']
    ultima = {}
    for m in datos:
        ultima[m['frase']] = m['segundo']
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f'{TOMA}/cara.mp4'],
                               capture_output=True, text=True).stdout)
    sil = silencios()

    def voz(a, b):
        """Recorta [a, b] a la primera y última voz, y devuelve también las pausas internas."""
        ini, fin, pausas = a, b, []
        # Repite hasta que no cambie: un silencio puede terminar a centésimas del borde (un clic al soltar).
        for _ in range(5):
            for s, e in sil:
                if s - 0.15 <= ini < e: ini = e
                if s < fin <= e + 0.15: fin = s
        for s, e in sil:
            if ini < s and e < fin: pausas.append((s, e))
        return max(a, ini - 0.08), min(b, fin + 0.12), pausas

    # OMITIR=9,10 saca frases del montaje (p. ej. una que promete algo que la app ya no hace).
    omitir = {int(x) for x in os.environ.get('OMITIR', '').split(',') if x.strip()}
    salida = []
    for k, (toma, textos) in enumerate(guion(datos)):
        if k + 1 in omitir:
            continue
        a = ultima.get(k + 1, 0.0)
        b = ultima.get(k + 2, dur)
        ini, fin, pausas = voz(a, b)
        if len(textos) == 1:
            salida.append((ini, fin, toma, textos[0]))
        else:
            # Corta en la pausa más larga; si no hay, en proporción al largo del texto.
            if pausas:
                s, e = max(pausas, key=lambda p: p[1] - p[0])
                c1, c2 = s + 0.1, e - 0.05
            else:
                c1 = c2 = ini + (fin - ini) * len(textos[0]) / (len(textos[0]) + len(textos[1]))
            salida += [(ini, c1, toma, textos[0]), (c2, fin, toma, textos[1])]
    return salida


def palabras_en_grupos(texto, a, b):
    """Parte la frase en grupos de 2-3 palabras y les reparte el tiempo según su largo."""
    grupos, actual = [], []
    for p in texto.split():
        actual.append(p)
        if len(actual) == 3 or (len(actual) == 2 and len(' '.join(actual)) > 14) or p.endswith((',', '?', '.')):
            grupos.append(' '.join(actual)); actual = []
    if actual:
        grupos.append(' '.join(actual))
    total = sum(len(g) for g in grupos)
    t, salida = a, []
    for g in grupos:
        dur = (b - a) * len(g) / total
        salida.append((t, t + dur, g)); t += dur
    return salida


def ass(FRASES):
    def hora(s):
        return f'0:{int(s // 60):02d}:{s % 60:05.2f}'

    def color(texto):
        partes = texto.split('*')
        return ''.join(p if i % 2 == 0 else '{\\c&H4BC8F5&}' + p + '{\\c&HFFFFFF&}' for i, p in enumerate(partes))

    lineas = [
        '[Script Info]', 'ScriptType: v4.00+', 'PlayResX: 1080', 'PlayResY: 1920', '',
        '[V4+ Styles]',
        'Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV',
        # Cara: grande al medio. Demo: más abajo y con franja oscura para leerse sobre la app.
        'Style: Cara,Lexend,104,&H00FFFFFF,&H00141A17,&H00000000,1,1,9,3,2,80,80,520',
        'Style: Demo,Lexend,84,&H00FFFFFF,&H28141A17,&H00000000,1,3,18,0,2,80,150,470',
        'Style: Titular,Shantell Sans,118,&H004BC8F5,&H00141A17,&H00000000,1,1,9,3,8,60,60,250',
        'Style: Bajada,Lexend,66,&H00FFFFFF,&H00141A17,&H00000000,1,1,7,2,8,60,60,395',
        '', '[Events]', 'Format: Layer, Start, End, Style, Text',
    ]
    t0 = 0.0
    for a, b, toma, texto in FRASES:
        for ga, gb, grupo in palabras_en_grupos(texto, a, b):
            # Rebote: entra al 75 % y crece al 100 % en 90 ms.
            efecto = '{\\fscx75\\fscy75\\t(0,90,\\fscx100\\fscy100)}'
            texto_ass = efecto + color(grupo.upper() if toma is None else grupo)
            lineas.append(f'Dialogue: 0,{hora(t0 + ga - a)},{hora(t0 + gb - a)},{"Cara" if toma is None else "Demo"},{texto_ass}')
        t0 += b - a
    a, b, titular, bajada = TITULAR
    if 'siete horas' not in FRASES[0][3]:
        titular, bajada = '¿CUÁNTO TE DEMORAS?', 'preparando una clase'
    lineas.append(f'Dialogue: 1,{hora(a)},{hora(b)},Titular,{{\\fscx60\\fscy60\\t(0,140,\\fscx100\\fscy100)}}{titular}')
    lineas.append(f'Dialogue: 1,{hora(a + 0.25)},{hora(b)},Bajada,{{\\fad(120,0)}}{bajada}')
    with open(f'{TOMA}/cara.ass', 'w') as f:
        f.write('\n'.join(lineas) + '\n')
    return t0


def montar(FRASES, cuerpo):
    entradas, filtros, piezas, audios = ['-i', f'{TOMA}/cara.mp4'], [], [], []
    circulo = ('crop=640:640:640:120,scale=340:340,format=rgba,'
               "geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='255*lt(hypot(X-170,Y-170),168)'")
    cara_n = 0
    for i, (a, b, toma, _) in enumerate(FRASES):
        dur = b - a
        filtros.append(f'[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS[a{i}]')
        audios.append(f'[a{i}]')
        if toma is None:
            # Zoom de golpe: una frase en plano normal, la siguiente más cerrada.
            w, h = (608, 1080) if cara_n % 2 == 0 else (512, 910)
            x, y = 960 - w // 2, 0 if cara_n % 2 == 0 else 60
            filtros.append(f'[0:v]trim={a}:{b},setpts=PTS-STARTPTS,crop={w}:{h}:{x}:{y},scale=1080:1920,setsar=1,fps=30[v{i}]')
            cara_n += 1
        else:
            entradas += ['-i', f'{D}/tomas/{toma}.mp4']
            k = len(entradas) // 2 - 1
            d0 = DESDE.get(toma, 0)
            # Zoom lento hacia adentro (de 100 % a ~106 %) para que la pantalla no se vea quieta.
            filtros.append(f'[{k}:v]trim={d0}:{d0 + dur},setpts=PTS-STARTPTS,fps=30,setsar=1,'
                           f'tpad=stop_mode=clone:stop_duration={dur},'
                           f"scale=w='2*trunc(540*(1+0.06*t/{dur}))':h=-2:eval=frame,"
                           f"crop=1080:1920:x='(iw-1080)/2':y='(ih-1920)/3',setsar=1[f{i}]")
            filtros.append(f'[0:v]trim={a}:{b},setpts=PTS-STARTPTS,fps=30,{circulo}[c{i}]')
            filtros.append(f'color=white:s=356x356:d={dur},format=rgba,'
                           f"geq=r=255:g=255:b=255:a='255*lt(hypot(X-178,Y-178),176)'[o{i}]")
            filtros.append(f'[f{i}][o{i}]overlay=W-356-48:190:shortest=1[fo{i}]')
            filtros.append(f'[fo{i}][c{i}]overlay=W-340-56:198:shortest=1,trim=0:{dur}[v{i}]')
        piezas.append(f'[v{i}]')
    n = len(FRASES)
    filtros.append(''.join(piezas) + f'concat=n={n}:v=1:a=0[vcuerpo]')
    filtros.append(f'[vcuerpo]ass={TOMA}/cara.ass:fontsdir={FUENTES},setpts=PTS/{VELOCIDAD}[vrapido]')
    entradas += ['-i', f'{D}/supermentes-tiktok.mp4']
    k = len(entradas) // 2 - 1
    desde, largo = CIERRE
    filtros.append(f'[{k}:v]trim={desde}:{desde + largo},setpts=PTS-STARTPTS,fps=30,setsar=1[vfin]')
    filtros.append('[vrapido][vfin]concat=n=2:v=1:a=0,format=yuv420p[v]')
    # Voz: un 10 % más rápida sin cambiar el tono, normalizada para TikTok.
    filtros.append(''.join(audios) + f'concat=n={n}:v=0:a=1,aformat=sample_rates=48000:channel_layouts=stereo,'
                   f'atempo={VELOCIDAD},loudnorm=I=-14:TP=-1.5:LRA=11[avoz]')
    filtros.append(f'anullsrc=r=48000:cl=stereo,atrim=0:{largo}[afin]')
    filtros.append('[avoz][afin]concat=n=2:v=0:a=1[abase]')
    # "Whoosh" en cada cambio de escena: ruido rosa filtrado que sube y baja (sin archivos externos).
    cortes, t = [], 0.0
    for a, b, toma, _ in FRASES[:-1]:
        t += b - a
        cortes.append(t / VELOCIDAD)
    cortes.append(cuerpo / VELOCIDAD)  # entrada a la tarjeta final
    for j, c in enumerate(cortes):
        ms = max(0, int((c - 0.18) * 1000))
        filtros.append(f'anoisesrc=d=0.38:c=pink:r=48000:a=0.5,highpass=f=500,lowpass=f=6000,'
                       f'afade=t=in:d=0.16,afade=t=out:st=0.18:d=0.2,volume=0.22,'
                       f'aformat=channel_layouts=stereo,adelay={ms}|{ms}[w{j}]')
    filtros.append('[abase]' + ''.join(f'[w{j}]' for j in range(len(cortes))) +
                   f'amix=inputs={len(cortes) + 1}:duration=first:normalize=0[a]')
    salida = f'{TOMA}/supermentes-tiktok-cara.mp4'
    subprocess.run([FF, '-v', 'error', '-y', *entradas, '-filter_complex', ';'.join(filtros),
                    '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19',
                    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', salida], check=True)
    print(salida)


FRASES = frases()
for f in FRASES:
    print(f'{f[0]:6.2f}–{f[1]:6.2f}  {f[2] or "cara":9} {f[3]}')
montar(FRASES, ass(FRASES))
