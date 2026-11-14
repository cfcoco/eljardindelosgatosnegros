/* ==========================================================================
   Logotipo que se escribe letra por letra, como a mano.
   Lo usan el dossier y la página de links con distintos tiempos.

   Cada letra es un <path> del SVG; se revela con una máscara que barre de
   izquierda a derecha. El gato (<img>) arranca su animación de "intro"
   (parpadea, se queda quieto, parpadea lento al final) y después pasa al
   loop. Para que la intro empiece de cero en cada corrida, el archivo se baja
   una sola vez y se le da al <img> una URL nueva (blob) cada vez.

   uso:
     var logo = escritorDeLogo({ svg, cat, intro, anim, retraso: 380,
                                 cambioGato: { fijo: 9665 } | { alTerminar: 1400 },
                                 alEmpezar: fn, reduce: bool });
     logo.escribir();
   ========================================================================== */
export function escritorDeLogo(o) {
  var NS = 'http://www.w3.org/2000/svg';
  var svg = o.svg, cat = o.cat, run = 0, letras = null;
  var blobs = {}, vivas = {};
  var puedeBlob = !!(window.fetch && window.URL && URL.createObjectURL);

  function urlNueva(cual) {
    if (vivas[cual]) try { URL.revokeObjectURL(vivas[cual]); } catch (_) {}
    vivas[cual] = URL.createObjectURL(blobs[cual]);
    return vivas[cual];
  }
  /* cb(url) con una URL que arranca la animación del gato desde cero. */
  function urlGato(cual, r, cb) {
    var src = o[cual];
    if (!src) return cb(null);
    if (blobs[cual]) return cb(urlNueva(cual));
    if (!puedeBlob) return cb(src + '?r=' + r);
    fetch(src).then(function (x) { if (!x.ok) throw 0; return x.blob(); })
      .then(function (b) { blobs[cual] = b; cb(urlNueva(cual)); })
      .catch(function () { cb(src + '?r=' + r); });
  }
  function precargar(cual) {
    if (!puedeBlob || !o[cual] || blobs[cual]) return;
    fetch(o[cual]).then(function (x) { return x.ok ? x.blob() : null; }).then(function (b) { if (b) blobs[cual] = b; }).catch(function () {});
  }

  /* Máscaras: una por letra, con un margen del 25 % de la altura para que no se recorten los trazos. */
  function preparar() {
    if (!svg) return false;
    var defs = document.createElementNS(NS, 'defs');
    svg.insertBefore(defs, svg.firstChild);
    letras = [];
    [].slice.call(svg.querySelectorAll('path')).forEach(function (p, k) {
      var bb = p.getBBox(), pad = bb.height * 0.25;
      var m = document.createElementNS(NS, 'mask'), r = document.createElementNS(NS, 'rect');
      m.setAttribute('id', 'lw' + k); m.setAttribute('maskUnits', 'userSpaceOnUse');
      m.setAttribute('x', bb.x - pad); m.setAttribute('y', bb.y - pad);
      m.setAttribute('width', bb.width + 2 * pad); m.setAttribute('height', bb.height + 2 * pad);
      r.setAttribute('x', bb.x - pad); r.setAttribute('y', bb.y - pad);
      r.setAttribute('height', bb.height + 2 * pad); r.setAttribute('width', bb.width + 2 * pad); r.setAttribute('fill', '#fff');
      m.appendChild(r); defs.appendChild(m); p.setAttribute('mask', 'url(#lw' + k + ')');
      var sw = p.getBoundingClientRect().width || 20;
      letras.push({ r: r, w: bb.width + 2 * pad, dur: 90 + sw * 2.4 });
    });
    /* palabras: El | jardín | de | los // gatos | negros (pausas entre palabras y al cambiar de renglón) */
    var gapAfter = { 1: 70, 7: 70, 9: 70, 12: 170, 17: 70 };
    var t = 0;
    letras.forEach(function (l, k) { l.start = t; t += l.dur * 0.55 + (gapAfter[k] || 0); });
    return letras.length > 0;
  }

  function escribir() {
    document.documentElement.classList.remove('lw-wait');
    if (o.reduce) {
      if (cat && o.anim) cat.setAttribute('src', o.anim);
      if (o.alEmpezar) o.alEmpezar(true);
      return;
    }
    if (!letras && !preparar()) { if (o.alEmpezar) o.alEmpezar(true); return; }
    var r = ++run;
    letras.forEach(function (l) { l.r.setAttribute('width', 0); });
    var t0 = null, empezo = false, termino = false;

    function alLoop() { urlGato('anim', r, function (u) { if (u && r === run && cat) cat.setAttribute('src', u); }); }
    function frame(ts) {
      if (r !== run) return;
      if (t0 === null) t0 = ts;
      var el = ts - t0 - o.retraso, done = true;
      letras.forEach(function (l) {
        var q = Math.min(1, Math.max(0, (el - l.start) / l.dur));
        q = 1 - Math.pow(1 - q, 2);
        l.r.setAttribute('width', l.w * q);
        if (q < 1) done = false;
      });
      if (!done) requestAnimationFrame(frame);
      else if (!termino) {
        termino = true;
        if (o.cambioGato && o.cambioGato.alTerminar != null) setTimeout(alLoop, o.cambioGato.alTerminar);
      }
    }
    function go() {
      if (empezo || r !== run) return;
      empezo = true;
      if (o.alEmpezar) o.alEmpezar(false);
      requestAnimationFrame(frame);
      if (o.cambioGato && o.cambioGato.fijo != null) setTimeout(alLoop, o.cambioGato.fijo);
    }
    if (!cat) return go();
    /* Primera corrida: el <img> ya viene con la intro desde el HTML. Si todavía se
       está bajando, se arranca cuando termina (así la escritura queda sincronizada
       con el parpadeo) sin volver a pedir el archivo ni cambiar el src, que
       atrasaría la métrica de carga (LCP). Solo si ya estaba cargada de antes,
       se reinicia con una URL nueva. */
    if (r === 1 && !cat.complete && cat.getAttribute('src') === o.intro) {
      cat.onload = go; cat.onerror = go;
      setTimeout(go, 6000);
      return;
    }
    var espera = setTimeout(go, 900);
    urlGato('intro', r, function (u) {
      if (r !== run) return;
      clearTimeout(espera);
      if (!u) return go();
      cat.onload = go; cat.onerror = go;
      cat.setAttribute('src', u);
      setTimeout(go, 900);
    });
  }

  precargar('anim');
  return { escribir: escribir };
}
