# Portadas de Más recursos: la primera página de cada PDF de src/recursos/recursos.json, como miniatura en
# public/portadas/<id>.webp, y el campo `portada` en el JSON. Solo hace las que faltan.
# Uso: python3 scripts/portadas.py   (necesita internet, pdftoppm de poppler y Pillow)
# Para no bajar libros de 50 MB, pide solo el inicio y el final del PDF (la portada y el índice del archivo) y
# arma con eso un PDF que pdftoppm puede leer; si no alcanza, pide más o el archivo entero.
import hashlib, json, os, subprocess, tempfile
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageStat

AQUI = os.path.dirname(os.path.abspath(__file__))
JSON = os.path.join(AQUI, '..', 'src', 'recursos', 'recursos.json')
DEST = os.path.join(AQUI, '..', 'public', 'portadas')
os.makedirs(DEST, exist_ok=True)
# PDF cuya primera página es una sola hoja echada (no una carátula con contratapa): no se recortan.
HOJA_ECHADA = {
    'https://repositorios.perueduca.pe/pe-recursos/edures/3f2b52ee-8efa-4b03-af35-cefe83ca2ac4.pdf',  # Estrategia Nacional de Refuerzo Escolar 2025
}


def pdf_de(r):
    if r.get('partes'):
        return r['partes'][0]['url']
    for u in (r['url'], r.get('pdf')):
        if u and ('.pdf' in u.lower() or 'crdownload' in u or 'edures/' in u):
            return u
    return r.get('pdf')


def tam(u):
    h = subprocess.run(['curl', '-sIL', '--max-time', '30', u], capture_output=True, text=True).stdout.lower().splitlines()
    l = [x for x in h if x.startswith('content-length')]
    return int(l[-1].split(':')[1]) if l else 0


def bajar(u, desde, hasta, ruta):
    return subprocess.run(['curl', '-sL', '--max-time', '300', '-r', f'{desde}-{hasta}', '-o', ruta, u]).returncode == 0


def pagina1(pdf, base, ancho):
    subprocess.run(['pdftoppm', '-f', '1', '-l', '1', '-scale-to-x', str(ancho), '-scale-to-y', '-1', '-png', pdf, base], capture_output=True)
    png = next((f'{base}{s}.png' for s in ('-1', '-01', '-001', '-0001') if os.path.exists(f'{base}{s}.png')), None)
    if not png:
        return None
    imagen = Image.open(png).convert('RGB')
    os.remove(png)
    return imagen


def render(pdf, salida, recortar):
    base = salida[:-5]
    imagen = pagina1(pdf, base, 360)
    if imagen is None:
        return False
    # Carátula escaneada entera (contratapa, lomo y tapa): la tapa es la mitad derecha. Los pocos PDF que de verdad
    # empiezan con una hoja echada van en HOJA_ECHADA.
    if recortar and imagen.width > imagen.height * 1.38:
        imagen = pagina1(pdf, base, 720) or imagen
        imagen = imagen.crop((imagen.width // 2, 0, imagen.width, imagen.height))
    # Toda de un color: la tapa no alcanzó a bajarse (quedó en la parte vacía del PDF armado). Se pide más.
    if max(ImageStat.Stat(imagen.convert('L')).stddev) < 2:
        return False
    imagen.save(salida, 'WEBP', quality=72, method=6)
    return True


def portada(r):
    u = pdf_de(r)
    if not u:
        return None
    nombre = hashlib.sha1(u.encode()).hexdigest()[:12] + '.webp'
    salida = os.path.join(DEST, nombre)
    if os.path.exists(salida):
        return f'/portadas/{nombre}'
    n = tam(u)
    with tempfile.TemporaryDirectory() as d:
        pdf = os.path.join(d, 'a.pdf')
        intentos = [(None, None)] if 0 < n <= 15_000_000 else [(6_000_000, 3_000_000), (25_000_000, 8_000_000), (None, None)]
        for cab, cola in intentos:
            if cab is None:
                if n > 150_000_000 or not bajar(u, 0, n - 1 if n else '', pdf):
                    continue
            else:
                if n <= cab + cola or not (bajar(u, 0, cab - 1, f'{d}/c') and bajar(u, n - cola, n - 1, f'{d}/t')):
                    continue
                with open(pdf, 'wb') as f:
                    f.write(open(f'{d}/c', 'rb').read())
                    f.seek(n - cola)
                    f.write(open(f'{d}/t', 'rb').read())
            if render(pdf, salida, u not in HOJA_ECHADA):
                return f'/portadas/{nombre}'
    print('sin portada:', r['titulo'], u, flush=True)
    return None


recursos = json.load(open(JSON))
with ThreadPoolExecutor(4) as ex:
    rutas = list(ex.map(portada, recursos))
for r, ruta in zip(recursos, rutas):
    r.pop('portada', None)
    if ruta:
        # `portada` va después de los enlaces, para que el JSON se lea igual que antes.
        claves = list(r)
        i = max(claves.index(k) for k in ('url', 'pdf', 'partes') if k in r) + 1
        orden = claves[:i] + ['portada'] + claves[i:]
        datos = {**r, 'portada': ruta}
        r.clear()
        r.update({k: datos[k] for k in orden})
json.dump(recursos, open(JSON, 'w'), ensure_ascii=False, indent=1)
print(f'portadas: {sum(1 for r in recursos if r.get("portada"))} de {len(recursos)}')
