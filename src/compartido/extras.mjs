/* ==========================================================================
   Archivos de acompañamiento de cada sitio: 404, robots.txt, sitemap.xml,
   site.webmanifest y .htaccess (https, caché, compresión y seguridad).
   ========================================================================== */
import { esc } from '../dossier/plantilla.mjs';

function hoy() { return new Date().toISOString().slice(0, 10); }

export function pagina404(sitio, { base, urlGabarito, urlTrazo, urlIsologo, volverA }) {
  return `<!DOCTYPE html>
<html lang="${sitio.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Página no encontrada · ${esc(sitio.nombre)}</title>
<meta name="robots" content="noindex">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>
@font-face{font-family:"Gabarito";src:url("${urlGabarito}") format("woff2");font-weight:400 900;font-display:swap}
@font-face{font-family:"Trazo";src:url("${urlTrazo}") format("woff2");font-display:swap}
*{box-sizing:border-box}
body{margin:0;min-height:100svh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 24px;background:#F1F0EB;color:#010101;font-family:Gabarito,system-ui,sans-serif;line-height:1.5}
img{width:min(40vw,160px);height:auto}
.eyebrow{font-weight:500;font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:#70293C;margin-top:34px}
h1{font-family:Trazo,Gabarito,serif;font-weight:400;font-size:clamp(34px,9vw,56px);line-height:1.15;color:#70293C;margin:14px 0 10px}
p{margin:0 0 30px;font-size:18px;max-width:420px}
a{display:inline-block;padding:16px 28px;border-radius:999px;background:#70293C;color:#F1F0EB;text-decoration:none;font-weight:500;letter-spacing:.06em}
</style>
</head>
<body>
<img src="${urlIsologo}" alt="Gato negro del club" width="160" height="102">
<div class="eyebrow">Error 404</div>
<h1>Este rincón del jardín no existe</h1>
<p>La página que buscás no está o cambió de lugar.</p>
<a href="${volverA}">Volver al inicio</a>
</body>
</html>
`;
}

export function robots(base) {
  return `User-agent: *\nAllow: /\n\nSitemap: ${base}sitemap.xml\n`;
}

export function sitemap(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${u}</loc><lastmod>${hoy()}</lastmod></url>`).join('\n') + '\n</urlset>\n';
}

export function webmanifest(sitio, iconos) {
  return JSON.stringify({
    name: sitio.nombre,
    short_name: 'El Jardín',
    lang: sitio.lang,
    start_url: '/',
    display: 'browser',
    background_color: '#F1F0EB',
    theme_color: sitio.colorTema,
    icons: [
      { src: '/' + iconos.png192, sizes: '192x192', type: 'image/png' },
      { src: '/' + iconos.png512, sizes: '512x512', type: 'image/png' },
    ],
  }, null, 1);
}

/**
 * .htaccess para Hostinger (Apache/LiteSpeed compartido).
 * - https obligatorio y sin www
 * - compresión
 * - caché larga para archivos con hash, corta para HTML e íconos sin hash
 * - página 404 propia
 * - cabeceras de seguridad con una CSP acotada a lo que el sitio usa
 */
export function htaccess(sitio, { host, hashesScript = [], conservarRuta = true }) {
  const csp = [
    "default-src 'self'",
    `script-src 'self' ${hashesScript.map((h) => `'${h}'`).join(' ')}`.trim(),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "media-src 'self' blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self' https://wa.me",
    "object-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
  return `# ${sitio.nombre} · generado por tools/build.mjs (no editar a mano en el servidor)
AddDefaultCharset UTF-8
Options -Indexes
ServerSignature Off

# Tipos de archivo
AddType font/woff2 .woff2
AddType image/webp .webp
AddType image/svg+xml .svg
AddType application/manifest+json .webmanifest
AddType video/mp4 .mp4

# Nunca servir la carpeta .git ni archivos ocultos (salvo .well-known, que usa el certificado SSL)
RedirectMatch 404 /\\.(?!well-known/)

# Siempre https y en el host exacto (sin www ni dominios temporales)
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} !=on [OR]
  RewriteCond %{HTTP_HOST} !^${host}$ [NC]
  RewriteRule ^ https://${host}${conservarRuta ? '%{REQUEST_URI}' : '/'} [L,R=301]
