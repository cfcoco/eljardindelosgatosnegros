/* ==========================================================================
   Íconos compartidos (dossier y página de links).
   Con el trazo del logotipo: línea sin relleno, un solo trazo limpio y apenas
   inclinados, como la letra.
   ========================================================================== */
export const ICONOS = {
  wa: 'M4 20.5l1.2-3.8A8.3 8.3 0 1 1 8.2 19.4z M9.3 8.8c.2 2.6 2.6 5.2 5.8 6.1 M9.3 8.8l1.1-.5 M15.1 14.9l.5-1.1',
  ig: 'M7.6 3.6h8.8a4 4 0 0 1 4 4v8.8a4 4 0 0 1-4 4H7.6a4 4 0 0 1-4-4V7.6a4 4 0 0 1 4-4z M12 8.4a3.6 3.6 0 1 1 0 7.2 3.6 3.6 0 0 1 0-7.2z M16.9 7.1h.01',
  libro: 'M12 20.2C6.5 16.4 3.5 13.2 3.5 9.4 3.5 6.6 5.6 4.6 8 4.6c1.7 0 3.1.9 4 2.4.9-1.5 2.3-2.4 4-2.4 2.4 0 4.5 2 4.5 4.8 0 3.8-3 7-8.5 10.8z',
  carta: 'M7 9.5V3.5h10v6 M9.5 6h5 M3.5 9.5h17v10.5h-17z M3.5 9.5l8.5 6 8.5-6',
  fl: 'M5 12h14 M13.5 6.5L19 12l-5.5 5.5',
};
export const icono = (nombre, clase) =>
  `<svg class="${clase}" viewBox="0 0 24 24" aria-hidden="true"><g transform="translate(1.7 0) skewX(-8)"><path d="${ICONOS[nombre]}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`;
