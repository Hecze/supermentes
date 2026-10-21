// Lo recordado de las sesiones en el navegador, al salir una cuenta y entrar otra en la misma página
// (sesion/memoriaSesiones.ts, el mismo estado que usa useRecordadas). El servidor se reemplaza por respuestas fijas;
// su aislamiento real se prueba en tests/preferencias-sesion.test.ts. `npm test`.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { crearMemoriaSesiones, cuentaDelToken, type Recordadas } from './memoriaSesiones'

const tokenDe = (sub: string) => `x.${Buffer.from(JSON.stringify({ sub })).toString('base64url')}.firma`
const ANA = 'user_ana'
const BETO = 'user_beto'

/** Un servidor de mentira: cada pedido queda en espera hasta que la prueba lo responde. */
function servidor() {
  const pedidos: { token: string; metodo: string; responder: (datos: unknown) => void }[] = []
  const pedir: typeof fetch = (_url, init) =>
    new Promise((ok) => {
      const token = new Headers(init?.headers).get('Authorization')?.replace('Bearer ', '') ?? ''
      pedidos.push({ token, metodo: init?.method ?? 'GET', responder: (datos) => ok(Response.json(datos)) })
    })
  return { pedidos, pedir }
}

const espera = () => new Promise((r) => setTimeout(r, 0))
const AMBIENTAL = { activa: true, preferencia: { duracion: 90, enfoque: 'Enfoque ambiental' } }

test('el token dice de qué cuenta es', () => {
  assert.equal(cuentaDelToken(tokenDe(ANA)), ANA)
  assert.equal(cuentaDelToken('no-es-un-token'), null)
})

test('al pasar de Ana a Beto, Beto no recibe lo de Ana, ni aunque la respuesta de Ana llegue tarde', async () => {
  let entro = ANA
  const s = servidor()
  const m = crearMemoriaSesiones({ token: async () => tokenDe(entro), pedir: s.pedir })
  const vistoAna: Recordadas[] = []
  const vistoBeto: Recordadas[] = []
  const dejarAna = m.suscribir(ANA, (r) => vistoAna.push(r))

  const deAna = m.cargar(ANA)
  await espera()
  // Ana sale y entra Beto antes de que llegue la respuesta de Ana.
  dejarAna()
  entro = BETO
  m.suscribir(BETO, (r) => vistoBeto.push(r))
  const deBeto = m.cargar(BETO)
  await espera()
  assert.deepEqual(s.pedidos.map((p) => cuentaDelToken(p.token)), [ANA, BETO])

  s.pedidos[0].responder(AMBIENTAL) // la de Ana llega tarde
  s.pedidos[1].responder({ activa: true, preferencia: null })
  assert.deepEqual(await deAna, { estado: 'listo', opciones: { duracion: 90, enfoque: 4 } })
  assert.deepEqual(await deBeto, { estado: 'listo', opciones: null })
  assert.deepEqual(await m.cargar(BETO), { estado: 'listo', opciones: null }, 'el caché de Beto es suyo')
  assert.deepEqual(vistoBeto, [])
})

test('lo que Ana guardó y termina después de que entra Beto no le cambia nada a Beto', async () => {
  let entro = ANA
  const s = servidor()
  const m = crearMemoriaSesiones({ token: async () => tokenDe(entro), pedir: s.pedir })
  const vistoBeto: Recordadas[] = []

  const guardaAna = m.recordar(ANA, { duracion: 90, enfoque: 4 })
  await espera()
  entro = BETO
  m.suscribir(BETO, (r) => vistoBeto.push(r))
  s.pedidos[0].responder(AMBIENTAL)
  assert.deepEqual(await guardaAna, { ok: true })
  assert.deepEqual(vistoBeto, [])

  const deBeto = m.cargar(BETO)
  await espera()
  s.pedidos[1].responder({ activa: true, preferencia: null })
  assert.deepEqual(await deBeto, { estado: 'listo', opciones: null })
})

test('si la cuenta cambió antes de mandar, no se manda con el token de la otra', async () => {
  const s = servidor()
  // Ana pidió guardar, pero el token que hay ya es el de Beto.
  const m = crearMemoriaSesiones({ token: async () => tokenDe(BETO), pedir: s.pedir })
  const vistoBeto: Recordadas[] = []
  m.suscribir(BETO, (r) => vistoBeto.push(r))
  const r = await m.recordar(ANA, { duracion: 90, enfoque: 4 })
  assert.equal(r.ok, false)
  assert.equal(await m.olvidar(ANA).then((x) => x.ok), false)
  assert.equal(s.pedidos.length, 0)
  assert.deepEqual(vistoBeto, [])
})
