"""Banco de problemas por tema (4.º primaria, Matemática) con Gemini y controles contra la alucinación.

Por tema:
  1. Contexto: desempeños oficiales de su competencia, lo que ya trae el banco y páginas del Cuadernillo de
     Matemática 4 (MINEDU) sobre ese tema, como referencia de estilo y nivel (no se copian).
  2. Gemini (modelo barato) propone teoría corta, un ejemplo resuelto y problemas con pasos, nivel y una
     expresión de verificación.
  3. Controles: formato, respuesta dentro de las alternativas, la expresión calcula la respuesta, el último paso
     dice la respuesta, números de 4.º (hasta 4 cifras), sin repetidos.
  4. Otro modelo resuelve a ciegas cada problema; si no llega a la misma respuesta, se descarta.
Uso: CUADERNILLO=<ruta del PDF del Cuadernillo de Matemática 4> AI_GATEWAY_API_KEY=… \
       python3 scripts/generar-problemas.py src/examenes/problemas/primaria-4/matematica.json [tema1 tema2 ...]
El cuadernillo (MINEDU, 2023) no se sube al repo: solo se lee para darle contexto al modelo.
"""
import json, os, re, sys, urllib.request, concurrent.futures as cf, time, subprocess
from fractions import Fraction

AQUI = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(AQUI, '..', '..', '..'))
PDF = os.environ.get('CUADERNILLO', os.path.join(AQUI, 'mat4.pdf'))
GENERADOR = 'google/gemini-3.5-flash-lite'
RESOLVEDOR = 'google/gemini-3.1-flash-lite'

curr = json.load(open(f'{REPO}/packages/curriculo/data/primaria.json'))
area = next(a for g in curr['grados'] if g['id'] == 'primaria-4' for a in g['areas'] if a['id'] == 'matematica')
banco = json.load(open(f'{REPO}/apps/web/src/banco/primaria-4/matematica.json'))

# Páginas del cuadernillo
paginas = []
n_pag = int(re.search(r'Pages:\s+(\d+)', subprocess.run(['pdfinfo', PDF], capture_output=True, text=True).stdout)[1])
for p in range(1, n_pag + 1):
    t = subprocess.run(['pdftotext', '-layout', '-f', str(p), '-l', str(p), PDF, '-'], capture_output=True, text=True).stdout
    paginas.append(re.sub(r'[ \t]+', ' ', t))


def plano(t):
    import unicodedata
    return ''.join(c for c in unicodedata.normalize('NFD', t.lower()) if unicodedata.category(c) != 'Mn')


VACIAS = set('de la el los las y en con a para por del al un una sus su que o e se lo como mas menos'.split())


def referencias(tema, b):
    claves = {w[:6] for w in re.findall(r'[a-z]{4,}', plano(tema + ' ' + ' '.join(p['palabra'] for p in b['palabras']))) if w not in VACIAS}
    puntos = []
    for i, pg in enumerate(paginas):
        tp = plano(pg)
        puntos.append((sum(tp.count(k) for k in claves), i))
    mejores = [i for s, i in sorted(puntos, reverse=True)[:2] if s >= 3]
    return [(i + 1, paginas[i][:3500]) for i in mejores]


def llamar(modelo, prompt, intentos=3):
    body = {"model": modelo, "temperature": 0.4, "response_format": {"type": "json_object"},
            "messages": [{"role": "user", "content": prompt}]}
    err = ''
    for k in range(intentos):
        try:
            req = urllib.request.Request("https://ai-gateway.vercel.sh/v1/chat/completions", data=json.dumps(body).encode(),
                                         headers={"Authorization": "Bearer " + os.environ["AI_GATEWAY_API_KEY"], "Content-Type": "application/json"})
            r = json.load(urllib.request.urlopen(req, timeout=240))
            t = r["choices"][0]["message"]["content"] or ''
            t = re.sub(r'^```(?:json)?|```$', '', t.strip()).strip()
            return json.loads(t)
        except Exception as e:
            err = str(e)[:200]
            time.sleep(2 * (k + 1))
    raise RuntimeError(err)


