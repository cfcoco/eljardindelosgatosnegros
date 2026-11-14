/* ==========================================================================
   Capturas de página completa y comparación píxel a píxel entre el original
   (claude.ai) y la versión nueva, en 390 y 1280 px.
   Uso: node tools/capturas.mjs [--base http://localhost:5173] [--solo-nuevo]
   Salida: _capturas/<ancho>-original.png, -nuevo.png, -diff.png, -lado-a-lado.png
   Requiere el servidor de desarrollo corriendo (npm run dev).
   ========================================================================== */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import sharp from 'sharp';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(RAIZ, '_capturas');
const args = process.argv.slice(2);
const BASE = args.includes('--base') ? args[args.indexOf('--base') + 1] : 'http://localhost:5173';
const SOLO_NUEVO = args.includes('--solo-nuevo');
const ANCHOS = [390, 1280];
const SITIOS = [
  { nombre: 'dossier', original: '/_origen/dossier/', nuevo: '/' },
  { nombre: 'links', original: '/_origen/links/', nuevo: '/links/' },
];

// Deja la página en su estado final: todo visible, sin animaciones, videos quietos.
const CSS_QUIETO = `
  .rv,.rv2,.sube{opacity:1!important;transform:none!important;transition:none!important}
  .lw-wait .cover .name,.lw-wait .mark svg.name,.mark .cat{visibility:visible!important;opacity:1!important}
  *{animation:none!important;scroll-behavior:auto!important}
`;

async function capturar(page, url, ancho) {
  await page.setViewportSize({ width: ancho, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: CSS_QUIETO });
  await page.evaluate(async () => {
    document.documentElement.classList.remove('lw-wait');
    await document.fonts.ready;
    // Recorre toda la página para que carguen las fotos con loading="lazy".
    const alto = () => document.documentElement.scrollHeight;
    for (let y = 0; y < alto(); y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    window.scrollTo(0, 0);
    await Promise.all([...document.images].map((im) => im.complete ? null : new Promise((r) => { im.onload = im.onerror = r; })));
    document.querySelectorAll('video').forEach((v) => { try { v.pause(); v.currentTime = 0; } catch (_) {} });
    document.querySelectorAll('.rv,.rv2').forEach((e) => e.classList.add('in'));
  });
  await page.waitForTimeout(400);
  return page.screenshot({ fullPage: true, animations: 'disabled' });
}

function alargar(png, alto) {
  if (png.height >= alto) return png;
  const out = new PNG({ width: png.width, height: alto });
  out.data.fill(255);
  PNG.bitblt(png, out, 0, 0, png.width, png.height, 0, 0);
  return out;
}

async function comparar(prefijo, ancho, a, b) {
  let A = PNG.sync.read(a), B = PNG.sync.read(b);
  const alto = Math.max(A.height, B.height);
  A = alargar(A, alto); B = alargar(B, alto);
  const diff = new PNG({ width: ancho, height: alto });
  const n = pixelmatch(A.data, B.data, diff.data, ancho, alto, { threshold: 0.18, includeAA: false, diffColor: [255, 0, 90], alpha: 0.35 });
  const diffBuf = PNG.sync.write(diff);
  await fs.writeFile(path.join(OUT, `${prefijo}-${ancho}-diff.png`), diffBuf);
  const lado = await sharp({ create: { width: ancho * 3 + 40, height: alto, channels: 3, background: '#888' } })
    .composite([{ input: a, left: 0, top: 0 }, { input: b, left: ancho + 20, top: 0 }, { input: diffBuf, left: ancho * 2 + 40, top: 0 }])
    .jpeg({ quality: 80 }).toBuffer();
  await fs.writeFile(path.join(OUT, `${prefijo}-${ancho}-lado-a-lado.jpg`), lado);
  return { pixeles: n, total: ancho * alto, altoA: PNG.sync.read(a).height, altoB: PNG.sync.read(b).height };
}

await fs.mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
try {
  for (const sitio of SITIOS) for (const ancho of ANCHOS) {
    const pngs = {};
    const paginas = SOLO_NUEVO ? { nuevo: sitio.nuevo } : { original: sitio.original, nuevo: sitio.nuevo };
    for (const [nombre, ruta] of Object.entries(paginas)) {
      const ctx = await browser.newContext({ viewport: { width: ancho, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce', locale: 'es-AR' });
      const page = await ctx.newPage();
      pngs[nombre] = await capturar(page, BASE + ruta, ancho);
      await fs.writeFile(path.join(OUT, `${sitio.nombre}-${ancho}-${nombre}.png`), pngs[nombre]);
      await ctx.close();
    }
    if (pngs.original && pngs.nuevo) {
      const r = await comparar(sitio.nombre, ancho, pngs.original, pngs.nuevo);
      console.log(`${sitio.nombre} ${ancho}px · alto original ${r.altoA}px, nuevo ${r.altoB}px · píxeles distintos ${(100 * r.pixeles / r.total).toFixed(2)} %`);
    } else {
      console.log(`${sitio.nombre} ${ancho}px · captura guardada`);
    }
  }
} finally {
  await browser.close();
}
console.log('Capturas en', OUT);
