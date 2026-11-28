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
    if (b.foto) lista.push(b.foto);
  }
  return lista;
}

/** Menú de tres puntitos: Inicio y una entrada por página del recorrido (pedido de Coco,
    28/11/2026: Inicio · Sobre el club · Detalles · Alianzas). Igual en todas las páginas. */
export function seccionesMenu(c) {
  const items = [{ t: 'Inicio', id: 'inicio', pagina: null }];
  for (const p of paginasDossier(c)) items.push({ t: p.menu || p.nombre, id: 'inicio', pagina: p.slug });
  return items;
}

/** Ancla de cada bloque de texto con etiqueta (#sobre-el-club, #la-experiencia…), única por página. */
function anclas(c) {
  const usados = new Set(['inicio', 'contacto', 'sumate', 'recorrido']);
  const mapa = new Map();
  c.blocks.forEach((b, i) => {
    const t = limpio(b.eb);
    if ((b.type === 'text' || b.type === 'manif') && t) {
      let id = slug(t) || 'seccion-' + i, base = id, n = 2;
      while (usados.has(id)) id = base + '-' + n++;
      usados.add(id);
      mapa.set(i, id);
    }
  });
  return mapa;
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
  /* Botones de web dentro del bloque (`botones`: [{ t, href, estilo: 'linea' }]): llevan a otra página o sección. */
  if (Array.isArray(b.botones) && b.botones.length) {
    h += `<div class="acciones">${b.botones.map((x) => `<a class="btn${x.estilo === 'linea' ? ' linea' : ''}" href="${esc(x.href || '#')}">${esc(x.t || '')} ${icono('fl', 'fl')}</a>`).join('')}</div>`;
  }
  // `sideEntera`: la foto del costado se ve completa y más chica (sin recorte), sobre el fondo del bloque.
  const side = b.side ? `<figure class="side rv${b.sideEntera ? ' entera' : ''}">${ctx.media(b.side, { sizes: b.sideEntera ? '(min-width:860px) 420px, 100vw' : SIZES.side, lazy: true })}</figure>` : '';
  // `compacto`: frase en una línea arriba y, debajo, el saludo a la izquierda y la foto a la derecha (también en celu).
  const cls = (side ? ' has-side' : '') + (side && b.compacto ? ' compacto' : '');
  const idAttr = id ? ` id="${id}"` : '';
  if (th === 'negro') return `<section class="offer${cls}"${idAttr}><div class="text">${h}</div>${side}</section>`;
  // frambuesa: mismo bloque que el bordó pero en #953651, para que contraste con el pie bordó.
  if (th === 'bordo' || th === 'frambuesa') return `<section class="tbordo${th === 'frambuesa' ? ' fram' : ''}${cls}"${idAttr}><div class="text">${h}</div>${side}</section>`;
  if (side) return `<section class="tcrema${cls}"${idAttr}><div class="text">${h}</div>${side}</section>`;
  return `<section class="text"${idAttr}>${h}</section>`;
}

/* Cita. Opciones: theme "negro" (fondo negro, firma rosa), cita (en Trazo y entre comillas),
   chico (menos aire, como un corte) y firma "credito" (la misma firma del pie: "Por Luz A. Zapata · …"). */
