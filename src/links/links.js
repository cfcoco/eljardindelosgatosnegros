/* ==========================================================================
   Página de links · comportamiento.
   Los datos ya vienen en el HTML desde el build; acá quedan la animación del
   logotipo, la aparición escalonada de los bloques y los renglones que tienen
   que entrar en una sola línea.
   ========================================================================== */
import { escritorDeLogo } from '../compartido/js/escribir-logo.js';
import { iniciarAnotate } from './anotate.js';

(function () {
  'use strict';
  var doc = document;
  try { iniciarAnotate(); } catch (e) { /* el bloque sigue mostrando el botón; el noscript lleva a WhatsApp */ }
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mark = doc.querySelector('.mark');
  var cat = doc.querySelector('.mark .cat');
  var CAT = doc.body.getAttribute('data-cat') ? JSON.parse(doc.body.getAttribute('data-cat')) : {};

  /* Renglones que tienen que quedar en UNA sola línea: se achica la letra hasta que entra. */
  function ajustar() {
    doc.querySelectorAll('.fit').forEach(function (el) {
      el.style.fontSize = '';
      el.querySelectorAll('.por').forEach(function (p) { p.style.fontSize = ''; });
      var ancho = el.clientWidth; if (!ancho) return;
      var medir = function () { el.style.display = 'inline-block'; el.style.width = 'auto'; var r = el.scrollWidth; el.style.display = ''; el.style.width = ''; return r; };
      /* Se repite hasta que entra: así funciona también cuando el celular agranda la letra
         por su cuenta (Samsung, navegador de Instagram), donde una sola cuenta no alcanza. */
      var f = parseFloat(getComputedStyle(el).fontSize), pores = el.querySelectorAll('.por'), fp = [].map.call(pores, function (p) { return parseFloat(getComputedStyle(p).fontSize); });
      for (var i = 0; i < 6; i++) {
        var real = medir(); if (real <= ancho) break;
        var k = (ancho / real) * 0.99; f *= k;
        el.style.fontSize = f + 'px';
        pores.forEach(function (p, j) { fp[j] *= k; p.style.fontSize = fp[j] + 'px'; });
      }
    });
  }
  addEventListener('resize', ajustar);
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(ajustar); else ajustar();
  addEventListener('load', ajustar);
  if (doc.fonts) doc.fonts.addEventListener('loadingdone', ajustar);
  [300, 1000, 2500].forEach(function (t) { setTimeout(ajustar, t); });

  /* Los bloques aparecen escalonados (data-d en ms) después de que arranca el logotipo. */
  var restoMostrado = false;
  function mostrarResto(rapido) {
    if (restoMostrado) return; restoMostrado = true;
    doc.querySelectorAll('.sube').forEach(function (el) {
      var d = parseInt((getComputedStyle(el).getPropertyValue('--d') || '0'), 10) || 0;
      setTimeout(function () { el.classList.add('in'); }, rapido ? 0 : d);
    });
  }

  /* Logotipo: igual que en el dossier, pero empieza a escribirse apenas aparece el
     gato, un poco más rápido (toda la entrada dura unos 2 s), y el gato pasa al
     loop 1,4 s después de la última letra. */
  var logo = escritorDeLogo({
    svg: doc.querySelector('.mark svg.name'),
    cat: cat,
    catAnim: doc.querySelector('.mark .cat-anim'),
    intro: CAT.intro, anim: CAT.anim,
    retraso: 0,
    velocidad: 0.75,
    cambioGato: { alTerminar: 1400 },
    alEmpezar: function (rapido) { mostrarResto(rapido); },
    reduce: reduce,
  });
  function cuandoSeVea() {
    if (doc.visibilityState === 'visible') logo.escribir();
    else doc.addEventListener('visibilitychange', function v() {
      if (doc.visibilityState === 'visible') { doc.removeEventListener('visibilitychange', v); logo.escribir(); }
    });
  }
  if (mark) {
    mark.addEventListener('click', function () { logo.escribir(); });
    /* Si la cabecera sale de la pantalla y vuelve a entrar, se escribe otra vez. */
    if ('IntersectionObserver' in window) {
      var afuera = false;
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (!e.isIntersecting) afuera = true; else if (afuera) { afuera = false; logo.escribir(); } });
      }).observe(mark);
    }
  }
  /* Tarjetas (Contacto, Colaborá, Email): al apoyar el dedo se corren apenas a la derecha.
     Se hace con pointerdown porque en el celular el :active solo aparece después de un rato. */
  doc.querySelectorAll('a.link').forEach(function (a) {
    var soltar = function () { setTimeout(function () { a.classList.remove('tocada'); }, 180); };
    a.addEventListener('pointerdown', function () { a.classList.add('tocada'); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { a.addEventListener(ev, soltar); });
  });

  /* Pie: cuando "Nos vemos entre las flores" entra en pantalla se escribe y, al terminar, aparece Tábata.
     Si sale del todo de la pantalla, se rearma para repetirse la próxima vez. */
  var chau = doc.querySelector('footer .chau');
  if (chau && 'IntersectionObserver' in window) {
    var fraseChau = chau.querySelector('p'), gata = chau.querySelector('img'), timerChau = null;
    var mostrarGata = function () { if (gata) gata.classList.add('ve'); };
    if (fraseChau) fraseChau.addEventListener('animationend', mostrarGata);
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          if (chau.classList.contains('escribe')) return;
          chau.classList.add('escribe');
          if (reduce || !fraseChau) mostrarGata(); else timerChau = setTimeout(mostrarGata, 2200);
        } else if (e.intersectionRatio === 0) {
          clearTimeout(timerChau); chau.classList.remove('escribe'); if (gata) gata.classList.remove('ve');
        }
      });
    }, { threshold: [0, 0.35] }).observe(chau);
  } else if (chau) { chau.classList.add('escribe'); var g = chau.querySelector('img'); if (g) g.classList.add('ve'); }

  /* Cuando el formulario cambia de pantalla vuelve a haber renglones .fit nuevos. */
  doc.addEventListener('anotate:render', function () { ajustar(); });

  var video = doc.querySelector('.cab .intro-video');
  if (video) {
    /* Con video en la cabecera no hay logotipo que escribir: el video corre una vez y
       queda en su último cuadro; los bloques entran escalonados enseguida.
       Vuelve a arrancar de cero al recargar, al volver con "atrás" y cuando la
       cabecera sale de la pantalla y vuelve a entrar. */
    var reproducir = function () { try { video.currentTime = 0; } catch (_) {} var p = video.play(); if (p && p.catch) p.catch(function () {}); };
    reproducir();
    mostrarResto(false);
    addEventListener('pageshow', function (e) { if (e.persisted) reproducir(); });
    /* Algunos navegadores (el de Instagram, por ejemplo) no dejan arrancar el video solo: se intenta al primer toque. */
    var alPrimerToque = function () { if (video.paused) { var p = video.play(); if (p && p.catch) p.catch(function () {}); } doc.removeEventListener('pointerdown', alPrimerToque); doc.removeEventListener('touchstart', alPrimerToque); };
    doc.addEventListener('pointerdown', alPrimerToque, { passive: true });
    doc.addEventListener('touchstart', alPrimerToque, { passive: true });
    if ('IntersectionObserver' in window) {
      var seFue = false;
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (!e.isIntersecting) seFue = true; else if (seFue) { seFue = false; reproducir(); } });
      }, { threshold: 0.2 }).observe(video);
    }
  } else if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(cuandoSeVea); else cuandoSeVea();
})();
