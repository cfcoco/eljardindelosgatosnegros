/* ==========================================================================
   Procesamiento de fotos, videos, fuentes y SVG para el build.
   Todo lo pesado se guarda en .cache/ para que el segundo build sea rápido.
   ========================================================================== */
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import subsetFont from 'subset-font';
import { optimize as svgoOptimize } from 'svgo';

export const ANCHOS = [640, 800, 1080, 1600, 2400];
const CALIDAD_WEBP = 78;
const CALIDAD_POSTER = 75;

export function hashCorto(buf, n = 8) {
  return createHash('sha256').update(buf).digest('hex').slice(0, n);
}

async function conCache(cacheDir, clave, ext, generar) {
  const archivo = path.join(cacheDir, `${clave}.${ext}`);
  try { return await fs.readFile(archivo); } catch { /* no está */ }
  const buf = await generar();
  await fs.mkdir(cacheDir, { recursive: true });
  await fs.writeFile(archivo, buf);
  return buf;
}

/** Lee ancho y alto de una imagen (jpg, png, webp, svg). */
export async function medidas(buf) {
  const m = await sharp(buf).metadata();
  return { width: m.width, height: m.height, pages: m.pages || 1, format: m.format };
}

/**
 * Foto normal → variantes WebP en varios anchos (sin agrandar nunca).
 * Devuelve { width, height, variantes: [{ w, buf }] } ordenadas de menor a mayor.
 */
export async function procesarFoto(buf, { cacheDir, anchos = ANCHOS, calidad = CALIDAD_WEBP } = {}) {
  const { width, height } = await medidas(buf);
  const base = hashCorto(buf, 16);
  const maxAncho = Math.min(width, anchos[anchos.length - 1]);
  const lista = [...new Set([...anchos.filter((w) => w < maxAncho), maxAncho])].sort((a, b) => a - b);
  const variantes = [];
  for (const w of lista) {
    const out = await conCache(cacheDir, `${base}-${w}-q${calidad}`, 'webp', () =>
      sharp(buf).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: calidad, effort: 4 }).toBuffer()
    );
    variantes.push({ w, buf: out });
  }
  return { width, height, variantes };
}

/** Póster de video → un solo WebP liviano. */
export async function procesarPoster(buf, { cacheDir, maxAncho = 1920 } = {}) {
  const { width, height } = await medidas(buf);
  const base = hashCorto(buf, 16);
  const w = Math.min(width, maxAncho);
  const out = await conCache(cacheDir, `${base}-poster-${w}`, 'webp', () =>
    sharp(buf).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: CALIDAD_POSTER, effort: 4 }).toBuffer()
  );
  return { width, height, buf: out };
}

/** WebP animado (el gato, la gata con lentes): se vuelve a comprimir, opcionalmente achicado. */
export async function procesarAnimado(buf, { cacheDir, maxAncho = null, calidad = 80 } = {}) {
  const meta = await sharp(buf, { animated: true }).metadata();
  const width = meta.width, height = meta.pageHeight || meta.height;
  const w = maxAncho ? Math.min(width, maxAncho) : width;
  const base = hashCorto(buf, 16);
  const out = await conCache(cacheDir, `${base}-anim-${w}-q${calidad}`, 'webp', async () => {
    let p = sharp(buf, { animated: true });
    if (w < width) p = p.resize({ width: w });
    const r = await p.webp({ quality: calidad, effort: 4 }).toBuffer();
    return r.length < buf.length ? r : buf; // si no mejora, se deja el original
  });
  const h = Math.round(height * (w / width));
  return { width: w, height: h, buf: out };
}

/**
 * Subset de una fuente a los caracteres que usa el sitio y conversión a WOFF2.
 * Cubre español rioplatense completo: letras, tildes, ñ, ¿¡, comillas «» “” ‘’,
 * guiones – —, puntos suspensivos, el punto medio ·, &, @, €, º ª, números y signos.
 */
