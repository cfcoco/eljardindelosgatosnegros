/* ==========================================================================
   Build del sitio: arma dist/dossier y dist/links a partir de contenido/ + src/.
   Uso: node tools/build.mjs            (o npm run build)
   ========================================================================== */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import esbuild from 'esbuild';
import sharp from 'sharp';
import * as im from './imagenes.mjs';
import { extrasDossier } from '../src/compartido/extras.mjs';
import { renderDossier, mediosDossier, seccionesMenu, paginasDossier, rutaPagina } from '../src/dossier/plantilla.mjs';

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(RAIZ, '.cache');
const CONTENIDO = path.join(RAIZ, 'contenido');
const SRC = path.join(RAIZ, 'src');
// JARDIN_DIST permite armar en otra carpeta (por ejemplo una vista previa) sin tocar dist/.
export const DIST = process.env.JARDIN_DIST ? path.resolve(process.env.JARDIN_DIST) : path.join(RAIZ, 'dist');

const leer = (p) => fs.readFile(p);
const leerTexto = (p) => fs.readFile(p, 'utf8');
const leerJson = async (p) => JSON.parse(await leerTexto(p));
const kb = (n) => (n / 1024).toFixed(1) + ' KB';

/* Una carpeta de salida (dist/dossier o dist/links). Guarda archivos con hash en el nombre. */
class Salida {
  constructor(dir) { this.dir = dir; this.escritos = new Map(); this.bytes = 0; }
  async limpiar() { await fs.rm(this.dir, { recursive: true, force: true }); await fs.mkdir(this.dir, { recursive: true }); }
  /** Guarda `buf` como carpeta/nombre.hash.ext y devuelve la URL relativa a la raíz del sitio. */
  async conHash(carpeta, nombre, ext, buf) {
    const url = `${carpeta}/${nombre}.${im.hashCorto(buf)}.${ext}`;
    return this.fijo(url, buf);
  }
  async fijo(url, buf) {
    if (!this.escritos.has(url)) {
      const abs = path.join(this.dir, url);
      await fs.mkdir(path.dirname(abs), { recursive: true });
      await fs.writeFile(abs, buf);
      this.escritos.set(url, buf.length);
      this.bytes += buf.length;
    }
    return url;
  }
}

/* ---------- recursos compartidos: fuentes, logos, gato ---------- */
async function recursosCompartidos(salida) {
  const url = {};
  const gabarito = await leer(path.join(RAIZ, 'node_modules/@fontsource-variable/gabarito/files/gabarito-latin-wght-normal.woff2'));
  url.gabarito = await salida.conHash('fonts', 'gabarito', 'woff2', gabarito);
  const trazo = await im.fuenteWoff2(await leer(path.join(SRC, 'compartido/fonts/trazo.ttf')), { cacheDir: path.join(CACHE, 'fonts') });
  url.trazo = await salida.conHash('fonts', 'trazo', 'woff2', trazo);

  const isologoSvg = im.svgOptimizado(await leerTexto(path.join(SRC, 'compartido/img/isologo.svg')));
  url.isologo = await salida.conHash('img', 'isologo', 'svg', Buffer.from(isologoSvg));

  const intro = await im.procesarAnimado(await leer(path.join(SRC, 'compartido/img/isologo-intro.webp')), { cacheDir: path.join(CACHE, 'img') });
  const anim = await im.procesarAnimado(await leer(path.join(SRC, 'compartido/img/isologo-anim.webp')), { cacheDir: path.join(CACHE, 'img') });
  url.catIntro = await salida.conHash('img', 'isologo-intro', 'webp', intro.buf);
  url.catAnim = await salida.conHash('img', 'isologo-anim', 'webp', anim.buf);
  // Primer cuadro de la intro, quieto y liviano: es lo primero que se ve en la portada.
  const quieto = await sharp(intro.buf, { page: 0 }).webp({ quality: 88, effort: 6 }).toBuffer();
  url.catQuieto = await salida.conHash('img', 'isologo-quieto', 'webp', quieto);

  const logo = im.logotipoInline(await leerTexto(path.join(SRC, 'compartido/img/logotipo-negro.svg')));
  const logoCrema = im.svgOptimizado(await leerTexto(path.join(SRC, 'compartido/img/logotipo-crema.svg')));
  url.logoCrema = await salida.conHash('img', 'logotipo-crema', 'svg', Buffer.from(logoCrema));

  // Favicons e ícono para JSON-LD / manifest, generados desde el isologo.
  const iconos = await generarIconos(salida, isologoSvg);
  url.logoPng = iconos.png512;
  return { url, cat: { width: intro.width, height: intro.height }, logo, iconos, isologoSvg };
}

