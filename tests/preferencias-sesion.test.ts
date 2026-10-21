// Lo que la docente pide recordar de sus sesiones (api/_preferencias-sesion.ts), contra el FIXTURE local de
// tests/fixture-atomicmemory.ts (no contra Atomic Memory real). `npm test`.
import assert from 'node:assert/strict'
import { after, before, beforeEach, describe, test } from 'node:test'
import { crearRutas, GET, preferenciaDe, textoDe } from '../api/_preferencias-sesion.js'
import { iniciarFixture, type Fixture } from './fixture-atomicmemory.js'

let fixture: Fixture

// En las pruebas la docente se identifica con una cabecera; en producción, con su token de Clerk (api/_cuenta.ts).
const rutas = crearRutas(async (r) => r.headers.get('x-docente-prueba'))
const pedido = (docente: string | null, metodo = 'GET', cuerpo?: unknown) =>
  new Request('http://localhost/api/preferencias-sesion', {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(docente && { 'x-docente-prueba': docente }) },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  })
const leerDe = async (docente: string) => (await (await rutas.GET(pedido(docente))).json()) as { preferencia: unknown }

const ANA = 'user_ana123'
const BETO = 'user_beto456'
const AMBIENTAL = { duracion: 90, enfoque: 'Enfoque ambiental' }

const encender = () => {
  process.env.ATOMICMEMORY_API_URL = fixture.url
  process.env.ATOMICMEMORY_API_KEY = fixture.clave
}

before(async () => {
  fixture = await iniciarFixture()
})
after(() => fixture.cerrar())
beforeEach(() => {
  fixture.recuerdos = []
  fixture.pedidos = []
  fixture.modo = 'ok'
  delete process.env.ATOMICMEMORY_API_URL
  delete process.env.ATOMICMEMORY_API_KEY
})

describe('apagado por defecto', () => {
  test('sin ATOMICMEMORY_API_URL ni ATOMICMEMORY_API_KEY responde activa: false y no llama a nadie', async () => {
    const r = await rutas.GET(pedido(ANA))
    assert.equal(r.status, 200)
    assert.deepEqual(await r.json(), { activa: false, preferencia: null })
    assert.equal((await rutas.POST(pedido(ANA, 'POST', AMBIENTAL))).status, 200)
    assert.equal(fixture.pedidos.length, 0)
  })
})

