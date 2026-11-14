/* ==========================================================================
   Dossier · comportamiento de la página.
   El HTML ya viene completo desde el build; acá solo están las animaciones,
   el menú de secciones y el control de los videos.
   ========================================================================== */
import { escritorDeLogo } from '../compartido/js/escribir-logo.js';

(function () {
  'use strict';

  var doc = document, root = doc.documentElement, app = doc.getElementById('app');
  if (!app) return;

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  var CAT = app.getAttribute('data-cat') ? JSON.parse(app.getAttribute('data-cat')) : {};

  /* ---------- aparición de fotos y textos al hacer scroll ----------
     Las fotos (.rv) suben 36 px; los textos (.rv2) 44 px, escalonados cada
     130 ms (200 ms en las listas). Se "rearma" cuando el elemento sale del
     todo de la pantalla, así vuelve a moverse al pasar de nuevo. */
  function reveal() {
    var fotos = app.querySelectorAll('.rv');
    var textos = app.querySelectorAll('.text > *:not(.steps), .text .steps > li, .close .cta, .close .cta-sub, .close .phrase, .close .contact > *');
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

  /* ---------- arranque ---------- */
  reveal();
  vigilarVideos();
  logo.escribir();
  vigilarPortada();
})();
