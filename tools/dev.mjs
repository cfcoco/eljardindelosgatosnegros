/* ==========================================================================
   Servidor local: npm run dev
   Sirve dist/ y vuelve a armar el sitio cuando cambia algo en contenido/ o src/.
   El dossier queda en http://localhost:5173/ y la página de links en /links/.
   También se puede abrir desde el celular, en la misma red wifi, con la IP
   que se muestra al arrancar.
   ========================================================================== */
import http from 'node:http';
import { promises as fs, watch } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(RAIZ, 'dist');
const PUERTO = Number(process.env.PORT) || 5173;

/* El build corre en un proceso aparte para que cada vez se lean las plantillas
   y los módulos frescos (si se importara acá, Node los dejaría en caché). */
function construir() {
  return new Promise((res, rej) => {
    const p = spawn(process.execPath, [path.join(RAIZ, 'tools/build.mjs')], { stdio: 'inherit' });
    p.on('exit', (code) => (code === 0 ? res() : rej(new Error('el build terminó con código ' + code))));
    p.on('error', rej);
  });
}
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.ico': 'image/x-icon', '.mp4': 'video/mp4',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
};

let armando = null, pendiente = false;
async function rearmar(motivo) {
  if (armando) { pendiente = true; return; }
  armando = (async () => {
    try { console.log(`\n→ ${motivo}`); await construir(); }
    catch (e) { console.error('Error en el build:', e.message); }
  })();
  await armando; armando = null;
  if (pendiente) { pendiente = false; rearmar('cambios acumulados'); }
}

async function servir(req, res) {
  const u = new URL(req.url, 'http://x');
  let ruta = decodeURIComponent(u.pathname);
  let base = 'dossier', raizDir = DIST;
  if (ruta === '/links' || ruta.startsWith('/links/')) { base = 'links'; ruta = ruta.slice('/links'.length) || '/'; }
  // Solo en desarrollo: el original de claude.ai, para comparar lado a lado (no se publica).
  if (ruta.startsWith('/_origen/')) { raizDir = RAIZ; base = '_origen'; ruta = ruta.slice('/_origen'.length); }
  // Solo en desarrollo: acá no hay PHP, así que el formulario "Quiero enterarme primero"
  // recibe un {ok:true} de mentira (no guarda nada). En Hostinger corre api/anotate.php de verdad.
  if (req.method === 'POST' && base === 'links' && ruta === '/api/anotate.php') {
    let cuerpo = ''; for await (const trozo of req) cuerpo += trozo;
    console.log('  (dev) POST api/anotate.php (simulado, no se guarda):', cuerpo.slice(0, 400));
    await new Promise((r) => setTimeout(r, 700));
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end('{"ok":true}');
  }
  if (ruta.endsWith('/')) ruta += 'index.html';
  const abs = path.join(raizDir, base, ruta);
  if (!abs.startsWith(path.join(raizDir, base))) { res.writeHead(403); return res.end(); }
  try {
    const buf = await fs.readFile(abs);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(buf);
  } catch {
    try {
      const n = await fs.readFile(path.join(raizDir, base, '404.html'));
      res.writeHead(404, { 'Content-Type': MIME['.html'] }); res.end(n);
    } catch { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('404'); }
  }
}

await rearmar('build inicial');
let timer = null;
for (const dir of ['contenido', 'src']) {
  watch(path.join(RAIZ, dir), { recursive: true }, (_, archivo) => {
    clearTimeout(timer);
    timer = setTimeout(() => rearmar(`cambió ${dir}/${archivo || ''}`), 300);
  });
}
http.createServer(servir).listen(PUERTO, '0.0.0.0', () => {
  const ips = Object.values(os.networkInterfaces()).flat().filter((i) => i && i.family === 'IPv4' && !i.internal).map((i) => i.address);
  console.log(`\nDossier:  http://localhost:${PUERTO}/`);
  console.log(`Links:    http://localhost:${PUERTO}/links/`);
  console.log(`Original: http://localhost:${PUERTO}/_origen/dossier/  (solo para comparar)`);
  for (const ip of ips) console.log(`Celular:  http://${ip}:${PUERTO}/`);
});