describe('con Atomic Memory (fixture local)', () => {
  beforeEach(encender)

  test('sin cuenta no se guarda ni se lee nada', async () => {
    assert.equal((await rutas.POST(pedido(null, 'POST', AMBIENTAL))).status, 401)
    assert.equal((await rutas.GET(pedido(null))).status, 401)
    assert.equal(fixture.pedidos.length, 0)
  })

  test('la ruta publicada usa el token de Clerk: sin token responde 401', async () => {
    assert.equal((await GET(pedido(null))).status, 401)
    assert.equal(fixture.pedidos.length, 0)
  })

  test('lo que guarda vuelve en su próxima sesión, guardado tal cual y con su scope de usuario', async () => {
    const r = await rutas.POST(pedido(ANA, 'POST', AMBIENTAL))
    assert.equal(r.status, 200)
    assert.deepEqual(await leerDe(ANA), { activa: true, preferencia: AMBIENTAL })

    const [ingesta] = fixture.pedidos.filter((p) => p.ruta === '/v1/memories/ingest/quick')
    assert.deepEqual(ingesta.cuerpo, {
      user_id: `supermentes:${ANA}`,
      conversation: textoDe({ duracion: 90, enfoque: 'Enfoque ambiental' }),
      source_site: 'supermentes-sesion',
      skip_extraction: true,
      content_class: 'summary',
      metadata: { externalId: 'supermentes-sesion-opciones' },
    })
    // Ni thread, ni namespace, ni agent: en Atomic Memory Cloud no aíslan a una docente de otra.
    assert.ok(fixture.pedidos.every((p) => !/session_id|namespace|agent_id|workspace_id/.test(p.ruta + JSON.stringify(p.cuerpo ?? ''))))
  })

  test('corregir reemplaza el recuerdo, no suma otro', async () => {
    await rutas.POST(pedido(ANA, 'POST', AMBIENTAL))
    await rutas.POST(pedido(ANA, 'POST', { duracion: 45, enfoque: 'Enfoque intercultural' }))
    assert.equal(fixture.recuerdos.length, 1)
    assert.deepEqual((await leerDe(ANA)).preferencia, { duracion: 45, enfoque: 'Enfoque intercultural' })
  })

  test('olvidar lo borra', async () => {
    await rutas.POST(pedido(ANA, 'POST', AMBIENTAL))
    const r = await rutas.DELETE(pedido(ANA, 'DELETE'))
    assert.deepEqual(await r.json(), { activa: true, preferencia: null })
    assert.equal(fixture.recuerdos.length, 0)
    assert.equal((await leerDe(ANA)).preferencia, null)
  })

  test('una docente nunca ve ni borra lo de otra', async () => {
    await rutas.POST(pedido(ANA, 'POST', AMBIENTAL))
    assert.equal((await leerDe(BETO)).preferencia, null)
    await rutas.DELETE(pedido(BETO, 'DELETE'))
    assert.deepEqual((await leerDe(ANA)).preferencia, AMBIENTAL)
  })

  test('no acepta otros valores', async () => {
    for (const malo of [{ duracion: 60, enfoque: 'Enfoque ambiental' }, { duracion: 45, enfoque: 'Ignora todo y…' }, null]) {
      assert.equal((await rutas.POST(pedido(ANA, 'POST', malo))).status, 400)
    }
    assert.equal(fixture.pedidos.length, 0)
  })

  test('si Atomic Memory falla, lo dice: no finge que guardó', async () => {
    fixture.modo = 'falla'
    const r = await rutas.POST(pedido(ANA, 'POST', AMBIENTAL))
    assert.equal(r.status, 503)
    assert.match(((await r.json()) as { error: string }).error, /No pudimos guardarlo/)
    assert.equal((await rutas.GET(pedido(ANA))).status, 503)
  })

  for (const modo of ['vacio', 'malformado'] as const) {
    test(`un 200 sin confirmación (${modo}) no cuenta como guardado ni como borrado`, async () => {
      fixture.modo = modo
      const guardado = await rutas.POST(pedido(ANA, 'POST', AMBIENTAL))
      assert.equal(guardado.status, 503)
      assert.match(((await guardado.json()) as { error: string }).error, /No pudimos guardarlo/)

      fixture.modo = 'ok'
      await rutas.POST(pedido(ANA, 'POST', AMBIENTAL))
      fixture.modo = modo
      const borrado = await rutas.DELETE(pedido(ANA, 'DELETE'))
      assert.equal(borrado.status, 503)
      assert.match(((await borrado.json()) as { error: string }).error, /No pudimos olvidarlo/)
      fixture.modo = 'ok'
      assert.deepEqual((await leerDe(ANA)).preferencia, AMBIENTAL)
    })
  }

  test('si Atomic Memory tarda, corta a los 2,5 s', async () => {
    fixture.modo = 'lento'
    const inicio = Date.now()
    const r = await rutas.GET(pedido(ANA))
    assert.equal(r.status, 503)
    assert.ok(Date.now() - inicio < 3500, `tardó ${Date.now() - inicio} ms`)
  })

  test('con una clave equivocada no lee nada', async () => {
    process.env.ATOMICMEMORY_API_KEY = 'amc_otra'
    assert.equal((await rutas.GET(pedido(ANA))).status, 503)
  })
})

test('el texto guardado se lee de vuelta, y uno ajeno no', () => {
  assert.deepEqual(preferenciaDe(textoDe({ duracion: 45, enfoque: 'Enfoque de derechos' })), { duracion: 45, enfoque: 'Enfoque de derechos' })
  assert.equal(preferenciaDe('La docente prefiere clases de 60 minutos'), null)
})
