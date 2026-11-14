/* ==========================================================================
   Imagen para la vista previa al compartir (Open Graph), 1200 × 630:
   el gato y el logotipo sobre crema, con "Club de lectura · Villa Allende, Córdoba".
   Se genera con el navegador de Playwright, así usa las fuentes reales.
   Uso: node tools/og.mjs   → src/dossier/og-dossier.jpg y src/links/og-links.jpg
   (se guardan en el repo y el build las copia; volver a correrlo si cambia la marca)
   ========================================================================== */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sitio = JSON.parse(await fs.readFile(path.join(RAIZ, 'contenido/sitio.json'), 'utf8'));
const isologo = await fs.readFile(path.join(RAIZ, 'src/compartido/img/isologo.svg'), 'utf8');
const logotipo = await fs.readFile(path.join(RAIZ, 'src/compartido/img/logotipo-negro.svg'), 'utf8');
const gabarito = await fs.readFile(path.join(RAIZ, 'node_modules/@fontsource-variable/gabarito/files/gabarito-latin-wght-normal.woff2'));
const b64 = (buf, tipo) => `data:${tipo};base64,${Buffer.from(buf).toString('base64')}`;

function html(bajada) {
  return `<!DOCTYPE html><html lang="es-AR"><head><meta charset="utf-8"><style>
  @font-face{font-family:Gabarito;src:url(${b64(gabarito, 'font/woff2')}) format("woff2");font-weight:400 900}
  html,body{margin:0;width:1200px;height:630px;background:#F1F0EB;overflow:hidden}
  body{display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Gabarito,sans-serif;color:#010101}
  .cat{width:300px;height:auto;display:block}
  .name{width:300px;height:auto;display:block;margin-top:30px}
  .pie{margin-top:52px;font-weight:500;font-size:22px;letter-spacing:.22em;text-transform:uppercase;color:#70293C}
  </style></head><body>
  <img class="cat" src="${b64(isologo, 'image/svg+xml')}">
  <img class="name" src="${b64(logotipo, 'image/svg+xml')}">
  <div class="pie">${bajada}</div>
  </body></html>`;
}

const bajada = `Club de lectura · ${sitio.lugar.localidad}, ${sitio.lugar.provincia}`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html(bajada), { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
const png = await page.screenshot({ type: 'png' });
await browser.close();

const jpg = await sharp(png).jpeg({ quality: 88, progressive: true, mozjpeg: true }).toBuffer();
for (const destino of ['src/dossier/og-dossier.jpg', 'src/links/og-links.jpg']) {
  await fs.writeFile(path.join(RAIZ, destino), jpg);
  console.log(`${destino}: ${(jpg.length / 1024).toFixed(0)} KB`);
}
