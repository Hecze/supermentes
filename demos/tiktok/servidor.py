# Servidor local del grabador y del editor de tomas (http://localhost:5190).
#   python3 servidor.py
# - grabador.html sube cada toma con PUT /subir/<archivo>: el video abre una carpeta toma-N nueva en
#   ~/Downloads/supermentes-tiktok/ y las marcas van a esa misma carpeta.
# - editor.html lista las tomas (GET /tomas), las monta (POST /montar/<toma>) y arma el video final con la
#   portada elegida (POST /portada/<toma>?t=<segundo>).
import http.server, json, os, re, subprocess, sys, urllib.parse

DESTINO = os.path.expanduser('~/Downloads/supermentes-tiktok')
AQUI = os.path.dirname(os.path.abspath(__file__))
FF = os.path.expanduser('~/.webreel/bin/ffmpeg/ffmpeg')  # con drawtext para la portada
FINAL = f'{DESTINO}/supermentes-tiktok-FINAL.mp4'
ultima = None


def tomas():
    nums = sorted(int(m.group(1)) for d in os.listdir(DESTINO) if (m := re.fullmatch(r'toma-(\d+)', d)))
    return [f'toma-{n}' for n in nums]


def portada(toma, t):
    """Portada con el cuadro elegido de la toma cruda y video final = portada (0.1 s) + montaje."""
    d, m = f'{DESTINO}/{toma}', f'{AQUI}/media'
    primera = json.load(open(f'{d}/cara-marcas.json'))['marcas'][0]['texto']
    arriba, abajo = ('7 HORAS DE MÁS', 'a la semana, profe') if 'siete horas' in primera else ('¿CUÁNTO TE DEMORAS', 'preparando una clase?')
    texto = (f"crop=608:1080:656:0,scale=1080:1920,setsar=1,drawbox=x=0:y=0:w=iw:h=ih:color=black@0.15:t=fill,"
             f"drawtext=fontfile={m}/ShantellSans-800.ttf:text='{arriba}':fontsize=104:fontcolor=0xF5C84B:"
             f"borderw=9:bordercolor=0x141A17:x=(w-tw)/2:y=250,"
             f"drawtext=fontfile={m}/Lexend-700.ttf:text='{abajo}':fontsize=66:fontcolor=white:"
             f"borderw=6:bordercolor=0x141A17:x=(w-tw)/2:y=400,"
             f"drawtext=fontfile={m}/Lexend-700.ttf:text='¿Y si fueran 5 minutos?':fontsize=80:fontcolor=white:"
             f"borderw=8:bordercolor=0x141A17:x=(w-tw)/2:y=1380")
    subprocess.run([FF, '-v', 'error', '-y', '-ss', str(t), '-i', f'{d}/cara.mp4', '-frames:v', '1', '-vf', texto,
                    f'{d}/portada.png'], check=True)
    subprocess.run([FF, '-v', 'error', '-y', '-loop', '1', '-t', '0.1', '-framerate', '30', '-i', f'{d}/portada.png',
                    '-i', f'{d}/supermentes-tiktok-cara.mp4', '-filter_complex',
                    '[0:v]format=yuv420p,setsar=1[p];[p][1:v]concat=n=2:v=1:a=0[v];'
                    'anullsrc=r=48000:cl=stereo,atrim=0:0.1[s];[s][1:a]concat=n=2:v=0:a=1[a]',
                    '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-crf', '19', '-preset', 'medium',
                    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', FINAL], check=True)
    subprocess.run(['cp', f'{d}/portada.png', f'{DESTINO}/supermentes-tiktok-FINAL-portada.png'], check=True)


def unir(toma):
    """Une las microtomas (frase-01, frase-02…) en cara.mp4 y escribe las marcas donde empieza cada frase."""
    d = f'{DESTINO}/{toma}'
    guion = json.load(open(f'{d}/guion.json'))
    clips = sorted(f for f in os.listdir(d) if re.fullmatch(r'frase-\d+\.(mp4|webm)', f))
    entradas, filtros, marcas, t = [], [], [], 0.0
    for i, c in enumerate(clips):
        dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0',
                                    f'{d}/{c}'], capture_output=True, text=True, check=True).stdout)
        entradas += ['-i', f'{d}/{c}']
        filtros.append(f'[{i}:v]scale=1920:1080,setsar=1,fps=30,format=yuv420p[v{i}];'
                       f'[{i}:a]aresample=48000,aformat=channel_layouts=stereo[a{i}]')
        f = guion[i]
        marcas.append({'frase': i + 1, 'texto': f['texto'], 've': f['ve'], 'segundo': round(t, 2)})
        t += dur
    filtros.append(''.join(f'[v{i}][a{i}]' for i in range(len(clips))) + f'concat=n={len(clips)}:v=1:a=1[v][a]')
    subprocess.run([FF, '-v', 'error', '-y', *entradas, '-filter_complex', ';'.join(filtros), '-map', '[v]', '-map', '[a]',
                    '-c:v', 'libx264', '-crf', '17', '-preset', 'fast', '-c:a', 'aac', '-b:a', '192k', f'{d}/cara.mp4'],
                   check=True, capture_output=True)
    json.dump({'marcas': marcas, 'microtomas': True}, open(f'{d}/cara-marcas.json', 'w'), ensure_ascii=False, indent=2)