def prompt_generar(b, refs):
    comp = area['competencias'][b['competencia'] - 1]
    des = '\n'.join(f'- {d}' for d in comp['desempenos'])
    ya = '\n'.join(f'- {p["pregunta"]} (respuesta: {p["respuesta"]})' for p in b['preguntas'])
    ref = '\n\n'.join(f'[Cuadernillo de Matemática 4, MINEDU, página {n}]\n{t}' for n, t in refs) or '(no hay páginas del cuadernillo sobre este tema)'
    return f"""Eres un docente peruano experto en Matemática de 4.º grado de primaria. Vas a escribir material para el tema «{b['tema']}».

COMPETENCIA DEL CURRÍCULO NACIONAL: {comp['nombre']}
DESEMPEÑOS OFICIALES DE 4.º (lo que el alumno debe lograr; no pidas nada que no esté aquí):
{des}
El tema se apoya en este fragmento: «{b['cita']}».

PREGUNTAS QUE YA TENEMOS (no las repitas):
{ya}

REFERENCIA: páginas del cuadernillo oficial del MINEDU para 4.º. Úsalas solo para ver el tipo de situación y el nivel; NO copies sus textos ni sus datos.
{ref}

Escribe en español del Perú, con palabras del aula y situaciones peruanas (mercado, bodega, chacra, colegio, feria, combi), nombres variados. Números naturales de hasta 4 cifras (máximo 9999); fracciones usuales (medios, tercios, cuartos, quintos, sextos, octavos, décimos) escritas como 3/4; sin decimales; dinero en soles enteros (S/ 25); masas en kg y g; tiempo en horas, medias horas y cuartos de hora.

Devuelve SOLO un JSON con esta forma:
{{
 "teoria": {{"idea": "lo esencial del tema en 1 o 2 oraciones simples, para un niño de 9 años",
            "ejemplo": {{"enunciado": "un problema corto", "pasos": ["…"], "respuesta": "…"}}}},
 "problemas": [
   {{"enunciado": "situación y pregunta (máximo 280 caracteres)",
     "alternativas": ["…", "…", "…", "…"],
     "respuesta": "texto exacto de la alternativa correcta",
     "pasos": ["paso corto", "…", "último paso que dice la respuesta"],
     "verificacion": "operación con números y + - * / ( ) cuyo resultado es el número de la respuesta, o null si la respuesta no es un número",
     "nivel": 1}}
 ]
}}
Reglas:
- 14 problemas: 5 de nivel 1 (directos), 5 de nivel 2 (dos pasos), 4 de nivel 3 (más pensamiento, pero dentro de los desempeños).
- 9 con "alternativas" (4, distintas, una sola correcta, las incorrectas son errores típicos) y 5 sin alternativas (usa "alternativas": []), para resolver con procedimiento.
- "respuesta": si hay alternativas, es exactamente una de ellas; si no, es la respuesta corta con su unidad ("S/ 245", "3/4", "1250 g").
- "pasos": de 1 a 4, como en la pizarra, con × ÷ − =; el último dice la respuesta.
- "verificacion": por ejemplo "1200+200+50+23" o "3/4"; debe dar exactamente el número de la respuesta. Si la respuesta no es un número (por ejemplo "rectángulo" o "Ana"), usa null.
- Cada problema distinto de los demás y de las preguntas que ya tenemos. Nada que dependa de un dibujo."""


def numeros(t):
    return [int(x) for x in re.findall(r'\d+', t)]


def valor(t):
    t = t.replace('S/', '').replace('−', '-').strip()
    m = re.search(r'-?\d+\s*/\s*\d+|-?\d+(?: \d{3})*(?:,\d+)?', t)
    if not m:
        return None
    s = m[0].replace(' ', '').replace(',', '.')
    try:
        return Fraction(s)
    except Exception:
        return None


def calcular(expr):
    e = str(expr).replace('×', '*').replace('÷', '/').replace('−', '-').replace(' ', '')
    if not re.fullmatch(r'[\d+\-*/().]+', e) or len(e) > 120:
        return None
    try:
        # Fracciones exactas: cada número entero se vuelve Fraction.
        return eval(re.sub(r'(\d+)', r'Fraction(\1)', e), {'Fraction': Fraction, '__builtins__': {}})
    except Exception:
        return None


def revisar(p, existentes):
    """Motivo para descartar el problema, o None si pasa."""
    try:
        en, alts, resp, pasos, niv = p['enunciado'].strip(), p.get('alternativas') or [], str(p['respuesta']).strip(), p['pasos'], int(p['nivel'])
    except Exception:
        return 'formato'
    if not (20 <= len(en) <= 320): return 'largo'
    if niv not in (1, 2, 3): return 'nivel'
    if not (1 <= len(pasos) <= 4) or any(not str(x).strip() or len(str(x)) > 140 for x in pasos): return 'pasos'
    if alts:
        if len(alts) != 4 or len({a.strip().lower() for a in alts}) != 4: return 'alternativas'
        if resp not in alts: return 'respuesta fuera de las alternativas'
    texto = ' '.join([en, resp, *alts, *pasos])
    if re.search(r'undefined|NaN|\\frac|\$', texto): return 'texto roto'
    if any(n > 9999 and not (1900 <= n <= 2100) for n in numeros(' '.join([en, resp, *alts]))): return 'número de más de 4 cifras'
    if re.search(r'\d+[.,]\d', en + resp): return 'decimal'
    v = valor(resp)
    # "2 kg y 500 g" o una fracción sin operación: la valida el resolvedor a ciegas.
    compuesta = (len(re.findall(r'\d+', resp)) > 1 and '/' not in resp) or ('/' in resp and not p.get('verificacion'))
    if v is not None and not compuesta:
        c = calcular(p.get('verificacion')) if p.get('verificacion') else None
        if c is None or c != v: return f'verificación no cuadra ({p.get("verificacion")} ≠ {resp})'
        ult = valor(str(pasos[-1]).split('=')[-1]) if '=' in str(pasos[-1]) else None
        if v not in [valor(x) for x in re.findall(r'-?\d+\s*/\s*\d+|-?\d+(?: \d{3})*', str(pasos[-1]))]: return 'el último paso no dice la respuesta'
        if alts and sum(1 for a in alts if valor(a) == v) != 1: return 'otra alternativa vale lo mismo'
    elif not compuesta:
        if plano(resp)[:20] not in plano(str(pasos[-1])): return 'el último paso no dice la respuesta'
    clave = re.sub(r'[^a-z0-9]', '', plano(en))[:80]
    if clave in existentes: return 'repetido'
    existentes.add(clave)
    return None


