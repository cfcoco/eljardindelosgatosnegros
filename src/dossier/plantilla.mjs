/* ==========================================================================
   Dossier · plantilla HTML.
   Recibe el contenido (contenido/dossier.json), los datos del sitio y un
   contexto con las fotos ya procesadas, y devuelve el HTML completo de cada
   página: el inicio (/) y las páginas del recorrido (/encuentros/, …).
   Cada bloque dice en qué página va con `pagina`; sin ese campo, va al inicio.
   Reproduce el marcado del dossier original sin el modo edición.
   ========================================================================== */
import { icono } from '../compartido/iconos.mjs';

export const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const limpio = (t) => String(t || '').replace(/[​ ]/g, ' ').replace(/\s+/g, ' ').trim();
export const slug = (t) => limpio(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const parrafos = (s) => String(s || '').split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
const pad = (n) => ('0' + n).slice(-2);

/** Páginas del recorrido (además del inicio). */
export const paginasDossier = (c) => (c.recorrido && c.recorrido.paginas) || [];
/** Ruta de una página: '/' para el inicio, '/slug/' para las demás. */
export const rutaPagina = (slugPag) => (slugPag ? `/${slugPag}/` : '/');

/** Lista de fotos y videos que el build tiene que procesar antes de renderizar. */
export function mediosDossier(c) {
  const lista = [];
  for (const b of c.blocks) {
    if (b.imgs) lista.push(...b.imgs);
    if (b.side) lista.push(b.side);
  }
  return lista;
}

/** Secciones que van al menú: Inicio, cada bloque de texto con etiqueta (con la
    página en la que está), Contacto. El menú es el mismo en todas las páginas. */
export function seccionesMenu(c) {
  const usados = new Set(['inicio', 'contacto']);
  const items = [{ t: 'Inicio', id: 'inicio', pagina: null }];
  c.blocks.forEach((b, i) => {
    const t = limpio(b.eb);
    if ((b.type === 'text' || b.type === 'manif') && t) {
      let id = slug(t) || 'seccion-' + i, base = id, n = 2;
      while (usados.has(id)) id = base + '-' + n++;
      usados.add(id);
      items.push({ t, id, i, pagina: b.pagina || null });
    }
  });
  items.push({ t: 'Contacto', id: 'contacto', pagina: 'actual' });
  return items;
}

const SIZES = {
  full: '(min-width:1180px) 1180px, 100vw',
  bleed: '100vw',
  duo: '(min-width:1180px) 590px, 50vw',
  side: '(min-width:860px) 50vw, 100vw',
};

function textBlock(b, id, ctx) {
  const th = b.theme || 'crema';
  let h = '';
  if (b.eb) h += `<div class="eyebrow${th === 'crema' ? ' color-bordo' : ''}">${esc(b.eb)}</div>`;
  if (b.phrase) h += `<p class="trazo big-phrase">${esc(b.phrase)}</p>`;
  if (b.h2) h += `<h2>${esc(b.h2)}</h2>`;
  if (b.lead) h += `<p class="lead">${esc(b.lead)}</p>`;
  h += parrafos(b.body).map((p) => `<p>${esc(p)}</p>`).join('');
  const steps = b.steps || [];
  if (steps.length) {
    const mk = b.mk || 'num';
    h += `<ul class="steps${mk !== 'num' ? ' mk' : ''}">`;
    steps.forEach((x, k) => {
      const n = mk === 'gato' ? `<span class="n mk-gato"><img src="${ctx.url.isologo}" alt="" width="20" height="13"></span>`
        : mk === 'punto' ? '<span class="n mk-punto"></span>'
        : mk === 'cuadro' ? '<span class="n mk-cuadro"></span>'
        : `<span class="n">${pad(k + 1)}</span>`;
      h += `<li>${n}<div>${x.t ? `<b>${esc(x.t)}</b>` : ''}${x.d ? `<span>${esc(x.d)}</span>` : ''}</div></li>`;
    });
    h += '</ul>';
  }
  h += parrafos(b.after).map((p) => `<p class="honest">${esc(p)}</p>`).join('');
  if (b.note) h += `<p class="note">${esc(b.note)}</p>`;
  const side = b.side ? `<figure class="side rv">${ctx.media(b.side, { sizes: SIZES.side, lazy: true })}</figure>` : '';
  const cls = side ? ' has-side' : '';
  const idAttr = id ? ` id="${id}"` : '';
  if (th === 'negro') return `<section class="offer${cls}"${idAttr}><div class="text">${h}</div>${side}</section>`;
  if (th === 'bordo') return `<section class="tbordo${cls}"${idAttr}><div class="text">${h}</div>${side}</section>`;
  if (side) return `<section class="tcrema${cls}"${idAttr}><div class="text">${h}</div>${side}</section>`;
  return `<section class="text"${idAttr}>${h}</section>`;
}

function manifBlock(b, id) {
  const idAttr = id ? ` id="${id}"` : '';
  return `<section class="manif"${idAttr}><div class="text">${b.eb ? `<div class="eyebrow">${esc(b.eb)}</div>` : ''}` +
    `<blockquote>${esc(b.q || '')}${b.qa ? ` <em>${esc(b.qa)}</em>` : ''}</blockquote>` +
    `${b.firma ? `<div class="firma">${esc(b.firma)}</div>` : ''}</div></section>`;
}

/* ---------- recorrido: un recuadro que lleva a la página siguiente ----------
   Recuadro crema con borde, bordó o negro, con rótulo, frase en Trazo, dos líneas y
   un botón con flecha. Al tocarlo se corre 8 px a la derecha, como los links de la bio. */
function recuadro(p, ctx) {
  const th = p.theme || 'crema';
  const gato = p.mk === 'gato' ? `<span class="n mk-gato"><img src="${ctx.url.isologo}" alt="" width="20" height="13"></span>` : '';
  return `<a class="card c-${th}" href="${rutaPagina(p.slug)}">${gato}` +
    (p.eb ? `<span class="eyebrow">${esc(p.eb)}</span>` : '') +
    (p.phrase ? `<span class="trazo">${esc(p.phrase)}</span>` : '') +
    (p.body ? `<span class="d">${esc(p.body)}</span>` : '') +
    `<span class="btn">${esc(p.boton || p.nombre || 'Ver más')} ${icono('fl', 'fl')}</span></a>`;
}

/* El recorrido es una cadena: el inicio (pagina = null) lleva a la primera página, cada
   página a la siguiente y la última solo al contacto. Si la página destino tiene `intro`,
   va un título arriba del recuadro. En las páginas se suma "Volver al inicio". */
function seguirBlock(c, pagina, ctx) {
  const r = c.recorrido || {};
  const pags = paginasDossier(c);
  const k = pagina ? pags.findIndex((p) => p.slug === pagina.slug) : -1;
  const sig = pags[k + 1];
  if (!sig && !pagina) return '';
  let h = `<section class="seguir" id="recorrido">`;
  if (sig) {
    if (sig.intro && (sig.intro.eb || sig.intro.h2)) {
      h += `<div class="text">${sig.intro.eb ? `<div class="eyebrow color-bordo">${esc(sig.intro.eb)}</div>` : ''}${sig.intro.h2 ? `<h2>${esc(sig.intro.h2)}</h2>` : ''}</div>`;
    }
    h += recuadro(sig, ctx);
  }
  if (pagina) h += `<a class="volver" href="/">${esc(r.volver || 'Volver al inicio')}</a>`;
  return h + `</section>`;
}

const PALETTE = '<div class="palette rv">' +
  '<div class="sw" style="background:#F1F0EB;outline:1px solid rgba(1,1,1,.12);outline-offset:-1px"><b>Crema</b>#F1F0EB</div>' +
  '<div class="sw" style="background:#010101;color:#F1F0EB"><b>Negro</b>#010101</div>' +
  '<div class="sw" style="background:#70293C;color:#F1F0EB"><b>Bordó</b>#70293C</div>' +
  '<div class="sw" style="background:#016D71;color:#F1F0EB"><b>Verde petróleo</b>#016D71</div>' +
  '<div class="sw" style="background:#953651;color:#F1F0EB"><b>Frambuesa</b>#953651</div>' +
  '<div class="sw" style="background:#BE9BA5;color:#010101"><b>Rosa viejo</b>#BE9BA5</div></div>';
const FONTS = '<div class="type rv">' +
  '<div><div class="lbl">Trazo · letra propia</div><div class="aa trazo">Aa</div><div class="smp trazo">nos vemos entre las flores</div></div>' +
  '<div><div class="lbl">Gabarito · textos</div><div class="aa" style="font-weight:800">Aa</div><div class="smp" style="font-weight:500">Encuentro Nº 01 · Sábado 17 h · Villa Allende</div></div></div>';

/* Portada del inicio: gato + logotipo que se escribe. */
function portada(c, ctx) {
  return `<header class="cover" id="inicio">` +
    (c.cover.eb ? `<div class="eyebrow">${esc(c.cover.eb)}</div>` : '') +
    `<div class="mark"><span class="cat-box"><img class="cat" src="${ctx.url.catQuieto}" alt="Gato negro, isologo del club" width="${ctx.cat.width}" height="${ctx.cat.height}" fetchpriority="high"><img class="cat-anim" alt="" aria-hidden="true" width="${ctx.cat.width}" height="${ctx.cat.height}" hidden></span>` +
    `<svg class="name" role="img" aria-label="El jardín de los gatos negros" viewBox="${ctx.logo.viewBox}" fill="currentColor">${ctx.logo.interior}</svg></div>` +
    `<div class="down">${c.cover.place ? `<div class="pl">${esc(c.cover.place)}</div>` : ''}<span aria-hidden="true">↓</span></div></header>\n`;
}

/* Cabecera chica de las páginas del recorrido: el gato (vuelve al inicio) y el nombre de la página. */
function cabecera(c, pagina, ctx) {
  return `<header class="top" id="inicio"><a class="home" href="/" aria-label="Volver al inicio">` +
    `<img class="cat" src="${ctx.url.catQuieto}" alt="Gato negro, isologo del club" width="${ctx.cat.width}" height="${ctx.cat.height}" fetchpriority="high"></a>` +
    `<div class="eyebrow">${esc(c.cover.eb || '')}${c.cover.eb && pagina.nombre ? ' · ' : ''}${esc(pagina.nombre || '')}</div></header>\n`;
}

/* Cierre bordó: gato animado, logotipo crema, pregunta, botones y "Nos vemos entre las flores". */
function cierre(c, sitio, ctx) {
  const z = c.close;
  const ig = sitio.instagram, wa = sitio.whatsapp;
  const waUrl = `https://wa.me/${wa}?text=${encodeURIComponent(z.waMensaje || '')}`;
  const boton = (href, ico, t, s) => `<a href="${href}" target="_blank" rel="noopener">${icono(ico, 'ico')}<span class="txt"><span class="t">${esc(t)}</span><span class="s">${esc(s)}</span></span>${icono('fl', 'fl')}</a>`;
  let h = `<footer class="close" id="contacto"><div class="mark"><img class="cat" src="${ctx.url.catAnim}" alt="Gato negro del club" width="${ctx.cat.width}" height="${ctx.cat.height}" loading="lazy">` +
    `<img class="name" src="${ctx.url.logoCrema}" alt="El jardín de los gatos negros" width="${ctx.logo.width}" height="${ctx.logo.height}" loading="lazy"></div>` +
    (z.q ? `<p class="cta">${esc(z.q)}</p>` : '') + (z.qs ? `<p class="cta-sub">${esc(z.qs)}</p>` : '') +
    `<div class="contact">` +
    (ig ? boton(`https://www.instagram.com/${esc(ig)}/`, 'ig', 'Instagram', '@' + ig) : '') +
    (wa ? boton(esc(waUrl), 'wa', 'WhatsApp', sitio.whatsappVisible || wa) : '') +
    `</div>` + (z.phrase ? `<p class="trazo phrase">${esc(z.phrase)}</p>` : '') + `</footer>\n`;
  h += `<div class="credit">${z.name ? '<span class="por">Por </span>' : ''}<b class="who">${esc(z.name)}</b>${z.name && z.role ? '<span> · </span>' : ''}<span class="what">${esc(z.role)}</span></div>`;
  return h;
}

/** Cuerpo de una página. `pagina` es null para el inicio. */
export function cuerpoDossier(c, sitio, ctx, pagina = null) {
  const menu = seccionesMenu(c);
  const idDe = new Map(menu.filter((m) => m.i != null).map((m) => [m.i, m.id]));
  const actual = pagina ? pagina.slug : null;
  let h = pagina ? cabecera(c, pagina, ctx) : portada(c, ctx);

  let k = 0; // posición dentro de la página (para la primera foto y la carga perezosa)
  c.blocks.forEach((b, i) => {
    if ((b.pagina || null) !== actual) return;
    const id = idDe.get(i);
    if (b.type === 'text') h += textBlock(b, id, ctx);
    else if (b.type === 'manif') h += manifBlock(b, id);
    else if (b.type === 'seguir') h += seguirBlock(c, null, ctx);
    else if (b.type === 'palette') h += `<div class="wrap">${PALETTE}</div>`;
    else if (b.type === 'fonts') h += `<div class="wrap">${FONTS}</div>`;
    else if (b.type === 'full') {
      const m = b.imgs && b.imgs[0];
      h += `<div class="wrap${b.bleed ? ' bleed' : ''}"><figure class="full${b.flush ? '' : ' rv'}${k === 0 || b.flush ? ' first' : ''}">` +
        ctx.media(m, { sizes: b.bleed ? SIZES.bleed : SIZES.full, lazy: k > 1, prioridad: k === 0 }) + '</figure></div>';
    } else if (b.type === 'duo') {
      h += `<div class="wrap"><div class="duo ${b.r === 'sq' ? 'sq' : 'tall'} rv">`;
      for (let j = 0; j < 2; j++) {
        const m = (b.imgs || [])[j] || {};
        h += `<div${m.fit === 'contain' ? ' class="cell-c"' : ''}>${ctx.media(m, { sizes: SIZES.duo, lazy: k > 1 })}</div>`;
      }
      h += '</div></div>';
    }
    h += '\n';
    k++;
  });

  if (pagina) h += seguirBlock(c, pagina, ctx) + '\n';
  h += cierre(c, sitio, ctx);

  // Menú: ancla en la misma página (#id) o en otra (/pagina/#id). Contacto siempre es el de la página actual.
  const href = (m) => {
    const destino = m.pagina === 'actual' ? actual : m.pagina;
    if (destino === actual) return `#${m.id}`;
    return m.id === 'inicio' ? rutaPagina(destino) : `${rutaPagina(destino)}#${m.id}`;
  };
  const nav = `<button class="menu-btn" id="mb" type="button" aria-label="Ir a una sección" aria-expanded="false" aria-controls="mn"><span></span><span></span><span></span></button>\n` +
    `<nav class="menu" id="mn" hidden aria-label="Secciones">${menu.map((m) => `<a href="${href(m)}">${esc(m.t)}</a>`).join('')}</nav>`;
  return { cuerpo: h, nav };
}

/** Documento completo de una página. `pagina` es null para el inicio. */
export function renderDossier(c, sitio, ctx, pagina = null) {
  const { cuerpo, nav } = cuerpoDossier(c, sitio, ctx, pagina);
  const base = `https://${sitio.dominio}/`;
  const abs = (u) => (u ? new URL(u, base).href : undefined);
  const seoInicio = sitio.seo.dossier;
  const seo = pagina
    ? { titulo: (pagina.seo && pagina.seo.titulo) || `${pagina.nombre} · ${sitio.nombre}`, descripcion: (pagina.seo && pagina.seo.descripcion) || seoInicio.descripcion }
    : seoInicio;
  const canonical = abs(rutaPagina(pagina ? pagina.slug : null));
  const ld = pagina ? {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: seo.titulo,
    url: canonical,
    description: seo.descripcion,
    inLanguage: sitio.lang,
    isPartOf: { '@type': 'WebSite', name: sitio.nombre, url: base },
    about: { '@type': 'Organization', name: sitio.nombre, url: base },
  } : {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: sitio.nombre,
    url: base,
    logo: abs(ctx.url.logoPng),
    description: seo.descripcion,
    sameAs: sitio.instagram ? [`https://www.instagram.com/${sitio.instagram}/`] : undefined,
    areaServed: { '@type': 'Place', name: `${sitio.lugar.localidad}, ${sitio.lugar.provincia}`, address: { '@type': 'PostalAddress', addressLocality: sitio.lugar.localidad, addressRegion: sitio.lugar.provincia, addressCountry: sitio.lugar.pais } },
    founder: sitio.autora ? { '@type': 'Person', name: sitio.autora.nombre } : undefined,
  };
  const og = abs(ctx.url.og) || null;
  return `<!DOCTYPE html>
<html lang="${sitio.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(seo.titulo)}</title>
<meta name="description" content="${esc(seo.descripcion)}">
<link rel="canonical" href="${canonical}">
<meta name="theme-color" content="${sitio.colorTema}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(sitio.nombre)}">
<meta property="og:locale" content="${sitio.locale}">
<meta property="og:url" content="${canonical}">
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
<body>
<main id="app" data-cat='${JSON.stringify({ intro: ctx.url.catIntro, anim: ctx.url.catAnim })}'>
${cuerpo}
</main>
${nav}
<noscript><style>.rv,.rv2{opacity:1;transform:none}.menu-btn{display:none}</style></noscript>
</body>
</html>
`;
}
