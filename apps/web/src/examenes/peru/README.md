# Cosas del Perú para los exámenes

Imágenes reales de lo que el alumno ve todos los días: el dinero con el que compra en la bodega, el cuy, la combi, la
chicha morada, los picarones, el Misti… Hacen que el problema se sienta suyo. Lo genérico (un carro, una gallina, un
huevo, un helicóptero) se queda en dibujo SVG: ahí una foto no suma nada.

## El dinero (`dinero/`, `dinero.ts`)

- **Billetes:** el anverso de la familia actual, la que circula desde 2021: S/ 10 Chabuca Granda, S/ 20 José María
  Arguedas, S/ 50 María Rostworowski, S/ 100 Pedro Paulet y S/ 200 Tilsa Tsuchiya.
- **Monedas:** 10, 20 y 50 céntimos; S/ 1, S/ 2 y S/ 5. En el dibujo van en su tamaño relativo real (`DIAMETRO_MONEDA`).
- **De dónde salen:** las imágenes oficiales que publica el BCRP en
  [Familia de billetes](https://www.bcrp.gob.pe/billetes-y-monedas/familia-de-billetes.html),
  [Cono monetario](https://www.bcrp.gob.pe/billetes-y-monedas/cono-monetario.html) y
  [multimedia.bcrp.gob.pe](http://multimedia.bcrp.gob.pe/docs/billetes/billete-10.html). Son imágenes de muestra (con
  números como «A1234567A»). Los billetes se recortaron al borde y las monedas se separaron del fondo azul (relleno
  por color desde los bordes); todo en WebP: billetes de 320 px de ancho y monedas de 180 px.
- **Cuidado:** el BCRP considera los diseños de billetes y monedas obras protegidas por derecho de autor y no
  encontramos una norma publicada que autorice reproducirlos. Por eso: solo el anverso, siempre mucho más chicos que
  los reales (en el PDF, un billete mide unos 3 cm), con su crédito al pie de la hoja («Billetes y monedas: imágenes
  del Banco Central de Reserva del Perú»). **Pendiente:** pedir autorización por escrito al BCRP para uso educativo.

## Las fotos (`cosas/`, `cosas.ts`)

Fotos con licencia libre que permite uso comercial (CC0, dominio público, CC BY y CC BY-SA), de Flickr vía
[Openverse](https://openverse.org). Cada una está en `cosas/creditos.json` con su título, autor, licencia y enlace, y
el PDF las acredita al pie de la hoja. Se recortaron a 4:3 y se guardaron en WebP de 360 × 270.

| Cosa | Se muestra cuando el problema dice… |
|---|---|
| Cuy | cuy, cuyes |
| Combi | combi, combis |
| Mototaxi | mototaxi, mototaxis |
| Llama | llamas, una llama, la llama (no «se llama») |
| Alpaca | alpaca, alpacas |
| Cóndor andino | cóndor, cóndores |
| Mango | mango, mangos |
| Chicha morada | chicha morada (no la chicha de jora) |
| Causa limeña | causa limeña, causa rellena, una causa (no «a causa de») |
| Picarones | picarón, picarones |
| Anticuchos | anticucho, anticuchos |
| Quinua | quinua |
| Papa | papa, papas (no «papá») |
| Choclo | choclo, choclos |
| Chullo | chullo, chullos |
| Machu Picchu | Machu Picchu |
| Caballito de totora | caballito de totora |
| Islas de los Uros | Uros |
| El Misti | Misti |

Hoy salen en los **problemas del tema** (`../problemas.ts`): si el enunciado habla de una de estas cosas, va su foto al
lado, en la columna del enunciado (no alarga la hoja). Con el banco de Matemática de 4.º son 110 de 685 problemas (la
papa sola, 38).

## Sumar una cosa

1. Busca en Openverse con licencia que permita uso comercial y sin «ND» (hay que recortar la foto). Que no salgan
   personas reconocibles, ni bebidas alcohólicas ni marcas.
2. Recórtala a 4:3, 360 × 270, WebP calidad 80, en `cosas/<id>.webp`, y anota su crédito en `cosas/creditos.json`.
3. Agrégala a `COSAS` en `cosas.ts` con las palabras exactas que la llaman (`palabra(...)`, con cuidado de los
   dobles sentidos) y su texto alternativo.
4. `npm run typecheck` y mira un examen que la use, en la pantalla y en el PDF.