function manifBlock(b, id, c, ctx) {
  const idAttr = id ? ` id="${id}"` : '';
  const cls = 'manif' + (b.theme === 'negro' ? ' negro' : '') + (b.chico ? ' chico' : '') + (b.cita ? ' cita' : '');
  const texto = b.cita ? `“${esc(b.q || '')}”` : esc(b.q || '');
  const z = (c && c.close) || {};
  const firma = b.firma === 'credito'
    ? `<div class="firma credito">${z.name ? '<span class="por">Por </span>' : ''}<b class="who">${esc(z.name || '')}</b>${z.name && z.role ? '<span> · </span>' : ''}<span>${esc(z.role || '')}</span></div>`
    : (b.firma ? `<div class="firma">${esc(b.firma)}</div>` : '');
  // `foto`: retrato cuadrado de quien firma, al costado del texto (si no hay foto, el bloque queda como antes).
  const conFoto = !!(b.foto && ctx);
  const cuerpo = `${b.eb ? `<div class="eyebrow">${esc(b.eb)}</div>` : ''}` +
    `<blockquote${b.cita ? ' class="trazo"' : ''}>${texto}${b.qa ? ` <em>${esc(b.qa)}</em>` : ''}</blockquote>${firma}`;
  const foto = conFoto ? `<figure class="foto-autora rv">${ctx.media(b.foto, { sizes: '(min-width:760px) 300px, 40vw', lazy: true })}</figure>` : '';
  return `<section class="${cls}${conFoto ? ' con-foto' : ''}"${idAttr}><div class="text">${conFoto ? `<div class="cuerpo">${cuerpo}</div>` : cuerpo}${foto}</div></section>`;
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
  // Sin página siguiente no va nada: en el inicio no corresponde y en la última (Alianzas) la foto
  // tiene que quedar pegada al pie, sin la franja de "Volver al inicio" (pedido de Coco).
  if (!sig) return '';
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

/* ---------- "¿Te gustaría sumarte?": el formulario paso a paso de la bio ----------
   Mismo código (src/links/anotate.js) y mismos textos de preguntas (links.json → formulario,
   que el build pasa en ctx.formulario), guardando en la misma base vía /api/anotate.php. */
function sumateBlock(b, sitio, ctx) {
  const f = ctx.formulario;
  if (!f || !f.endpoint) return '';
  const cfg = JSON.stringify({
    endpoint: f.endpoint, origen: f.origen || 'dossier',
    textos: { privacidad: f.privacidad || '', preguntas: f.preguntas || {}, ayudas: f.ayudas || {}, botones: f.botones || {}, errores: f.errores || {}, final: f.final || {} },
    foto: f.foto ? ctx.media(f.foto, { lazy: true }) : '',
  }).replace(/</g, '\\u003c');
  const waUrl = `https://wa.me/${sitio.whatsapp}?text=${encodeURIComponent(b.waMensaje || 'Hola Luz, quiero enterarme primero del próximo encuentro del club.')}`;
  return `<section class="sumate rv${b.theme === 'negro' ? ' negro' : ''}" id="sumate"><div class="encuentro" aria-label="${esc(b.eb || 'Sumate al club')}"><div class="caja" id="anotate">` +
    (b.eb ? `<div class="eyebrow">${esc(b.eb)}</div>` : '') +
    (b.h2 ? `<h2>${esc(b.h2)}</h2>` : '') +
    (b.texto ? `<p class="d">${esc(b.texto)}</p>` : '') +
    (b.cupos ? `<p class="cupos">${esc(b.cupos)}</p>` : '') +
    `<button class="cta" type="button" id="abrir-anotate">${esc(b.boton || 'Quiero enterarme primero')}</button>` +
    `<noscript><a class="cta" href="${esc(waUrl)}" target="_blank" rel="noopener">${esc(b.boton || 'Quiero enterarme primero')}</a></noscript>` +
    `</div><input class="hp" type="text" name="web" tabindex="-1" autocomplete="off" aria-hidden="true">` +
    `<script type="application/json" id="anotate-cfg">${cfg}</script></div></section>`;
}

/* Bloque de contacto (tipo `contacto`, en Alianzas, en negro, entre la marquesina y la foto de la web):
   la pregunta para aliados y un formulario simple de mensaje (nombre, mail o teléfono, mensaje). */
function contactoBlock(c, ctx) {
  const z = c.close, m = z.mensaje || {};
  const cfg = JSON.stringify({
    endpoint: '/api/mensaje.php',
    textos: { enviando: m.enviando || '', ok: m.ok || '', error: m.error || '', limite: m.limite || '', errores: m.errores || {} },
  }).replace(/</g, '\\u003c');
  return `<section class="contacto" id="contacto">` +
    (z.q ? `<p class="cta">${esc(z.q)}</p>` : '') + (z.qs ? `<p class="cta-sub">${esc(z.qs)}</p>` : '') +
    `<form class="mensaje" id="mensaje" novalidate>` +
    `<input name="nombre" autocomplete="name" maxlength="80" placeholder="${esc(m.nombre || 'Tu nombre')}" aria-label="${esc(m.nombre || 'Tu nombre')}">` +
    `<input name="contacto" autocomplete="email" inputmode="email" maxlength="120" placeholder="${esc(m.contacto || 'Mail o teléfono')}" aria-label="${esc(m.contacto || 'Mail o teléfono')}">` +
    `<textarea name="mensaje" rows="4" maxlength="3000" placeholder="${esc(m.texto || 'Tu mensaje')}" aria-label="${esc(m.texto || 'Tu mensaje')}"></textarea>` +
    `<input class="hp" type="text" name="web" tabindex="-1" autocomplete="off" aria-hidden="true">` +
    `<button class="enviar" type="submit">${esc(m.boton || 'Enviar mensaje')}</button>` +
    `<p class="err" aria-live="polite"></p>` +
    (m.privacidad ? `<p class="priv">${esc(m.privacidad)}</p>` : '') +
    `</form><script type="application/json" id="mensaje-cfg">${cfg}</script></section>\n`;
}

/* Pie fijo de todas las páginas (bordó, como el cierre original): WhatsApp · Instagram · TikTok · Email,
   "Nos vemos entre las flores" y la franja de créditos. En las páginas comunes los links van en una sola
   fila de íconos (en compu, con el nombre al lado); en la última (con el gato animado y el logotipo)
   se ven completos, con usuario y flecha. */
function pie(c, sitio, ctx, { conMarca = false } = {}) {
  const z = c.close;
  const ig = sitio.instagram, wa = sitio.whatsapp, tt = sitio.tiktok, mail = sitio.email;
  const waUrl = `https://wa.me/${wa}?text=${encodeURIComponent(z.waMensaje || '')}`;
  const boton = (href, ico, t, s, externo = true) => `<a href="${href}"${externo ? ' target="_blank" rel="noopener"' : ''} aria-label="${esc(t)}: ${esc(s)}" title="${esc(t)}">${icono(ico, 'ico')}<span class="txt"><span class="t">${esc(t)}</span><span class="s">${esc(s)}</span></span>${icono('fl', 'fl')}</a>`;
  // Solo al final del recorrido (última página) va el gato animado con el logotipo, como en el cierre original.
  const marca = conMarca ? `<div class="mark"><img class="cat" src="${ctx.url.catAnim}" alt="Gato negro del club" width="${ctx.cat.width}" height="${ctx.cat.height}" loading="lazy">` +
    `<img class="name" src="${ctx.url.logoCrema}" alt="El jardín de los gatos negros" width="${ctx.logo.width}" height="${ctx.logo.height}" loading="lazy"></div>` : '';
  let h = `<footer class="pie${conMarca ? ' con-marca' : ''}">${marca}` +
    `<div class="contact iconos">` +
    (wa ? boton(esc(waUrl), 'wa', 'WhatsApp', sitio.whatsappVisible || wa) : '') +
    (ig ? boton(`https://www.instagram.com/${esc(ig)}/`, 'ig', 'Instagram', '@' + ig) : '') +
    (tt ? boton(`https://www.tiktok.com/@${esc(tt)}`, 'tt', 'TikTok', '@' + tt) : '') +
    (mail ? boton(`mailto:${esc(mail)}?subject=${encodeURIComponent(z.mailAsunto || 'Vi el dossier de El Jardín de los Gatos Negros')}`, 'carta', 'Email', mail, false) : '') +
    // "Nos vemos entre las flores" va solo en el pie de la última página (Alianzas), para no repetirla en todas.
    `</div>` + (conMarca && z.phrase ? `<p class="trazo phrase">${esc(z.phrase)}</p>` : '') + `</footer>\n`;
  h += `<div class="credit"><p>${z.name ? '<span class="por">Por </span>' : ''}<b class="who">${esc(z.name)}</b>${z.name && z.role ? '<span> · </span>' : ''}<span class="what">${esc(z.role)}</span></p></div>`;
  return h;
}

/** Cuerpo de una página. `pagina` es null para el inicio. */
export function cuerpoDossier(c, sitio, ctx, pagina = null) {
  const menu = seccionesMenu(c);
  const idDe = anclas(c);
  const actual = pagina ? pagina.slug : null;
  let h = pagina ? cabecera(c, pagina, ctx) : portada(c, ctx);

  let k = 0; // posición dentro de la página (para la primera foto y la carga perezosa)
  c.blocks.forEach((b, i) => {
    if ((b.pagina || null) !== actual) return;
    const id = idDe.get(i);
    if (b.type === 'text') h += textBlock(b, id, ctx);
    else if (b.type === 'manif') h += manifBlock(b, id, c, ctx);
    else if (b.type === 'seguir') h += seguirBlock(c, null, ctx);
    else if (b.type === 'sumate') h += sumateBlock(b, sitio, ctx);
    else if (b.type === 'contacto') h += contactoBlock(c, ctx);
    else if (b.type === 'palette') h += `<div class="wrap">${PALETTE}</div>`;
    else if (b.type === 'fonts') h += `<div class="wrap">${FONTS}</div>`;
    else if (b.type === 'full') {
      const m = b.imgs && b.imgs[0];
      // `chico`: la foto o el video se ven enteros y más chicos, centrados (no de borde a borde).
      h += `<div class="wrap${b.bleed ? ' bleed' : ''}"><figure class="full${b.flush ? '' : ' rv'}${k === 0 || b.flush ? ' first' : ''}${b.chico ? ' chico' : ''}">` +
        ctx.media(m, { sizes: b.chico ? '(min-width:760px) 760px, 100vw' : b.bleed ? SIZES.bleed : SIZES.full, lazy: k > 1, prioridad: k === 0 }) + '</figure></div>';
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
  const pags = paginasDossier(c);
  const esUltima = pagina ? pags.length && pags[pags.length - 1].slug === pagina.slug : !pags.length;
  h += pie(c, sitio, ctx, { conMarca: !!esUltima });

  // Menú: la página actual se enlaza con ancla al principio (#inicio); las demás, por su ruta.
  const href = (m) => (m.pagina === actual ? `#${m.id}` : rutaPagina(m.pagina));
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
