// Sonidos sintetizados con Web Audio: no hay archivos que descargar, así que funcionan con datos móviles.
import { useSyncExternalStore } from 'react'

const CLAVE = 'supermentes-silencio'

let ctx: AudioContext | null = null
let silencio = (() => {
  try {
    return localStorage.getItem(CLAVE) === '1'
  } catch {
    return false
  }
})()
const oyentes = new Set<() => void>()

/** El navegador solo deja sonar después de un toque: se llama al empezar la partida. */
export function activarAudio() {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    ctx ??= new AC()
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    ctx = null
  }
}

export function alternarSilencio() {
  silencio = !silencio
  try {
    localStorage.setItem(CLAVE, silencio ? '1' : '0')
  } catch {
    // Sin almacenamiento, la preferencia dura esta visita.
  }
  oyentes.forEach((f) => f())
}

export function useSilencio() {
  return useSyncExternalStore(
    (f) => {
      oyentes.add(f)
      return () => oyentes.delete(f)
    },
    () => silencio,
  )
}

type Nota = { f: number; dur: number; en?: number; tipo?: OscillatorType; vol?: number; hasta?: number }

function tocar(notas: Nota[]) {
  if (silencio || !ctx || ctx.state !== 'running') return
  const ahora = ctx.currentTime
  for (const n of notas) {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    const t = ahora + (n.en ?? 0)
    o.type = n.tipo ?? 'triangle'
    o.frequency.setValueAtTime(n.f, t)
    if (n.hasta) o.frequency.exponentialRampToValueAtTime(n.hasta, t + n.dur)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(n.vol ?? 0.18, t + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, t + n.dur)
    o.connect(g).connect(ctx.destination)
    o.start(t)
    o.stop(t + n.dur + 0.02)
  }
}

function ruido(dur: number, vol: number) {
  if (silencio || !ctx || ctx.state !== 'running') return
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate)
  const datos = buffer.getChannelData(0)
  for (let i = 0; i < datos.length; i++) datos[i] = (Math.random() * 2 - 1) * (1 - i / datos.length) ** 2
  const fuente = ctx.createBufferSource()
  const g = ctx.createGain()
  g.gain.value = vol
  fuente.buffer = buffer
  fuente.connect(g).connect(ctx.destination)
  fuente.start()
}

export const sonar = {
  acierto: () =>
    tocar([
      { f: 784, dur: 0.12 },
      { f: 1175, dur: 0.22, en: 0.08 },
    ]),
  error: () => tocar([{ f: 220, hasta: 140, dur: 0.28, tipo: 'sawtooth', vol: 0.07 }]),
  pop: () => {
    ruido(0.09, 0.25)
    tocar([{ f: 900, hasta: 300, dur: 0.08, tipo: 'square', vol: 0.06 }])
  },
  paso: () => tocar([{ f: 520, hasta: 700, dur: 0.09, vol: 0.12 }]),
  tic: () => tocar([{ f: 1400, dur: 0.04, tipo: 'square', vol: 0.04 }]),
  victoria: () =>
    tocar([
      { f: 523, dur: 0.16 },
      { f: 659, dur: 0.16, en: 0.13 },
      { f: 784, dur: 0.16, en: 0.26 },
      { f: 1047, dur: 0.45, en: 0.39 },
      { f: 784, dur: 0.45, en: 0.39, vol: 0.08 },
    ]),
  golpe: () => {
    ruido(0.12, 0.35)
    tocar([{ f: 160, hasta: 55, dur: 0.18, tipo: 'square', vol: 0.12 }])
  },
  laser: () => tocar([{ f: 1500, hasta: 220, dur: 0.16, tipo: 'square', vol: 0.06 }]),
  explosion: () => {
    ruido(0.35, 0.3)
    tocar([{ f: 120, hasta: 40, dur: 0.35, tipo: 'sawtooth', vol: 0.08 }])
  },
  especial: () =>
    tocar([
      { f: 220, hasta: 880, dur: 0.35, tipo: 'sawtooth', vol: 0.07 },
      { f: 330, hasta: 1320, dur: 0.35, tipo: 'square', vol: 0.04, en: 0.05 },
    ]),
  latido: () =>
    tocar([
      { f: 62, hasta: 45, dur: 0.12, tipo: 'sine', vol: 0.5 },
      { f: 58, hasta: 42, dur: 0.14, tipo: 'sine', vol: 0.4, en: 0.2 },
    ]),
  puerta: () => tocar([{ f: 140, hasta: 90, dur: 0.6, tipo: 'sawtooth', vol: 0.05 }, { f: 300, hasta: 200, dur: 0.5, tipo: 'triangle', vol: 0.04, en: 0.1 }]),
  fin: () =>
    tocar([
      { f: 523, dur: 0.18 },
      { f: 440, dur: 0.18, en: 0.15 },
      { f: 392, dur: 0.4, en: 0.3 },
    ]),
}
