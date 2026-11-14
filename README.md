# El Jardín de los Gatos Negros · sitio web

Sitio del club de lectura de Villa Allende, Córdoba. Dos páginas:

| Dirección | Página | Carpeta publicada |
|---|---|---|
| https://eljardindelosgatosnegros.com.ar | Dossier (para alianzas y colaboraciones) | `dist/dossier/` |
| https://bios.eljardindelosgatosnegros.com.ar | Links para la bio de Instagram | `dist/links/` |

HTML, CSS y JavaScript sin frameworks. Un build en Node arma las páginas completas a partir de los textos en `contenido/`.

## Cómo se cambia algo (para Luz)

1. **Textos, fotos y orden de los bloques:** editá `contenido/dossier.json` (dossier) o `contenido/links.json` (página de links). Cada archivo tiene una ayuda arriba de todo. Las fotos y videos nuevos van en `contenido/img/` y se nombran desde el JSON.
2. **Datos generales** (Instagram, WhatsApp, email, nombre del subdominio, textos para Google): `contenido/sitio.json`.
3. Guardá y subí el cambio a GitHub (commit + push a `main`). GitHub arma el sitio solo y lo deja listo para Hostinger (ver "Publicación").

No hace falta tocar nada en `src/` ni en `tools/` para cambiar contenido.

## Para trabajar en la compu

Requisitos: Node 20 o más nuevo.

```bash
npm install        # una sola vez
npm run dev        # servidor local con rebuild automático
```

- Dossier: http://localhost:5173/
- Links: http://localhost:5173/links/
- Desde el celular (misma red wifi): la dirección `http://IP:5173/` que muestra la consola.
- `npm run build` arma `dist/` sin levantar el servidor.

Herramientas de control (opcionales, usan el navegador de Playwright: `npx playwright install chromium`):

```bash
node tools/capturas.mjs   # capturas de página completa en 390 y 1280 px y comparación con _origen/
node tools/og.mjs         # vuelve a generar las imágenes para compartir (og-dossier.jpg / og-links.jpg)
```

## Estructura

```
contenido/            textos, fotos y datos (lo único que se edita para cambiar contenido)
  dossier.json        bloques del dossier
  links.json          página de links
  sitio.json          dominio, subdominio, redes, SEO
  img/                fotos, videos y pósters
src/
  compartido/         base.css (paleta, fuentes, animaciones), fuentes, logos, extras (404, .htaccess…)
  dossier/            plantilla.mjs, dossier.css, dossier.js, og-dossier.jpg
  links/              plantilla.mjs, links.css, links.js, og-links.jpg
tools/
  build.mjs           arma dist/ (HTML completo, fotos WebP con srcset, videos H.264, fuentes WOFF2, favicons, nombres con hash)
  imagenes.mjs        procesamiento de fotos, videos, fuentes y SVG (con caché en .cache/)
  dev.mjs             servidor local
  capturas.mjs        comparación visual con el original
  og.mjs              imagen para WhatsApp / redes
_origen/              referencia: el dossier y los links tal como estaban en claude.ai (no se publica)
dist/                 resultado del build (no se sube al repo)
.github/workflows/    GitHub Action de build y deploy
```

## Qué hace el build

- Escribe el HTML completo, así Google lee el contenido sin ejecutar JavaScript.
- Fotos → WebP en 640, 800, 1080, 1600 y 2400 px con `srcset`/`sizes`, `width`/`height` y `loading="lazy"` fuera de la portada.
- Videos → H.264 recomprimidos (CRF 27, faststart), `preload="none"`, se reproducen solo cuando están en pantalla.
- Fuentes → WOFF2 (Gabarito variable desde npm, Trazo con subset latino) con `font-display: swap` y preload.
- Nombres con hash para CSS, JS, fotos y fuentes (caché de un año), HTML sin caché.
- Por cada sitio: `404.html`, `robots.txt`, `sitemap.xml`, `site.webmanifest`, favicons y `.htaccess` (https, sin www, compresión, caché, cabeceras de seguridad y CSP).
- Open Graph y Twitter Cards con `og-*.jpg` (1200×630), JSON-LD `Organization`.

## Publicación

Cada push a `main` dispara `.github/workflows/deploy.yml`, que:

1. Instala dependencias y corre `npm run build`.
2. Controla que no queden rutas a claude.ai, `/_blob/` ni Google Fonts.
3. Publica dos ramas con el resultado listo para servir: `deploy-dossier` (contenido de `dist/dossier`) y `deploy-links` (contenido de `dist/links`).

En Hostinger ya quedaron registrados los dos repositorios (hPanel → Avanzado → Git):

| Sitio | Rama | Carpeta en el servidor |
|---|---|---|
| eljardindelosgatosnegros.com.ar | `deploy-dossier` | `public_html/` |
| bios.eljardindelosgatosnegros.com.ar | `deploy-links` | `public_html/bios/` |

Para que Hostinger se actualice solo después de cada push, hay que avisarle. Dos formas, cualquiera de las dos sirve:

- **Webhooks de GitHub (recomendado):** en hPanel → Git, cada repositorio muestra una URL de *auto deployment*. En GitHub → Settings → Webhooks → *Add webhook*, cargar esa URL como *Payload URL*, *Content type* `application/json`, evento *push*. Una vez por cada sitio (dos webhooks).
- **Secrets de la Action:** cargar esas mismas URL en GitHub → Settings → Secrets and variables → Actions como `HOSTINGER_WEBHOOK_DOSSIER` y `HOSTINGER_WEBHOOK_LINKS`; la Action las llama al final.

Mientras no esté ninguna de las dos, el deploy se dispara a mano desde hPanel → Git → *Deploy*, o por la API de Hostinger.

Antes de publicar algo grande, mirarlo en el celular desde `npm run dev`.

## Control de calidad

- `node tools/capturas.mjs` compara píxel a píxel con el original: hoy la diferencia es menor al 1 % (solo recompresión de fotos y antialiasing de letras), con la misma altura de página en 390 y 1280 px.
- Lighthouse móvil (Chrome DevTools o PageSpeed Insights) sobre las URL publicadas: objetivo 90 o más en las cuatro categorías.

## Reglas de diseño

Están en `CLAUDE.md`: paleta, logotipo, tipografías y comportamiento aprobado. El diseño no se cambia sin el OK de Luz.