const CARACTERES = (() => {
  let s = '';
  for (let c = 0x20; c <= 0x7e; c++) s += String.fromCharCode(c); // ASCII imprimible
  for (let c = 0xa0; c <= 0xff; c++) s += String.fromCharCode(c); // Latin-1: tildes, ñ, ¿ ¡ « » · º ª
  s += '–—‘’‚“”„•…€™←↑→↓ ';
  return s;
})();
export async function fuenteWoff2(buf, { cacheDir, texto = CARACTERES } = {}) {
  const base = hashCorto(Buffer.concat([buf, Buffer.from(texto)]), 16);
  return conCache(cacheDir, `${base}-subset`, 'woff2', () => subsetFont(buf, texto, { targetFormat: 'woff2' }));
}

/**
 * Logotipo SVG → su interior (las letras), sin colores fijos, para incrustarlo
 * en la portada y animarlo letra por letra. Hereda el color con currentColor.
 * Se optimiza con SVGO sin tocar la geometría de forma visible.
 */
export function logotipoInline(svgTexto) {
  const opt = svgoOptimize(svgTexto, {
    multipass: true,
    floatPrecision: 2,
    plugins: [
      { name: 'preset-default', params: { overrides: { cleanupIds: false, mergePaths: false } } },
      { name: 'removeAttrs', params: { attrs: ['path:(fill|stroke|stroke-width|stroke-linejoin)', 'svg:(width|height)'] } },
    ],
  }).data;
  const viewBox = /viewBox="([^"]+)"/.exec(opt)?.[1];
  const [, , w, h] = viewBox.split(/\s+/).map(Number);
  const interior = opt.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  return { viewBox, interior, width: Math.round(w), height: Math.round(h) };
}

/** SVG chico que se sirve como archivo (el gatito de las viñetas). */
export function svgOptimizado(svgTexto, precision = 2) {
  return svgoOptimize(svgTexto, {
    multipass: true,
    floatPrecision: precision,
    plugins: ['preset-default'],
  }).data;
}

/* ---------- videos ----------
   Se recomprimen en H.264 (preset veryfast, CRF 27), sin audio, con faststart
   para que arranquen enseguida, y se achican si pasan el ancho máximo.
   Usa el ffmpeg que trae ffmpeg-static (solo en el build, no en el servidor). */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createRequire } from 'node:module';
const execFileP = promisify(execFile);

export async function procesarVideo(buf, { cacheDir, maxAncho = 1600, crf = 27 } = {}) {
  const base = hashCorto(buf, 16);
  // Salida determinista: el mismo original tiene que dar los mismos bytes en cualquier
  // máquina (GitHub Actions no tiene caché y publica el archivo con hash en el nombre).
  // x264 cambia el resultado según la cantidad de hilos, y ffmpeg graba su versión en
  // los metadatos; por eso un solo hilo, sin metadatos y en modo "bitexact".
  return conCache(cacheDir, `${base}-w${maxAncho}-crf${crf}-det`, 'mp4', async () => {
    const ffmpeg = createRequire(import.meta.url)('ffmpeg-static');
    await fs.mkdir(cacheDir, { recursive: true });
    const entrada = path.join(cacheDir, `${base}.in.mp4`), salida = path.join(cacheDir, `${base}.out.mp4`);
    await fs.writeFile(entrada, buf);
    await execFileP(ffmpeg, [
      '-y', '-hide_banner', '-loglevel', 'error', '-i', entrada, '-an',
      '-vf', `scale='min(${maxAncho},iw)':-2`,
      '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'veryfast', '-crf', String(crf), '-pix_fmt', 'yuv420p',
      '-threads', '1', '-map_metadata', '-1', '-fflags', '+bitexact', '-flags:v', '+bitexact',
      '-movflags', '+faststart', salida,
    ]);
    const out = await fs.readFile(salida);
    await fs.rm(entrada, { force: true }); await fs.rm(salida, { force: true });
    return out.length < buf.length ? out : buf; // si no mejora, se deja el original
  });
}
