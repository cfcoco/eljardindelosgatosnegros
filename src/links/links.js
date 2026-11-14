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
      var base = parseFloat(getComputedStyle(el).fontSize);
      var ancho = el.clientWidth; if (!ancho) return;
      el.style.display = 'inline-block'; el.style.width = 'auto';
      var real = el.scrollWidth; el.style.display = ''; el.style.width = '';
      if (real > ancho) {
        var k = ancho / real;
        el.style.fontSize = (base * k * 0.99) + 'px';
        el.querySelectorAll('.por').forEach(function (p) { var pb = parseFloat(getComputedStyle(p).fontSize); p.style.fontSize = (pb * k * 0.99) + 'px'; });
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
      setTimeout(function () { el.classList.add('in'); }, rapido ? 0 : (+el.getAttribute('data-d') || 0));
    });
  }

  /* Logotipo: igual que en el dossier, pero arranca 1 s después y el gato pasa
     al loop 1,4 s después de la última letra. */
  var logo = escritorDeLogo({
    svg: doc.querySelector('.mark svg.name'),
    cat: cat,
    catAnim: doc.querySelector('.mark .cat-anim'),
    intro: CAT.intro, anim: CAT.anim,
    retraso: 1000,
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
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(cuandoSeVea); else cuandoSeVea();
})();
