/* ==========================================================================
   Formulario "Quiero enterarme primero" (opción B): una pregunta por pantalla
   dentro del bloque bordó del encuentro. Los textos vienen de links.json
   (bloque #anotate-cfg). Manda los datos a api/anotate.php y muestra la
   pantalla final aprobada por Luz (okHTML / fitGr / nom, copiados del ejemplo).
   ========================================================================== */
export function iniciarAnotate() {
  const sec = document.querySelector('.encuentro');
  const cfgEl = document.getElementById('anotate-cfg');
  const caja = document.getElementById('anotate');
  if (!sec || !cfgEl || !caja) return;
  let cfg;
  try { cfg = JSON.parse(cfgEl.textContent); } catch { return; }
  const T = cfg.textos || {};
  const P = T.preguntas || {}, A = T.ayudas || {}, B = T.botones || {}, E = T.errores || {}, F = T.final || {};
  const hp = sec.querySelector('.hp');
  const inicio = caja.innerHTML; // paso 0: el bloque tal como vino del build
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* --- pantalla final (medidas del ejemplo aprobado; fila de cierre ajustada el 17/11/2026) --- */
  const fitGr = () => {
    const g = document.querySelector('.ok .gr'); if (!g) return;
    let f = 32; g.style.fontSize = f + 'px'; const w = g.parentNode.clientWidth;
    while (g.scrollWidth > w && f > 18) { f--; g.style.fontSize = f + 'px'; }
    /* "Nos vemos entre las flores" + Tábata: si la fila no entra en el recuadro, se achica la frase (hasta 16 px). */
    const end = document.querySelector('.ok .end'), ver = document.querySelector('.ok .ver'); if (!end || !ver) return;
    ver.style.fontSize = '';
    let fv = parseFloat(getComputedStyle(ver).fontSize);
    while (end.scrollWidth > end.clientWidth && fv > 16) { fv--; ver.style.fontSize = fv + 'px'; }
  };
  const nom = (n) => { n = (n || '').trim().split(/\s+/)[0] || ''; return n ? n[0].toUpperCase() + n.slice(1) : ''; };
  const gracias = (n) => nom(n) ? esc(F.gracias || '¡Listo, {nombre}, gracias!').replace('{nombre}', esc(nom(n))) : esc(F.graciasSinNombre || '¡Listo, gracias!');
  const okHTML = (n) => (setTimeout(fitGr, 0), `<div class="ok"><p class="gr">${gracias(n)}</p><p class="big">${esc(F.texto)}</p><div class="end${F.frase ? '' : ' solo'}">${F.frase ? `<p class="ver">${esc(F.frase)}</p>` : ''}${cfg.foto || ''}</div></div>`);
  /* Secuencia del cierre: la frase se revela de izquierda a derecha (CSS) y, cuando termina,
     aparece el sticker (imagen o video animado) y se reproduce. */
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const secuenciaFinal = () => {
    const ver = caja.querySelector('.ok .ver'), sticker = caja.querySelector('.ok .end video, .ok .end img');
    if (!sticker) return;
    let hecho = false;
    /* Tamaño del sticker: el que haga falta para que el bloque quede cuadrado (entre 96 y 200 px de alto). */
    const ratio = (+sticker.getAttribute('height') || 984) / (+sticker.getAttribute('width') || 1080);
    sticker.style.width = '0px';
    const ancho = sec.clientWidth, sinSticker = sec.offsetHeight;
    const alto = Math.max(96, Math.min(200, ancho - sinSticker));
    sticker.style.width = Math.round(alto / ratio) + 'px';
    const mostrar = () => { if (hecho) return; hecho = true; sticker.classList.add('ve'); if (sticker.tagName === 'VIDEO') { const p = sticker.play(); if (p && p.catch) p.catch(() => {}); } };
    if (!ver || reduce) return mostrar();
    ver.addEventListener('animationend', mostrar, { once: true });
    setTimeout(mostrar, 2600); // por si la animación no corre
  };
  addEventListener('resize', fitGr);
  /* Al llegar a la pantalla final se esconde la despedida del pie (frase + Tábata), que ya
     está en el recuadro; la firma "Por Luz A. Zapata" queda. Pedido de Luz, 14/11/2026. */
  const mostrarFinal = (n) => {
    caja.innerHTML = okHTML(n);
    secuenciaFinal();
    document.querySelectorAll('footer .chau').forEach((el) => { el.style.display = 'none'; });
    document.querySelectorAll('footer .credit').forEach((el) => { el.style.marginTop = '0'; });
  };

  /* --- pasos --- */
  const data = { n: '', c: '', l: '', b: '' };
  let via = 'whatsapp', paso = -1, t0 = 0, enviando = false;
  const contactField = (valor) => via === 'whatsapp'
    ? `<input id="c" inputmode="tel" autocomplete="tel" placeholder="${esc(A.whatsapp)}" value="${esc(valor || '')}">`
    : `<input id="c" type="email" autocomplete="email" placeholder="${esc(A.mail)}" value="${esc(valor || '')}">`;
  const seg = () => `<div class="seg"><button type="button" data-v="whatsapp" aria-pressed="${via === 'whatsapp'}">${esc(B.whatsapp || 'WhatsApp')}</button><button type="button" data-v="mail" aria-pressed="${via === 'mail'}">${esc(B.mail || 'Mail')}</button></div>`;
  const pregCanal = () => data.n ? esc((P.canal || '{nombre}, ¿por dónde te avisamos?').replace('{nombre}', nom(data.n))) : esc(P.canalSinNombre || '¿Por dónde te avisamos?');
  const steps = [
    () => inicio,
    () => `<p class="q">${esc(P.nombre)}</p><input id="x" autocomplete="given-name" placeholder="${esc(A.nombre)}" value="${esc(data.n)}">${T.privacidad ? `<p class="priv">${esc(T.privacidad)}</p>` : ''}`,
    () => `<p class="q">${pregCanal()}</p>${seg()}<div class="cw" id="cw">${contactField(data.c)}</div>`,
    () => `<p class="q">${esc(P.leer)}</p><textarea id="x" placeholder="${esc(A.leer)}">${esc(data.l)}</textarea>`,
    () => `<p class="q">${esc(P.bar)}</p><input id="x" placeholder="${esc(A.bar)}" value="${esc(data.b)}">`,
  ];
  const keys = [null, 'n', 'c', 'l', 'b'];
  const $ = (id) => document.getElementById(id);

  function validar(i, v) {
    if (i === 1 && !v) return E.nombre || 'Contanos tu nombre.';
    if (i === 2) {
      if (!v) return E.contacto || 'Necesitamos un dato para avisarte.';
      if (via === 'mail' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return E.mail || 'Revisá el mail.';
      if (via === 'whatsapp') { const d = v.replace(/\D+/g, ''); if (d.length < 8 || d.length > 15) return E.whatsapp || 'Revisá el número.'; }
    }
    return '';
  }

  function show(i) {
    paso = i;
    if (i >= steps.length) { mostrarFinal(data.n); return; }
    const dots = i > 0 ? `<div class="dots" aria-hidden="true">${[1, 2, 3, 4].map((k) => `<i class="${k <= i ? 'on' : ''}"></i>`).join('')}</div>` : '';
    const nav = i > 0
      ? `<div class="nav"><button type="button" class="cta back" id="bk" aria-label="Volver">←</button><button type="button" class="cta" id="nx">${esc(i === 4 ? (B.enviar || 'Avisame primero') : (B.seguir || 'Seguir'))}</button></div>${i >= 3 ? `<div class="skipw"><button type="button" class="skip" id="sk">${esc(B.saltear || 'Saltear')}</button></div>` : ''}<div class="err" id="e" aria-live="polite"></div>`
      : '';
    caja.innerHTML = `<div class="step">${dots}${steps[i]()}${nav}</div>`;
    document.dispatchEvent(new CustomEvent('anotate:render'));
    if (i === 0) { const go = $('abrir-anotate'); if (go) go.onclick = () => { t0 = Date.now(); show(1); }; return; }
    if (i === 2) caja.querySelectorAll('.seg button').forEach((bt) => { bt.onclick = () => { via = bt.dataset.v; caja.querySelectorAll('.seg button').forEach((x) => x.setAttribute('aria-pressed', String(x === bt))); $('cw').innerHTML = contactField(''); enganchar(); }; });
    enganchar();
    $('bk').onclick = () => show(i - 1);
    const sk = $('sk'); if (sk) sk.onclick = () => { data[keys[i]] = ''; avanzar(i); };
    $('nx').onclick = () => { const inp = caja.querySelector('#x,#c'); const v = inp ? inp.value.trim() : ''; const err = validar(i, v); if (err) { $('e').textContent = err; inp && inp.focus({ preventScroll: true }); return; } data[keys[i]] = v; avanzar(i); };
    function enganchar() {
      const inp = caja.querySelector('#x,#c');
      setTimeout(() => inp && inp.focus({ preventScroll: true }), 250);
      if (inp) inp.onkeydown = (ev) => { if (ev.key === 'Enter' && inp.tagName === 'INPUT') { ev.preventDefault(); $('nx').click(); } };
    }
  }

  function avanzar(i) { if (i === 4) enviar(); else show(i + 1); }

  async function enviar() {
    if (enviando) return;
    enviando = true;
    const nx = $('nx'), err = $('e');
    const etiqueta = nx.textContent;
    nx.disabled = true; nx.textContent = B.enviando || 'Un momento…'; err.textContent = '';
    try {
      const r = await fetch(cfg.endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: data.n, canal: via, contacto: data.c, quiere_leer: data.l, bar_recomendado: data.b, origen: cfg.origen, web: hp ? hp.value : '', t: Date.now() - t0 }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j && j.ok) { mostrarFinal(data.n); return; }
      if (j && j.campo === 'nombre') { show(1); $('e').textContent = E.nombre || ''; return; }
      if (j && j.campo === 'contacto') { show(2); $('e').textContent = via === 'mail' ? (E.mail || '') : (E.whatsapp || ''); return; }
      err.textContent = j && j.error === 'limite' ? (E.limite || E.envio || '') : (E.envio || 'No pudimos guardar tus datos.');
    } catch {
      err.textContent = E.envio || 'No pudimos guardar tus datos.';
    } finally {
      enviando = false;
      if (document.body.contains(nx)) { nx.disabled = false; nx.textContent = etiqueta; }
    }
  }

  show(0);
}
