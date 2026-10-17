// Graba la pestaña activa de una sesión de agent-browser a resolución real.
// `agent-browser record` y el screencast de Chrome entregan cuadros a 1x (píxeles CSS) y se ven
// blandos al escalar. Con Chrome lanzado con --force-device-scale-factor=N, las capturas de pantalla
// salen a Nx de verdad: aquí se piden seguidas (10-20 por segundo según lo que pase en la página;
// armar-video.sh las lleva a 30 fps). Ni `set viewport ... N` ni `clip.scale` sirven: el primero es
// de la sesión de CDP de agent-browser y el segundo reacomoda la página en cada captura.
// Uso: node grabador-cdp.mjs <cdp-url> <carpeta>   (termina con SIGTERM / SIGINT)
// Deja <carpeta>/NNNNN.jpg y <carpeta>/cuadros.tsv (segundo epoch, archivo, ancho x alto).
import { mkdirSync, writeFileSync, appendFileSync } from "node:fs";

const [url, dir] = process.argv.slice(2);
mkdirSync(dir, { recursive: true });
writeFileSync(`${dir}/cuadros.tsv`, "");
const ws = new WebSocket(url);
let id = 0;
const pendientes = new Map();
const enviar = (method, params = {}, sessionId) =>
  new Promise((ok) => {
    const n = ++id;
    pendientes.set(n, ok);
    ws.send(JSON.stringify({ id: n, method, params, sessionId }));
  });
ws.onmessage = ({ data }) => {
  const m = JSON.parse(data);
  if (m.id && pendientes.has(m.id)) pendientes.get(m.id)(m.result ?? m.error);
};

// Ancho x alto de un JPEG (marcador SOF).
const medidas = (b) => {
  for (let i = 2; i < b.length - 9; ) {
    if (b[i] !== 0xff) return "?";
    const marca = b[i + 1];
    if (marca >= 0xc0 && marca <= 0xc3) return `${b.readUInt16BE(i + 7)}x${b.readUInt16BE(i + 5)}`;
    i += 2 + b.readUInt16BE(i + 2);
  }
  return "?";
};

let seguir = true;
ws.onopen = async () => {
  const { targetInfos } = await enviar("Target.getTargets");
  const pagina = targetInfos.find((t) => t.type === "page" && t.attached) ?? targetInfos.find((t) => t.type === "page");
  const { sessionId } = await enviar("Target.attachToTarget", { targetId: pagina.targetId, flatten: true });
  console.log("grabando");
  for (let n = 0; seguir; n++) {
    const antes = Date.now();
    const r = await enviar("Page.captureScreenshot", { format: "jpeg", quality: 92, optimizeForSpeed: true }, sessionId);
    if (!r?.data) continue;
    const archivo = `${String(n).padStart(5, "0")}.jpg`;
    const jpg = Buffer.from(r.data, "base64");
    writeFileSync(`${dir}/${archivo}`, jpg);
    // El cuadro corresponde a algún momento entre el pedido y la respuesta: se toma el medio.
    appendFileSync(`${dir}/cuadros.tsv`, `${((antes + Date.now()) / 2000).toFixed(3)}\t${archivo}\t${medidas(jpg)}\n`);
  }
  ws.close();
  process.exit(0);
};
const parar = () => { seguir = false; };
process.on("SIGTERM", parar);
process.on("SIGINT", parar);
