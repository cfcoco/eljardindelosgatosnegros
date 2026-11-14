/* ==========================================================================
   Dossier · plantilla HTML.
   Recibe el contenido (contenido/dossier.json), los datos del sitio y un
   contexto con las fotos ya procesadas, y devuelve el HTML completo.
   Reproduce el marcado del dossier original sin el modo edición.
   ========================================================================== */

export const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const limpio = (t) => String(t || '').replace(/[​ ]/g, ' ').replace(/\s+/g, ' ').trim();
export const slug = (t) => limpio(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const parrafos = (s) => String(s || '').split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
const pad = (n) => ('0' + n).slice(-2);

/** Lista de fotos y videos que el build tiene que procesar antes de renderizar. */
export function mediosDossier(c) {
  const lista = [];
  for (const b of c.blocks) {
    if (b.imgs) lista.push(...b.imgs);
    if (b.side) lista.push(b.side);
  }
  return lista;
}

/** Secciones que van al menú: Inicio, cada bloque de texto con etiqueta, Contacto. */
export function seccionesMenu(c) {
  const usados = new Set(['inicio', 'contacto']);
  const items = [{ t: 'Inicio', id: 'inicio' }];
  c.blocks.forEach((b, i) => {
    const t = limpio(b.eb);
    if ((b.type === 'text' || b.type === 'manif') && t) {
      let id = slug(t) || 'seccion-' + i, base = id, n = 2;
      while (usados.has(id)) id = base + '-' + n++;
      usados.add(id);
      items.push({ t, id, i });
    }
  });
  items.push({ t: 'Contacto', id: 'contacto' });
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

export function cuerpoDossier(c, sitio, ctx) {
  const menu = seccionesMenu(c);
  const idDe = new Map(menu.filter((m) => m.i != null).map((m) => [m.i, m.id]));
  const ig = sitio.instagram, wa = sitio.whatsapp;
  const waUrl = `https://wa.me/${wa}?text=${encodeURIComponent(c.close.waMensaje || '')}`;
  let h = '';

  h += `<header class="cover" id="inicio">` +
    (c.cover.eb ? `<div class="eyebrow">${esc(c.cover.eb)}</div>` : '') +
    `<div class="mark"><span class="cat-box"><img class="cat" src="${ctx.url.catQuieto}" alt="Gato negro, isologo del club" width="${ctx.cat.width}" height="${ctx.cat.height}" fetchpriority="high"><img class="cat-anim" alt="" aria-hidden="true" width="${ctx.cat.width}" height="${ctx.cat.height}" hidden></span>` +
    `<svg class="name" role="img" aria-label="El jardín de los gatos negros" viewBox="${ctx.logo.viewBox}" fill="currentColor">${ctx.logo.interior}</svg></div>` +
    `<div class="down">${c.cover.place ? `<div class="pl">${esc(c.cover.place)}</div>` : ''}<span aria-hidden="true">↓</span></div></header>\n`;

  c.blocks.forEach((b, i) => {
    const id = idDe.get(i);
    if (b.type === 'text') h += textBlock(b, id, ctx);
    else if (b.type === 'manif') h += manifBlock(b, id);
    else if (b.type === 'palette') h += `<div class="wrap">${PALETTE}</div>`;
    else if (b.type === 'fonts') h += `<div class="wrap">${FONTS}</div>`;
    else if (b.type === 'full') {
      const m = b.imgs && b.imgs[0];
      h += `<div class="wrap${b.bleed ? ' bleed' : ''}"><figure class="full${b.flush ? '' : ' rv'}${i === 0 || b.flush ? ' first' : ''}">` +
        ctx.media(m, { sizes: b.bleed ? SIZES.bleed : SIZES.full, lazy: i > 1, prioridad: i === 0 }) + '</figure></div>';
    } else if (b.type === 'duo') {
      h += `<div class="wrap"><div class="duo ${b.r === 'sq' ? 'sq' : 'tall'} rv">`;
      for (let j = 0; j < 2; j++) {
        const m = (b.imgs || [])[j] || {};
        h += `<div${m.fit === 'contain' ? ' class="cell-c"' : ''}>${ctx.media(m, { sizes: SIZES.duo, lazy: i > 1 })}</div>`;
      }
      h += '</div></div>';
    }
    h += '\n';
  });

  const z = c.close;
  h += `<footer class="close" id="contacto"><div class="mark"><img class="cat" src="${ctx.url.catAnim}" alt="Gato negro del club" width="${ctx.cat.width}" height="${ctx.cat.height}" loading="lazy">` +
    `<img class="name" src="${ctx.url.logoCrema}" alt="El jardín de los gatos negros" width="${ctx.logo.width}" height="${ctx.logo.height}" loading="lazy"></div>` +
    (z.q ? `<p class="cta">${esc(z.q)}</p>` : '') + (z.qs ? `<p class="cta-sub">${esc(z.qs)}</p>` : '') +
    `<div class="contact">` +
    (ig ? `<a href="https://www.instagram.com/${esc(ig)}/" target="_blank" rel="noopener">Instagram · @${esc(ig)}</a>` : '') +
    (wa ? `<a href="${esc(waUrl)}" target="_blank" rel="noopener">WhatsApp · ${esc(sitio.whatsappVisible || wa)}</a>` : '') +
    `</div>` + (z.phrase ? `<p class="trazo phrase">${esc(z.phrase)}</p>` : '') + `</footer>\n`;
  h += `<div class="credit">${z.name ? '<span class="por">Por </span>' : ''}<b class="who">${esc(z.name)}</b>${z.name && z.role ? '<span> · </span>' : ''}<span class="what">${esc(z.role)}</span></div>`;

  const nav = `<button class="menu-btn" id="mb" type="button" aria-label="Ir a una sección" aria-expanded="false" aria-controls="mn"><span></span><span></span><span></span></button>\n` +
    `<nav class="menu" id="mn" hidden aria-label="Secciones">${menu.map((m) => `<a href="#${m.id}">${esc(m.t)}</a>`).join('')}</nav>`;
  return { cuerpo: h, nav };
}

/** Documento completo. */
export function renderDossier(c, sitio, ctx) {
  const { cuerpo, nav } = cuerpoDossier(c, sitio, ctx);
  const seo = sitio.seo.dossier;
  const base = `https://${sitio.dominio}/`;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: sitio.nombre,
    url: base,
    logo: ctx.url.logoPng ? base + ctx.url.logoPng : undefined,
    description: seo.descripcion,
    sameAs: sitio.instagram ? [`https://www.instagram.com/${sitio.instagram}/`] : undefined,
    areaServed: { '@type': 'Place', name: `${sitio.lugar.localidad}, ${sitio.lugar.provincia}`, address: { '@type': 'PostalAddress', addressLocality: sitio.lugar.localidad, addressRegion: sitio.lugar.provincia, addressCountry: sitio.lugar.pais } },
    founder: sitio.autora ? { '@type': 'Person', name: sitio.autora.nombre } : undefined,
  };
  const og = ctx.url.og ? base + ctx.url.og : null;
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