def signos(t):
    t = re.sub(r'(\d)\s*\*\s*(\d)', r'\1 × \2', t)
    t = re.sub(r'(\d)\s+-\s+(\d)', r'\1 − \2', t)
    return t


def resolver_a_ciegas(problemas):
    lista = '\n'.join(f'{i + 1}. {p["enunciado"]}' + (f' Alternativas: ' + ' | '.join(p['alternativas']) if p['alternativas'] else '') for i, p in enumerate(problemas))
    r = llamar(RESOLVEDOR, f"""Resuelve cada problema de Matemática de 4.º de primaria. Piensa con cuidado y verifica tus cuentas.
Si tiene alternativas, responde con el texto exacto de la alternativa correcta; si no, con la respuesta corta y su unidad.
Devuelve SOLO un JSON: {{"respuestas": ["…", "…"]}} en el mismo orden.

{lista}""")
    return r.get('respuestas', [])


def mismo(a, b):
    va, vb = valor(str(a)), valor(str(b))
    if va is not None and vb is not None: return va == vb
    return plano(str(a)).strip(' .') == plano(str(b)).strip(' .')


def tema(b):
    refs = referencias(b['tema'], b)
    datos = llamar(GENERADOR, prompt_generar(b, refs))
    existentes = {re.sub(r'[^a-z0-9]', '', plano(p['pregunta']))[:80] for p in b['preguntas']}
    buenos, motivos = [], {}
    for p in datos.get('problemas', []):
        m = revisar(p, existentes)
        if m: motivos[m] = motivos.get(m, 0) + 1
        else:
            limpio = {k: p[k] for k in ('enunciado', 'alternativas', 'respuesta', 'pasos', 'nivel')}
            limpio['pasos'] = [signos(str(x)) for x in limpio['pasos']]
            buenos.append(limpio)
    # Segunda opinión: otro modelo los resuelve sin ver la respuesta.
    if buenos:
        ciegas = resolver_a_ciegas(buenos)
        finales = []
        for p, r in zip(buenos, ciegas + [None] * len(buenos)):
            if r is not None and mismo(r, p['respuesta']): finales.append(p)
            else: motivos['el resolvedor no llegó a la misma respuesta'] = motivos.get('el resolvedor no llegó a la misma respuesta', 0) + 1
        buenos = finales
    t = datos.get('teoria') or {}
    ej = t.get('ejemplo') or {}
    teoria = None
    if t.get('idea') and ej.get('enunciado') and ej.get('pasos') and ej.get('respuesta'):
        teoria = {'idea': t['idea'].strip(), 'ejemplo': {'enunciado': ej['enunciado'].strip(), 'pasos': [str(x) for x in ej['pasos']][:4], 'respuesta': str(ej['respuesta']).strip()}}
    return {'tema': b['tema'], 'paginas': [n for n, _ in refs], 'teoria': teoria, 'problemas': buenos}, motivos


if __name__ == '__main__':
    salida = sys.argv[1]
    elegidos = sys.argv[2:]
    temas = [b for b in banco if not elegidos or b['tema'] in elegidos]
    resultado = json.load(open(salida)) if os.path.exists(salida) else []
    hechos = {r['tema'] for r in resultado if len(r['problemas']) >= 8}
    temas = [b for b in temas if b['tema'] not in hechos]
    with cf.ThreadPoolExecutor(8) as ex:
        futuros = {ex.submit(tema, b): b['tema'] for b in temas}
        for f in cf.as_completed(futuros):
            nombre = futuros[f]
            try:
                r, motivos = f.result()
            except Exception as e:
                print(f'✗ {nombre}: {e}', flush=True)
                continue
            previo = next((x for x in resultado if x['tema'] == nombre), None)
            if previo and len(previo['problemas']) >= len(r['problemas']):
                print(f'= {nombre}: se queda el anterior ({len(previo["problemas"])} ≥ {len(r["problemas"])})', flush=True)
                continue
            resultado = [x for x in resultado if x['tema'] != nombre] + [r]
            json.dump(resultado, open(salida, 'w'), ensure_ascii=False, indent=1)
            print(f'{"✓" if len(r["problemas"]) >= 8 else "·"} {nombre}: {len(r["problemas"])} problemas, teoría {"sí" if r["teoria"] else "no"}, págs {r["paginas"]}; descartados {motivos}', flush=True)