</IfModule>

# Página de error propia
ErrorDocument 404 /404.html

# Compresión
<IfModule mod_brotli.c>
  AddOutputFilterByType BROTLI_COMPRESS text/html text/plain text/css text/javascript application/javascript application/json application/manifest+json application/xml image/svg+xml
</IfModule>
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/css text/javascript application/javascript application/json application/manifest+json application/xml image/svg+xml
</IfModule>

<IfModule mod_headers.c>
  # Archivos con hash en el nombre: caché de un año
  <FilesMatch "\\.(css|js|woff2|webp|jpg|jpeg|png|svg|mp4)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  # Íconos e imagen para compartir (sin hash): un día
  <FilesMatch "^(favicon\\.(ico|svg)|favicon-32\\.png|apple-touch-icon\\.png|icon-\\d+\\.png|og-[a-z]+\\.jpg)$">
    Header set Cache-Control "public, max-age=86400"
  </FilesMatch>
  # HTML y archivos de configuración: siempre revalidar
  <FilesMatch "\\.(html|webmanifest|xml|txt)$">
    Header set Cache-Control "no-cache"
  </FilesMatch>

  # Seguridad
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
  Header always set Content-Security-Policy "${csp}"
  Header always set Cross-Origin-Opener-Policy "same-origin"
</IfModule>
`;
}

// Ruta absoluta desde la raíz del sitio (el dossier ya las trae con "/", la página de links no).
const raiz = (u) => (u.startsWith('/') ? u : '/' + u);

/** Escribe todos los extras del dossier en su carpeta de salida. `rutas` son las páginas del sitemap. */
export async function extrasDossier(salida, sitio, { hashScriptInicial, ctx, rutas = ['/'] }) {
  const base = `https://${sitio.dominio}/`;
  await salida.fijo('404.html', Buffer.from(pagina404(sitio, { base, urlGabarito: raiz(ctx.url.gabarito), urlTrazo: raiz(ctx.url.trazo), urlIsologo: raiz(ctx.url.isologo), volverA: '/' })));
  await salida.fijo('robots.txt', Buffer.from(robots(base)));
  await salida.fijo('sitemap.xml', Buffer.from(sitemap(rutas.map((r) => new URL(r, base).href))));
  await salida.fijo('site.webmanifest', Buffer.from(webmanifest(sitio, iconosDe(salida))));
  await salida.fijo('.htaccess', Buffer.from(htaccess(sitio, { host: sitio.dominio, hashesScript: [hashScriptInicial] })));
}

/** Idem para la página de links (subdominio). */
export async function extrasLinks(salida, sitio, { hashScriptInicial, ctx }) {
  const host = `${sitio.subdominioLinks}.${sitio.dominio}`;
  const base = `https://${host}/`;
  await salida.fijo('404.html', Buffer.from(pagina404(sitio, { base, urlGabarito: '/' + ctx.url.gabarito, urlTrazo: '/' + ctx.url.trazo, urlIsologo: '/' + ctx.url.isologo, volverA: '/' })));
  await salida.fijo('robots.txt', Buffer.from(robots(base)));
  await salida.fijo('sitemap.xml', Buffer.from(sitemap([base])));
  await salida.fijo('site.webmanifest', Buffer.from(webmanifest(sitio, iconosDe(salida))));
  await salida.fijo('.htaccess', Buffer.from(htaccess(sitio, { host, hashesScript: [hashScriptInicial], conservarRuta: false })));
}

function iconosDe(salida) {
  const tiene = (n) => salida.escritos.has(n) ? n : null;
  return { png192: tiene('icon-192.png') || 'icon-192.png', png512: tiene('icon-512.png') || 'icon-512.png' };
}
