/* ==========================================================================
   Página de links (subdominio) · plantilla HTML y armado.
   Datos: contenido/links.json + contenido/sitio.json. Si un campo está vacío,
   esa línea no aparece.
   ========================================================================== */
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { esc } from '../dossier/plantilla.mjs';

/** Rutas relativas (con /) de todos los archivos bajo `dir`, en orden estable. */
async function listarArchivos(dir, base = dir) {
  let lista = [];
  for (const ent of (await fs.readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) lista = lista.concat(await listarArchivos(abs, base));
    else lista.push(path.relative(base, abs).split(path.sep).join('/'));
  }
  return lista;
}
import { extrasLinks } from '../compartido/extras.mjs';

import { icono } from '../compartido/iconos.mjs';

const wa = (numero, texto) => `https://wa.me/${numero}?text=${encodeURIComponent(texto || '')}`;

export function renderLinks(c, sitio, ctx) {
  const seo = sitio.seo.links;
  const host = `${sitio.subdominioLinks}.${sitio.dominio}`;
  const base = `https://${host}/`;
  const dossierUrl = `https://${sitio.dominio}/`;
  const e = c.encuentro || {}, b = c.botones || {}, pie = c.pie || {}, cab = c.cabecera || {};
  const emailHtml = (sitio.email || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace('@', '<wbr>@');
  const og = ctx.url.og ? base + ctx.url.og : null;

  /* Bloque del próximo encuentro. Con `titular` + `boton` + formulario, el botón abre el
     formulario paso a paso (src/links/anotate.js) dentro del mismo recuadro. Si algún día
     vuelve `botonReserva` sin formulario, el botón lleva a WhatsApp como antes. */
  const f = c.formulario || {};
  const conForm = !!(e.boton && f.endpoint);
  const cfgForm = conForm ? JSON.stringify({
    endpoint: f.endpoint, origen: f.origen || 'bios',
    textos: { privacidad: f.privacidad || '', preguntas: f.preguntas || {}, ayudas: f.ayudas || {}, botones: f.botones || {}, errores: f.errores || {}, final: f.final || {} },
    foto: f.foto ? ctx.media(f.foto, { lazy: true }) : '',
  }).replace(/</g, '\\u003c') : '';
  const mensajeWa = e.mensajeReserva || (b.whatsapp && b.whatsapp.mensaje) || '';
  const encuentro = (e.titular || e.libro || e.autor || e.fecha) ? `
    <section class="bloque bordo encuentro sube" data-d="900" aria-label="${esc(e.titulo || 'Próximo encuentro')}">
      <div class="caja" id="anotate">
      <p class="serie"><span class="tz">${esc(e.titulo || 'Próximo encuentro')}</span>${e.numero ? `<span class="n">${esc(e.numero)}</span>` : ''}</p>
      ${e.titular ? `<h2 class="t fit">${esc(e.titular)}</h2>` : ''}
      ${e.texto ? `<p class="d">${esc(e.texto)}</p>` : ''}
      ${e.libro ? `<p class="libro">${esc(e.libro)}</p>` : ''}
      ${e.autor ? `<p class="autor">${esc(e.autor)}</p>` : ''}
      ${(e.fecha || e.lugar) ? `<ul class="datos">${e.fecha ? `<li><b>Cuándo</b><span>${esc(e.fecha)}</span></li>` : ''}${e.lugar ? `<li><b>Dónde</b><span>${esc(e.lugar)}</span></li>` : ''}</ul>` : ''}
      ${e.cupos ? `<p class="cupos">${esc(e.cupos)}</p>` : ''}
      ${conForm ? `<button class="cta" type="button" id="abrir-anotate">${esc(e.boton)}</button><noscript><a class="cta" href="${esc(wa(sitio.whatsapp, mensajeWa))}" target="_blank" rel="noopener">${esc(e.boton)}</a></noscript>`
        : (e.botonReserva ? `<a class="reserva" href="${esc(wa(sitio.whatsapp, e.mensajeReserva))}" target="_blank" rel="noopener">${esc(e.botonReserva)} ${icono('fl', 'flr')}</a>` : '')}
      </div>
      ${conForm ? `<input class="hp" type="text" name="web" tabindex="-1" autocomplete="off" aria-hidden="true"><script type="application/json" id="anotate-cfg">${cfgForm}</script>` : ''}
    </section>` : '';


  const botones = [
    b.whatsapp && sitio.whatsapp ? `
    <a class="bloque bordo link sube" data-d="1000" href="${esc(wa(sitio.whatsapp, b.whatsapp.mensaje))}" target="_blank" rel="noopener">
      ${icono('wa', 'ico')}
      <span class="txt"><span class="t">${esc(b.whatsapp.titulo || 'WhatsApp')}</span>${b.whatsapp.bajada ? `<span class="s">${esc(b.whatsapp.bajada)}</span>` : ''}</span>
      ${icono('fl', 'fl')}</a>` : '',
    b.dossier ? `
    <a class="bloque bordo link sube" data-d="1100" href="${dossierUrl}">
      ${icono('libro', 'ico')}
      <span class="txt"><span class="t">${esc(b.dossier.titulo || 'Colaborá con el club')}</span>${b.dossier.bajada ? `<span class="s">${esc(b.dossier.bajada)}</span>` : ''}</span>
      ${icono('fl', 'fl')}</a>` : '',
    b.email && sitio.email ? `
    <a class="bloque bordo link sube" data-d="1200" href="mailto:${esc(sitio.email)}?subject=${encodeURIComponent(b.email.asunto || '')}">
      ${icono('carta', 'ico')}
      <span class="txt"><span class="t">${esc(b.email.titulo || 'Email')}</span><span class="s fit">${esc(sitio.email)}</span></span>
      ${icono('fl', 'fl')}</a>` : '',
  ].join('');

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: seo.titulo,
    url: base,
    description: seo.descripcion,
    isPartOf: { '@type': 'WebSite', name: sitio.nombre, url: dossierUrl },
    about: { '@type': 'Organization', name: sitio.nombre, url: dossierUrl, sameAs: sitio.instagram ? [`https://www.instagram.com/${sitio.instagram}/`] : undefined },
  };

  return `<!DOCTYPE html>
<html lang="${sitio.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(seo.titulo)}</title>
<meta name="description" content="${esc(seo.descripcion)}">
<link rel="canonical" href="${base}">
<meta name="theme-color" content="${sitio.colorTema}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(sitio.nombre)}">
<meta property="og:locale" content="${sitio.locale}">
<meta property="og:url" content="${base}">
<meta property="og:title" content="${esc(seo.titulo)}">
<meta property="og:description" content="${esc(seo.descripcion)}">
${og ? `<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(sitio.nombre)} · Club de lectura · ${esc(sitio.lugar.localidad)}, ${esc(sitio.lugar.provincia)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${og}">` : '<meta name="twitter:card" content="summary">'}
<meta name="twitter:title" content="${esc(seo.titulo)}">
<meta name="twitter:description" content="${esc(seo.descripcion)}">
${ctx.head.iconos}
<link rel="preload" href="${ctx.url.gabarito}" as="font" type="font/woff2" crossorigin>
<style>${ctx.css}</style>
<script>${ctx.scriptInicial}</script>
<script defer src="${ctx.url.js}"></script>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body data-cat='${JSON.stringify({ intro: ctx.url.catIntro, anim: ctx.url.catAnim })}'>
<header class="cab${cab.video ? ' con-video' : ''}">
  ${cab.eb ? `<p class="eyebrow fit">${esc(cab.eb)}</p>` : ''}
  ${cab.video ? `<div class="intro">${ctx.media(cab.video, { loop: false, preload: 'auto', clase: 'intro-video' })}</div>` : `<div class="mark" title="Tocá para verlo escribirse de nuevo">
    <span class="cat-box"><img class="cat" src="${ctx.url.catQuieto}" alt="Gato negro del Jardín" width="${ctx.cat.width}" height="${ctx.cat.height}" fetchpriority="high"><img class="cat-anim" alt="" aria-hidden="true" width="${ctx.cat.width}" height="${ctx.cat.height}" hidden></span>
    <svg class="name" role="img" aria-label="El jardín de los gatos negros" viewBox="${ctx.logo.viewBox}" fill="currentColor">${ctx.logo.interior}</svg>
  </div>`}
  ${cab.bienvenida ? `<p class="bienvenida fit sube" data-d="700">${esc(cab.bienvenida)}</p>` : ''}
</header>
<main>
  <div class="bloques">${encuentro}${botones}
  </div>
</main>
<footer><div class="pie sube" data-d="1300">
  <div class="chau">${pie.frase ? `<p class="fit">${esc(pie.frase).replace(/\n/g, ' ')}</p>` : ''}${pie.foto ? ctx.media(pie.foto, { lazy: true }) : ''}</div>
  ${pie.firma ? `<p class="credit"><span class="por">${esc(pie.firma)}</span>${pie.rol ? ` · <span>${esc(pie.rol)}</span>` : ''}</p>` : ''}
</div></footer>
<noscript><style>.sube{opacity:1;transform:none}.chau p{clip-path:none}.chau img{opacity:1;transform:none}</style></noscript>
</body>
</html>
`;
}

/** Armado completo de dist/links. Recibe las herramientas del build principal. */
export async function construirLinks(t) {
  const sitio = await t.leerJson(path.join(t.CONTENIDO, 'sitio.json'));
  const c = await t.leerJson(path.join(t.CONTENIDO, 'links.json'));
  const salida = new t.Salida(path.join(t.DIST, 'links'));
  await salida.limpiar();
  const comp = await t.recursosCompartidos(salida);
  const medios = [c.cabecera && c.cabecera.video, c.pie && c.pie.foto, c.formulario && c.formulario.foto].filter(Boolean);
  const mapa = await t.prepararMedios(salida, medios);
  /* Backend en PHP (api/ y admin/): se copia tal cual, sin hash, porque son direcciones fijas. */
  const phpDir = path.join(t.SRC, 'links/php');
  for (const rel of await listarArchivos(phpDir)) await salida.fijo(rel, await t.leer(path.join(phpDir, rel)));
  const url = { ...comp.url };
  url.js = await t.jsConHash(salida, path.join(t.SRC, 'links/links.js'), 'links');
  try { url.og = await salida.fijo('og-links.jpg', await t.leer(path.join(t.SRC, 'links/og-links.jpg'))); }
  catch { console.warn('  (aviso) falta src/links/og-links.jpg: la vista previa al compartir queda sin imagen. Corré node tools/og.mjs'); }
  const ctx = {
    url, cat: comp.cat, logo: comp.logo,
    media: t.mediaRenderer(mapa, esc),
    css: await t.cssInline([path.join(t.SRC, 'compartido/css/base.css'), path.join(t.SRC, 'links/links.css')], url),
    scriptInicial: t.SCRIPT_INICIAL,
    head: { iconos: t.headIconos(comp.iconos, sitio) },
  };
  await salida.fijo('index.html', Buffer.from(renderLinks(c, sitio, ctx)));
  await extrasLinks(salida, sitio, { hashScriptInicial: t.hashScriptInicial, ctx });
  return salida;
}