class Manejador(http.server.SimpleHTTPRequestHandler):
    def responder(self, codigo, datos):
        cuerpo = json.dumps(datos).encode()
        self.send_response(codigo)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(cuerpo)))
        self.end_headers()
        self.wfile.write(cuerpo)

    def do_PUT(self):
        global ultima
        u = urllib.parse.urlparse(self.path)
        m = re.fullmatch(r'/subir/([\w.-]+)', u.path)
        if not m: return self.send_error(404)
        nombre = m.group(1)
        pedida = urllib.parse.parse_qs(u.query).get('toma', [None])[0]
        if pedida and re.fullmatch(r'toma-\d+', pedida):
            ultima = pedida
        elif nombre.startswith(('cara.', 'frase-01.')) or ultima is None:
            ultima = f'toma-{max([int(t[5:]) for t in tomas()] or [0]) + 1}'
        os.makedirs(f'{DESTINO}/{ultima}', exist_ok=True)
        with open(f'{DESTINO}/{ultima}/{nombre}', 'wb') as f:
            f.write(self.rfile.read(int(self.headers['Content-Length'])))
        self.responder(200, {'toma': ultima})

    def do_GET(self):
        if self.path == '/tomas':
            lista = []
            for t in tomas():
                d = f'{DESTINO}/{t}'
                if not os.path.exists(f'{d}/cara.mp4'): continue
                lista.append({'toma': t, 'hora': os.path.getmtime(f'{d}/cara.mp4'),
                              'montaje': os.path.exists(f'{d}/supermentes-tiktok-cara.mp4'),
                              'marcas': os.path.exists(f'{d}/cara-marcas.json')})
            return self.responder(200, {'tomas': lista[::-1], 'final': os.path.exists(FINAL)})
        m = re.fullmatch(r'/archivo/(toma-\d+)/([\w.-]+)(\?.*)?', self.path)
        if m:
            return self.enviar(f'{DESTINO}/{m.group(1)}/{m.group(2)}')
        if self.path.startswith('/final-portada'):
            return self.enviar(f'{DESTINO}/supermentes-tiktok-FINAL-portada.png')
        if self.path.startswith('/final'):
            return self.enviar(FINAL)
        return super().do_GET()

    def enviar(self, ruta):
        """Archivo con soporte de Range, para que el <video> pueda adelantar y retroceder."""
        if not os.path.exists(ruta): return self.send_error(404)
        tam = os.path.getsize(ruta)
        rango = re.fullmatch(r'bytes=(\d+)-(\d*)', self.headers.get('Range', ''))
        ini, fin = (int(rango.group(1)), int(rango.group(2) or tam - 1)) if rango else (0, tam - 1)
        fin = min(fin, tam - 1)
        self.send_response(206 if rango else 200)
        self.send_header('Content-Type', 'image/png' if ruta.endswith('.png') else 'video/mp4')
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Cache-Control', 'no-store')
        if rango: self.send_header('Content-Range', f'bytes {ini}-{fin}/{tam}')
        self.send_header('Content-Length', str(fin - ini + 1))
        self.end_headers()
        with open(ruta, 'rb') as f:
            f.seek(ini)
            restante = fin - ini + 1
            try:
                while restante > 0:
                    trozo = f.read(min(1 << 20, restante))
                    self.wfile.write(trozo)
                    restante -= len(trozo)
            except (BrokenPipeError, ConnectionResetError):
                pass

    def do_POST(self):
        u = urllib.parse.urlparse(self.path)
        m = re.fullmatch(r'/(montar|portada|unir)/(toma-\d+)', u.path)
        if not m or not os.path.isdir(f'{DESTINO}/{m.group(2)}'): return self.send_error(404)
        try:
            if m.group(1) == 'unir':
                unir(m.group(2))
            elif m.group(1) == 'montar':
                subprocess.run([sys.executable, f'{AQUI}/montar-cara.py'], check=True, capture_output=True,
                               env={**os.environ, 'TOMA': f'{DESTINO}/{m.group(2)}'})
            else:
                portada(m.group(2), float(urllib.parse.parse_qs(u.query)['t'][0]))
            self.responder(200, {'ok': True})
        except subprocess.CalledProcessError as e:
            self.responder(500, {'error': (e.stderr or b'').decode()[-600:] or str(e)})

    def log_message(self, *a):
        pass


os.chdir(AQUI)
http.server.ThreadingHTTPServer(('127.0.0.1', 5190), Manejador).serve_forever()