/* Íconos: SVG + PNG 32/180/192/512 + favicon.ico (PNG adentro) + manifest. */
async function generarIconos(salida, isologoSvg) {
  const cacheDir = path.join(CACHE, 'iconos');
  await fs.mkdir(cacheDir, { recursive: true });
  const base = im.hashCorto(Buffer.from(isologoSvg), 12);
  const png = async (tam, fondo) => {
    const archivo = path.join(cacheDir, `${base}-${tam}${fondo ? '-f' : ''}.png`);
    try { return await fs.readFile(archivo); } catch { /* generar */ }
    const margen = Math.round(tam * 0.1);
    const svgBuf = Buffer.from(isologoSvg);
    const meta = await sharp(svgBuf).metadata();
    const densidad = Math.min(2400, Math.max(72, 72 * (tam * 2) / Math.max(meta.width || 1, meta.height || 1))); // rasteriza al doble del tamaño final
    const gato = await sharp(svgBuf, { density: densidad }).resize({ width: tam - margen * 2, height: tam - margen * 2, fit: 'inside' }).png().toBuffer();
    const buf = await sharp({ create: { width: tam, height: tam, channels: 4, background: fondo ? '#F1F0EB' : { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: gato, gravity: 'centre' }]).png({ compressionLevel: 9 }).toBuffer();
    await fs.writeFile(archivo, buf);
    return buf;
  };
  const p32 = await png(32), p180 = await png(180, true), p192 = await png(192, true), p512 = await png(512, true);
  const urls = {
    svg: await salida.fijo('favicon.svg', Buffer.from(isologoSvg)),
    png32: await salida.fijo('favicon-32.png', p32),
    apple: await salida.fijo('apple-touch-icon.png', p180),
    png192: await salida.fijo('icon-192.png', p192),
    png512: await salida.fijo('icon-512.png', p512),
    ico: await salida.fijo('favicon.ico', icoDesdePng(p32, 32)),
  };
  return urls;
}
function icoDesdePng(png, tam) {
  const head = Buffer.alloc(6 + 16);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(1, 4);
  head.writeUInt8(tam, 6); head.writeUInt8(tam, 7); head.writeUInt8(0, 8); head.writeUInt8(0, 9);
  head.writeUInt16LE(1, 10); head.writeUInt16LE(32, 12); head.writeUInt32LE(png.length, 14); head.writeUInt32LE(22, 18);
  return Buffer.concat([head, png]);
}

/* ---------- fotos y videos del contenido ---------- */
async function prepararMedios(salida, lista) {
  const mapa = new Map();
  for (const m of lista) {
    if (m.video && !mapa.has(m.video)) {
      const original = await leer(path.join(CONTENIDO, m.video));
      const buf = await im.procesarVideo(original, { cacheDir: path.join(CACHE, 'video'), maxAncho: 1920, crf: m.crf || 27 });
      const url = await salida.conHash('img', path.parse(m.video).name, 'mp4', buf);
      let poster = null;
      if (m.poster) {
        const p = await im.procesarPoster(await leer(path.join(CONTENIDO, m.poster)), { cacheDir: path.join(CACHE, 'img') });
        poster = { url: await salida.conHash('img', path.parse(m.poster).name, 'webp', p.buf), width: p.width, height: p.height };
      }
      mapa.set(m.video, { url, poster });
    } else if (m.src && !mapa.has(m.src)) {
      const buf = await leer(path.join(CONTENIDO, m.src));
      const nombre = path.parse(m.src).name;
      if (/\.webp$/i.test(m.src) && (await im.medidas(buf)).pages > 1) {
        const a = await im.procesarAnimado(buf, { cacheDir: path.join(CACHE, 'img'), maxAncho: m.ancho || null, calidad: 72 });
        mapa.set(m.src, { width: a.width, height: a.height, variantes: [{ w: a.width, url: await salida.conHash('img', nombre, 'webp', a.buf) }] });
      } else {
        const f = await im.procesarFoto(buf, { cacheDir: path.join(CACHE, 'img') });
        const variantes = [];
        for (const v of f.variantes) variantes.push({ w: v.w, url: await salida.conHash('img', `${nombre}-${v.w}`, 'webp', v.buf) });
        mapa.set(m.src, { width: f.width, height: f.height, variantes });
      }
    }
  }
  return mapa;
}

/** Devuelve la función ctx.media(m, opts) que usa la plantilla.
    `prefijo` ('/' en el dossier) hace absolutas las rutas, así sirven desde /encuentros/ y las demás páginas. */
function mediaRenderer(mapa, esc, prefijo = '') {
  return (m, { sizes = '100vw', lazy = false, prioridad = false, loop = true, preload = 'none', clase = '' } = {}) => {
    if (!m || (!m.src && !m.video)) return '';
    if (m.video) {
      const v = mapa.get(m.video);
      const wh = v.poster ? ` width="${v.poster.width}" height="${v.poster.height}"` : '';
      return `<video src="${prefijo}${v.url}"${wh}${v.poster ? ` poster="${prefijo}${v.poster.url}"` : ''} ${clase ? ` class="${clase}"` : ''} muted${loop ? ' loop' : ''} playsinline preload="${preload}"${m.alt ? ` aria-label="${esc(m.alt)}"` : ''}></video>`;
    }
    const f = mapa.get(m.src);
    const defecto = f.variantes.find((v) => v.w >= 1080) || f.variantes[f.variantes.length - 1];
    const srcset = f.variantes.length > 1 ? ` srcset="${f.variantes.map((v) => `${prefijo}${v.url} ${v.w}w`).join(', ')}" sizes="${sizes}"` : '';
    return `<img src="${prefijo}${defecto.url}"${srcset} alt="${esc(m.alt || '')}" width="${f.width}" height="${f.height}"` +
      (lazy ? ' loading="lazy"' : '') + (prioridad ? ' fetchpriority="high"' : '') + ' decoding="async">';
  };
}

/* ---------- CSS y JS ---------- */
async function cssInline(archivos, url) {
  let css = '';
  for (const a of archivos) css += (await leerTexto(a)) + '\n';
  css = css.replace('../fonts/gabarito.woff2', url.gabarito).replace('../fonts/trazo.woff2', url.trazo);
  const r = await esbuild.transform(css, { loader: 'css', minify: true });
  return r.code.trim();
}
async function jsConHash(salida, entrada, nombre) {
  const r = await esbuild.build({ entryPoints: [entrada], bundle: true, minify: true, target: ['es2017'], write: false, legalComments: 'none' });
  const buf = Buffer.from(r.outputFiles[0].contents);
  return salida.conHash('js', nombre, 'js', buf);
}
/* Agrega la clase lw-wait apenas arranca la página (oculta el logotipo hasta que se escribe).
   Si el JavaScript principal no llega a correr, se saca sola a los 2,5 s. */
const SCRIPT_INICIAL = "(function(){try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('lw-wait');setTimeout(function(){document.documentElement.classList.remove('lw-wait')},2500)}catch(e){}})()";
export const hashScriptInicial = () => 'sha256-' + createHash('sha256').update(SCRIPT_INICIAL).digest('base64');

function headIconos(ic, sitio, prefijo = '') {
  return `<link rel="icon" href="${prefijo}${ic.ico}" sizes="32x32">
<link rel="icon" href="${prefijo}${ic.svg}" type="image/svg+xml">
<link rel="apple-touch-icon" href="${prefijo}${ic.apple}">
<link rel="manifest" href="${prefijo}site.webmanifest">`;
}

/* ---------- el dossier ---------- */
export async function construirDossier() {
  const sitio = await leerJson(path.join(CONTENIDO, 'sitio.json'));
  const c = await leerJson(path.join(CONTENIDO, 'dossier.json'));
  const salida = new Salida(path.join(DIST, 'dossier'));
  await salida.limpiar();

  const comp = await recursosCompartidos(salida);
  const mapa = await prepararMedios(salida, mediosDossier(c));
  const { esc } = await import('../src/dossier/plantilla.mjs');
  const url = { ...comp.url };
  url.js = await jsConHash(salida, path.join(SRC, 'dossier/dossier.js'), 'dossier');
  try { url.og = await salida.fijo('og-dossier.jpg', await leer(path.join(SRC, 'dossier/og-dossier.jpg'))); }
  catch { console.warn('  (aviso) falta src/dossier/og-dossier.jpg: la vista previa al compartir queda sin imagen. Corré node tools/og.mjs'); }

  // El dossier tiene varias páginas (/, /encuentros/, …) que comparten los mismos archivos,
  // así que todas las rutas van absolutas desde la raíz del sitio.
  const abs = Object.fromEntries(Object.entries(url).map(([k, v]) => [k, '/' + v]));
  const ctx = {
    url: abs, cat: comp.cat, logo: comp.logo,
    media: mediaRenderer(mapa, esc, '/'),
    css: await cssInline([path.join(SRC, 'compartido/css/base.css'), path.join(SRC, 'dossier/dossier.css')], abs),
    scriptInicial: SCRIPT_INICIAL,
    head: { iconos: headIconos(comp.iconos, sitio, '/') },
  };
  await salida.fijo('index.html', Buffer.from(renderDossier(c, sitio, ctx)));
  const paginas = paginasDossier(c);
  for (const p of paginas) {
    if (!/^[a-z0-9-]+$/.test(p.slug || '')) throw new Error(`recorrido.paginas: el slug "${p.slug}" tiene que ser minúsculas, números y guiones`);
    await salida.fijo(`${p.slug}/index.html`, Buffer.from(renderDossier(c, sitio, ctx, p)));
  }
  await extrasDossier(salida, sitio, { hashScriptInicial: hashScriptInicial(), ctx, secciones: seccionesMenu(c), rutas: ['/', ...paginas.map((p) => rutaPagina(p.slug))] });
  return salida;
}

/* ---------- la página de links (se suma en el paso siguiente) ---------- */
export async function construirLinks() {
  try {
    const mod = await import('../src/links/plantilla.mjs');
    return mod.construirLinks({ RAIZ, CACHE, CONTENIDO, SRC, DIST, Salida, recursosCompartidos, prepararMedios, mediaRenderer, cssInline, jsConHash, SCRIPT_INICIAL, hashScriptInicial: hashScriptInicial(), headIconos, leerJson, leer, leerTexto });
  } catch (e) {
    if (e.code === 'ERR_MODULE_NOT_FOUND') return null;
    throw e;
  }
}

export async function construir() {
  const t0 = Date.now();
  const d = await construirDossier();
  const l = await construirLinks();
  const resumen = (nombre, s) => s && console.log(`  ${nombre}: ${s.escritos.size} archivos, ${kb(s.bytes)} (index.html ${kb(s.escritos.get('index.html') || 0)})`);
  console.log(`Build listo en ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  resumen('dist/dossier', d);
  resumen('dist/links', l);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  construir().catch((e) => { console.error(e); process.exit(1); });
}
