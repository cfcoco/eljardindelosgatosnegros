/* ==========================================================================
   Logotipo que se escribe letra por letra, como a mano.
   Lo usan el dossier y la página de links con distintos tiempos.

   Cada letra es un <path> del SVG; se revela con una máscara que barre de
   izquierda a derecha.

   El gato son dos imágenes superpuestas:
   - <img class="cat">: un cuadro quieto, livianísimo, que viene en el HTML y
     se ve enseguida (es el que mide la métrica de carga, LCP).
   - <img class="cat-anim">: la animación. Primero la "intro" (parpadea, se
     queda quieta mientras se escribe el nombre, parpadea lento al final) y
     después el loop. Para que la intro arranque de cero en cada corrida, el
     archivo se baja una sola vez y se le da una URL nueva (blob) cada vez.

   uso:
     var logo = escritorDeLogo({ svg, cat, catAnim, intro, anim, retraso: 380,
                                 velocidad: 1, cambioGato: { fijo: 9665 } | { alTerminar: 1400 },
                                 alEmpezar: fn, reduce: bool });
     logo.escribir();
   ========================================================================== */
export function escritorDeLogo(o) {
  var NS = 'http://www.w3.org/2000/svg';
  var svg = o.svg, quieto = o.cat, anim = o.catAnim, run = 0, letras = null;
  var blobs = {}, vivas = {};
  var puedeBlob = !!(window.fetch && window.URL && URL.createObjectURL);

  function urlNueva(cual) {
    if (vivas[cual]) try { URL.revokeObjectURL(vivas[cual]); } catch (_) {}
    vivas[cual] = URL.createObjectURL(blobs[cual]);
    return vivas[cual];
  }
  /* cb(url) con una URL que arranca la animación desde cero. La primera vez se
     usa la URL normal (todavía no se bajó nada); después, un blob. */
  function urlIntro(r, cb) {
    if (!o.intro) return cb(null);
    if (blobs.intro) return cb(urlNueva('intro'));
    if (r === 1 || !puedeBlob) return cb(o.intro + (r === 1 ? '' : '?r=' + r));
    fetch(o.intro).then(function (x) { if (!x.ok) throw 0; return x.blob(); })
      .then(function (b) { blobs.intro = b; cb(urlNueva('intro')); })
      .catch(function () { cb(o.intro + '?r=' + r); });
  }
  /* Después de la primera corrida se guarda la intro en memoria para reiniciarla sin red. */
  function guardarIntro() {
    if (!puedeBlob || !o.intro || blobs.intro) return;
    fetch(o.intro).then(function (x) { return x.ok ? x.blob() : null; }).then(function (b) { if (b) blobs.intro = b; }).catch(function () {});
  }

  /* Máscaras: una por letra, con un margen del 25 % de la altura para que no se recorten los trazos.
     Primero se miden todas las letras y después se crean las máscaras (un solo reflow). */
  function preparar() {
    if (!svg) return false;
    var v = o.velocidad || 1; // factor de tiempo: 1 = normal, 0.75 = un 25 % más rápido
    var paths = [].slice.call(svg.querySelectorAll('path'));
    var medidas = paths.map(function (p) { return { bb: p.getBBox(), sw: p.getBoundingClientRect().width || 20 }; });
    var defs = document.createElementNS(NS, 'defs');
    svg.insertBefore(defs, svg.firstChild);
    letras = [];
    paths.forEach(function (p, k) {
      var bb = medidas[k].bb, pad = bb.height * 0.25;
      var m = document.createElementNS(NS, 'mask'), r = document.createElementNS(NS, 'rect');
      m.setAttribute('id', 'lw' + k); m.setAttribute('maskUnits', 'userSpaceOnUse');
      m.setAttribute('x', bb.x - pad); m.setAttribute('y', bb.y - pad);
      m.setAttribute('width', bb.width + 2 * pad); m.setAttribute('height', bb.height + 2 * pad);
      r.setAttribute('x', bb.x - pad); r.setAttribute('y', bb.y - pad);
      r.setAttribute('height', bb.height + 2 * pad); r.setAttribute('width', bb.width + 2 * pad); r.setAttribute('fill', '#fff');
      m.appendChild(r); defs.appendChild(m); p.setAttribute('mask', 'url(#lw' + k + ')');
      letras.push({ r: r, w: bb.width + 2 * pad, dur: (90 + medidas[k].sw * 2.4) * v });
    });
    /* palabras: El | jardín | de | los // gatos | negros (pausas entre palabras y al cambiar de renglón) */
    var gapAfter = { 1: 70, 7: 70, 9: 70, 12: 170, 17: 70 };
    var t = 0;
    letras.forEach(function (l, k) { l.start = t; t += l.dur * 0.55 + (gapAfter[k] || 0) * v; });
    return letras.length > 0;
  }

  function mostrarAnim(si) {
    if (!anim) return;
    anim.hidden = !si;
    if (quieto) quieto.style.visibility = si ? 'hidden' : '';
  }
  /* Llama a cb recién después de que el cuadro quieto se haya pintado en pantalla
     (dos frames después de cargar), así es él quien cuenta como primer contenido. */
  function trasPintarQuieto(cb) {
    var hecho = false;
    var seguir = function () { if (hecho) return; hecho = true; requestAnimationFrame(function () { requestAnimationFrame(cb); }); };
    if (!quieto || quieto.complete) return seguir();
    quieto.addEventListener('load', seguir); quieto.addEventListener('error', seguir);
    setTimeout(seguir, 1500);
  }

  function escribir() {
    document.documentElement.classList.remove('lw-wait');
    if (o.reduce) {
      if (anim && o.anim) { anim.setAttribute('src', o.anim); mostrarAnim(true); }
      if (o.alEmpezar) o.alEmpezar(true);
      return;
    }
    if (!letras && !preparar()) { if (o.alEmpezar) o.alEmpezar(true); return; }
    var r = ++run;
    letras.forEach(function (l) { l.r.setAttribute('width', 0); });
    var t0 = null, empezo = false, termino = false;

    function alLoop() {
      if (r !== run || !anim || !o.anim) return;
      anim.setAttribute('src', o.anim);
      mostrarAnim(true);
    }
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
      if (r === 1) setTimeout(guardarIntro, 3000);
    }
    if (!anim) return go();
    var espera = setTimeout(go, 1500);
    urlIntro(r, function (u) {
      if (r !== run) return;
      clearTimeout(espera);
      if (!u) return go();
      anim.onload = function () { trasPintarQuieto(function () { if (r === run) { mostrarAnim(true); go(); } }); };
      anim.onerror = go;
      anim.setAttribute('src', u);
      setTimeout(go, 1500);
    });
  }

  return { escribir: escribir };
}
