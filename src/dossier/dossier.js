/* ==========================================================================
   Dossier · comportamiento de la página.
   El HTML ya viene completo desde el build; acá solo están las animaciones,
   el menú de secciones y el control de los videos.
   ========================================================================== */
import { escritorDeLogo } from '../compartido/js/escribir-logo.js';
import { iniciarAnotate } from '../links/anotate.js';

(function () {
  'use strict';

  var doc = document, root = doc.documentElement, app = doc.getElementById('app');
  if (!app) return;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  var CAT = app.getAttribute('data-cat') ? JSON.parse(app.getAttribute('data-cat')) : {};

  /* ---------- aparición de fotos y textos al hacer scroll ----------
     Las fotos (.rv) suben 36 px; los textos (.rv2) 44 px, escalonados cada
     130 ms (200 ms en las listas). Se "rearma" cuando el elemento sale del
     todo de la pantalla, así vuelve a moverse al pasar de nuevo. */
  function reveal() {
    var fotos = app.querySelectorAll('.rv');
    var textos = app.querySelectorAll('.text > *:not(.steps), .text .steps > li, .seguir .card, .seguir .volver, .contacto .cta, .contacto .cta-sub, .contacto .mensaje, .pie .contact > *, .pie .phrase');
    if (reduce || !hasIO) {
      fotos.forEach(function (e) { e.classList.add('in'); });
      return;
    }
    textos.forEach(function (e) { e.classList.add('rv2'); });
    var entra = new IntersectionObserver(function (es) {
      var k = 0;
      es.forEach(function (e) {
        var el = e.target;
        if (!e.isIntersecting || el.classList.contains('in')) return;
        if (el.classList.contains('rv2')) {
          var d = k++ * (el.tagName === 'LI' ? 200 : 130);
          el.style.transitionDelay = d + 'ms';
          var n = el.querySelector(':scope > .n');
          if (n) n.style.transitionDelay = (d + 350) + 'ms';
        }
        el.classList.add('in');
      });
    }, { rootMargin: '0px 0px -16% 0px' });
    var sale = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var el = e.target;
        if (e.isIntersecting || !el.classList.contains('in')) return;
        el.style.transitionDelay = '0ms';
        var n = el.querySelector(':scope > .n');
        if (n) n.style.transitionDelay = '0ms';
        el.classList.remove('in');
      });
    }, { rootMargin: '0px' });
    fotos.forEach(function (e) { entra.observe(e); sale.observe(e); });
    textos.forEach(function (e) { entra.observe(e); sale.observe(e); });
  }

  /* ---------- logotipo de la portada ----------
     Se escribe letra por letra; el gato pasa al loop a los 9,665 s, justo
     después del parpadeo lento con el que termina la intro. */
  var logo = escritorDeLogo({
    svg: app.querySelector('.cover svg.name'),
    cat: app.querySelector('.cover .mark .cat'),
    catAnim: app.querySelector('.cover .mark .cat-anim'),
    intro: CAT.intro, anim: CAT.anim,
    retraso: 380,
    cambioGato: { fijo: 9665 },
    reduce: reduce,
  });
  /* Se vuelve a escribir cuando la portada sale de la pantalla y vuelve a entrar. */
  function vigilarPortada() {
    var cv = app.querySelector('.cover');
    if (!cv || !hasIO) return;
    var visto = true;
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) visto = false;
        else if (!visto) { visto = true; logo.escribir(); }
      });
    }, { threshold: 0 }).observe(cv);
  }

  /* ---------- los videos solo corren cuando están en pantalla ---------- */
  function vigilarVideos() {
    var videos = app.querySelectorAll('video');
    var play = function (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); };
    if (!hasIO) { videos.forEach(play); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) play(e.target); else e.target.pause(); });
    }, { rootMargin: '200px 0px' });
    videos.forEach(function (v) { io.observe(v); });
  }

  /* ---------- menú de secciones (tres puntitos) ---------- */
  var mb = doc.getElementById('mb'), mn = doc.getElementById('mn');
  function menuOpen(abierto) { mn.hidden = !abierto; mb.setAttribute('aria-expanded', abierto ? 'true' : 'false'); }
  function irA(el, esInicio) {
    var go = function () {
      var y = el.getBoundingClientRect().top + window.scrollY - (esInicio ? 0 : 8);
      try { window.scrollTo({ top: y, behavior: 'smooth' }); } catch (_) { window.scrollTo(0, y); }
    };
    go();
    // Si la página se corre mientras llega (fotos que terminan de cargar), se vuelve a apuntar.
    [900, 1800].forEach(function (t) {
      setTimeout(function () {
        var alFinal = window.innerHeight + window.scrollY >= root.scrollHeight - 2;
        if (Math.abs(el.getBoundingClientRect().top - 8) > 40 && !alFinal) go();
      }, t);
    });
  }
  if (mb && mn) {
    mb.addEventListener('click', function (e) { e.stopPropagation(); menuOpen(mn.hidden); });
    mn.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var el = doc.getElementById(a.getAttribute('href').slice(1));
      if (!el) return;
      e.preventDefault();
      menuOpen(false);
      irA(el, el.classList.contains('cover'));
    });
    doc.addEventListener('click', function (e) { if (!mn.hidden && !e.target.closest('#mn')) menuOpen(false); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') menuOpen(false); });
  }

  /* ---------- recuadros y botones: se corren a la derecha mientras se tocan ----------
     En el celular no hay hover, así que la clase .tocada reproduce el gesto (igual que en la bio). */
  function vigilarToques() {
    app.querySelectorAll('.card, .contact a, .text .btn').forEach(function (a) {
      var soltar = function () { setTimeout(function () { a.classList.remove('tocada'); }, 180); };
      a.addEventListener('pointerdown', function () { a.classList.add('tocada'); });
      a.addEventListener('pointerup', soltar);
      a.addEventListener('pointercancel', soltar);
      a.addEventListener('pointerleave', soltar);
    });
  }

  /* ---------- formulario de mensaje del cierre (Alianzas) ----------
     Manda nombre, mail o teléfono y mensaje a /api/mensaje.php y muestra el agradecimiento. */
  function iniciarMensaje() {
    var f = doc.getElementById('mensaje'), cfgEl = doc.getElementById('mensaje-cfg');
    if (!f || !cfgEl) return;
    var cfg; try { cfg = JSON.parse(cfgEl.textContent); } catch (_) { return; }
    var T = cfg.textos || {}, E = T.errores || {}, t0 = Date.now(), enviando = false;
    var err = f.querySelector('.err'), btn = f.querySelector('.enviar');
    var fallo = function (msg, campo) { err.textContent = msg || ''; if (campo) campo.focus({ preventScroll: true }); };
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (enviando) return;
      var nombre = f.nombre.value.trim(), contacto = f.contacto.value.trim(), mensaje = f.mensaje.value.trim();
      if (!nombre) return fallo(E.nombre || 'Contanos tu nombre.', f.nombre);
      var esMail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contacto), dig = contacto.replace(/\D+/g, '');
      if (!contacto || (!esMail && (dig.length < 8 || dig.length > 15))) return fallo(E.contacto || 'Dejanos un mail o un teléfono.', f.contacto);
      if (mensaje.length < 5) return fallo(E.mensaje || 'Contanos un poco más.', f.mensaje);
      enviando = true; btn.disabled = true; err.textContent = '';
      var etiqueta = btn.textContent; btn.textContent = T.enviando || 'Un momento…';
      var listo = function () { enviando = false; if (doc.body.contains(btn)) { btn.disabled = false; btn.textContent = etiqueta; } };
      fetch(cfg.endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre, contacto: contacto, mensaje: mensaje, origen: 'dossier', web: f.web ? f.web.value : '', t: Date.now() - t0 }),
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (r.ok && j && j.ok) { f.innerHTML = '<p class="gracias">' + esc(T.ok || '¡Gracias! Te respondemos a la brevedad.') + '</p>'; return; }
          fallo(j && j.error === 'limite' ? (T.limite || T.error) : (T.error || 'No pudimos enviar el mensaje.'));
          listo();
        });
      }).catch(function () { fallo(T.error || 'No pudimos enviar el mensaje.'); listo(); });
    });
  }

  /* ---------- créditos en dos líneas completas ----------
     "Por Luz A. Zapata · comunicadora social…" va justificado; se achica la letra (de 15 a 11 px)
     hasta que entre en dos renglones, y se vuelve a calcular si cambia el ancho. */
  function ajustarCreditos() {
    var p = doc.querySelector('.credit p');
    if (!p) return;
    var fs = 15;
    p.style.fontSize = fs + 'px';
    var lh = parseFloat(getComputedStyle(p).lineHeight) || fs * 1.5;
    while (p.offsetHeight > lh * 2 + 3 && fs > 11) { fs -= 0.5; p.style.fontSize = fs + 'px'; lh = parseFloat(getComputedStyle(p).lineHeight) || fs * 1.5; }
  }
  addEventListener('resize', ajustarCreditos);
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(ajustarCreditos);

  /* ---------- arranque ---------- */
  reveal();
  vigilarToques();
  iniciarAnotate();
  iniciarMensaje();
  ajustarCreditos();
  vigilarVideos();
  logo.escribir();
  vigilarPortada();
})();
