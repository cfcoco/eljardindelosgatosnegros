# El Jardín de los Gatos Negros · Sitio web

Instrucciones para Claude Code. Leé este archivo entero antes de tocar nada.

## Con quién trabajás

- **Luz** es la creadora del club y comunicadora social. No es programadora. Hablale siempre en **español argentino** (vos), en un registro normal, sin lunfardo y sin jerga técnica. Si un término técnico es inevitable, explicalo en una línea.
- Luz trabaja desde el **celular (Android)** y mira todo ahí primero. Antes de mostrarle algo, revisalo vos en **390 px de ancho** y después en **1280 px**. Cuando le muestres avances, mandale capturas en tamaño celular.
- Pide cambios cortos y muy visuales ("más arriba", "más grande", "que no quede una línea entre los bloques"). Hacé exactamente eso, sin rediseñar lo que no pidió.
- Antes de un cambio grande o de publicar, preguntale. Los cambios chicos hacelos directamente.

## Qué es el club (contexto para los textos y el SEO)

Club de lectura en **Villa Allende, Córdoba (Argentina)**. Se leen clásicos y contemporáneos, con foco en la vida de quien escribió el libro, sin tono académico y con la idea de conocer gente. Su posicionamiento es artesanal, de alta calidad y premium, pero sin pose: nada de "exclusivo" ni "VIP".
- Instagram: @eljardindelosgatosnegros
- WhatsApp: 3543 69-9326 → https://wa.me/5493543699326
- Firma: "Por Luz A. Zapata · comunicadora social, dueña de cuatro hermosos gatos negros y creadora del club."

## Objetivo

Pasar a un sitio propio, en HTML, CSS y JavaScript, dos páginas que hoy están publicadas en claude.ai:

| Dirección | Página | Origen en esta carpeta |
|---|---|---|
| **https://eljardindelosgatosnegros.com.ar** (raíz) | **Dossier** | `_origen/dossier/` |
| **https://links.eljardindelosgatosnegros.com.ar** (subdominio) | **Página de links** para la bio de Instagram | `_origen/links/` |

El subdominio propuesto es `links`. Si Luz elige otro nombre (por ejemplo `bio`), cambialo en un solo lugar de la configuración.

El sitio se aloja en **Hostinger** (hosting compartido de Coco, con PHP y MySQL). Tiene que quedar listo para crecer: inscripciones con base de datos MySQL, un panel para que Luz edite sola, más páginas. También tiene que poder pasarse a Vercel sin rehacer nada.

## Reglas de diseño (no negociables)

El diseño **ya está aprobado por Luz**. La migración tiene que verse y moverse **igual** que `_origen/dossier/index.html`. No se cambian colores, tamaños, espacios, textos ni orden.

- **Paleta:** crema #F1F0EB · negro #010101 · bordó #70293C · verde petróleo #016D71 · frambuesa #953651 · rosa viejo #BE9BA5. Máximo tres colores por pieza.
- **Isologo (el gato):** SIEMPRE negro con ojos crema, sobre cualquier fondo. Nunca blanco, crema, en negativo, sin ojos ni con borde blanco. Sobre fondo oscuro puede ir dentro de un círculo crema.
- **Logotipo:** usá solo los archivos oficiales (`img/logotipo-negro.svg`, `img/logotipo-crema.svg`). No se redibuja ni se escribe con la fuente. En el logo completo, el texto mide lo mismo que el ancho del gato y la separación es la altura de la "a".
- **Tipografías:**
  - **Trazo** (`fonts/trazo.ttf`, propia): solo en frases cortas, nombres de series y la firma "Por Luz A. Zapata". Nunca en párrafos.
  - **Gabarito** (`fonts/gabarito-*.ttf`): todo lo demás. 800 para títulos informativos, 500 para datos y etiquetas en mayúscula separada, 400 para textos.
  - **Importante:** el dossier original carga Gabarito desde Google Fonts. En el sitio nuevo usá los archivos locales.
- **Textos:** en español argentino (vos), con un tono cálido y adulto, sin ternura infantil.

## Qué tiene que hacer el dossier (comportamiento a reproducir)

Revisalo todo en `_origen/dossier/index.html`. El contenido está en el `<script type="application/json" id="state">` y la página se arma desde ahí.

1. **Portada:**
   - "Club de lectura" + gato + logotipo + "Villa Allende · Córdoba" + flecha.
   - El logotipo SVG **se escribe letra por letra**: cada `path` se revela con una máscara de izquierda a derecha, en unos 2 s.
   - El gato usa `isologo-intro2.webp`: parpadea rápido al empezar, tiene los ojos quietos mientras se escribe el logotipo y hace un **parpadeo lento** justo al terminar. A los 9,665 s pasa a `isologo-anim-v2.webp`, que queda en loop sin corte.
   - Todo se repite si la portada sale de la pantalla y vuelve a entrar.
2. **Aparición de los textos al hacer scroll:**
   - Cada texto (etiqueta, frase en Trazo, título, bajada, párrafo, nota, cierre) sube 44 px; las frases en Trazo y los títulos suben 60 px.
   - Curva `cubic-bezier(.16,1,.3,1)`, de 1,2 s, escalonada cada 130 ms.
   - Fotos y videos suben 36 px.
   - **Se repite** cada vez que el elemento sale de la pantalla y vuelve a entrar, tanto bajando como subiendo.
   - Respeta `prefers-reduced-motion`.
3. **Listas:**
   - Viñetas de cuatro tipos: números 01–04, gatito, puntito bordó de 12 px y cuadradito.
   - Cada punto entra desde la izquierda (72 px), escalonado cada 200 ms. La viñeta aparece al final con un leve "pop".
   - Viñetas a 14 px del texto y alineadas con la primera línea.
4. **Manifiesto con foto de la gata:**
   - En compu: texto a la izquierda y foto a la derecha, en dos columnas.
   - En celu: **primero el texto y después la foto**.
5. **Marquesina:** va **pegada** al bloque negro de Alianzas, sin espacio ni línea entre los dos, y a todo el ancho. No tiene animación de entrada, para que nunca se abra un hueco.
6. **Menú de tres puntitos:**
   - Arriba a la derecha.
   - Se arma solo con las etiquetas de cada bloque, más Inicio y Contacto.
   - Hace scroll suave hasta la sección.
7. **Cierre bordó:**
   - Gato animado + logotipo crema, con las proporciones del logo completo oficial.
   - Pregunta (700) y bajada (400), del mismo tamaño.
   - Botones de Instagram y WhatsApp, en una sola línea cada uno en el celu.
   - "Nos vemos entre las flores" en Trazo.
8. **Franja de créditos** crema al final, con "Por Luz A. Zapata" en Trazo bordó.
9. **Videos:**
   - Se reproducen solo cuando están en pantalla (`IntersectionObserver` + play/pause).
   - Siempre muted, en loop, con `playsinline` y con póster.

**Hay que sacar** todo lo que depende de claude.ai: el modo edición (botón Editar, Guardar, Descartar), `claude.use(...)`, `artifact.publish`, `assets.upload`, la detección de bots (`BOT`, `is-bot`), `window.__jgnDoc` y las rutas `/_blob/`.

## Arquitectura

HTML, CSS y JavaScript **sin frameworks**. Un script de build en Node genera HTML estático y completo, para que Google lea el contenido sin ejecutar JavaScript. El navegador no carga ninguna dependencia externa.

```
jardin-web/
  CLAUDE.md
  _origen/              ← referencia, NO se publica
    dossier/            ← dossier actual (index.html + img + fonts)
    links/              ← página de links actual
    originales/         ← fotos en alta, PDF, etc.
  contenido/
    dossier.json        ← todos los textos, fotos y orden de bloques (sale del JSON "state")
    links.json          ← encuentro, botones, mensajes de WhatsApp, firma
    sitio.json          ← dominio, subdominio, redes, datos de contacto, SEO
  src/
    compartido/         ← fuentes, logos, CSS base (paleta, tipografías, animaciones)
    dossier/            ← plantilla + CSS + JS del dossier
    links/              ← plantilla + CSS + JS de links
  tools/
    build.mjs           ← arma dist/ a partir de contenido/ + src/
    imagenes.mjs        ← optimiza fotos (ver Rendimiento)
  dist/
    dossier/            → se sube a public_html del dominio raíz
    links/              → se sube a public_html del subdominio
  package.json
```

- Para cambiar un texto, una foto o el orden, solo se toca un `.json` y se ejecuta `npm run build`. Explicale a Luz que se edita así.
- Mantené el modelo de bloques del dossier original (`cover`, `text` con `theme` crema/bordo/negro y `side`, `manif`, `full` con `bleed`/`flush`, `duo` con `r` sq/tall y `fit`, `close`), así los bloques se pueden reordenar.
- `npm run dev` levanta un servidor local para mirar los cambios. Tiene que andar también en el celu, dentro de la misma red wifi.

## Rendimiento (que cargue rápido en 4G)

- **Objetivo:** Lighthouse móvil de 90 o más en Rendimiento, Accesibilidad, Buenas prácticas y SEO. LCP menor a 2,5 s.
- **Imágenes:**
  - Generar versiones WebP (y AVIF si suma) de 640, 1080, 1600 y 2400 px con `srcset`/`sizes`.
  - Agregar `width`/`height` en todas, para que la página no salte al cargar.
  - `loading="lazy"` en todo lo que no se ve al abrir. La foto principal de la portada carga con prioridad (`fetchpriority="high"`).
  - Usar `sharp` solo como herramienta de build (devDependency).
- **Calidad de las fotos:** cuando exista una versión en alta en `_origen/originales/`, partí de esa. Por ejemplo, `gata-original.jpg` (el encuadre en compu: `object-position: 46% 35%`) y `remera-sin-contorno.jpg`.
- **Fuentes:**
  - Convertir a WOFF2 y hacer un subset latino con ñ, tildes, ¿¡ «» “” · & @.
  - `font-display: swap`, con preload de Gabarito 400 y de la Trazo.
- **Videos:** recomprimir en H.264 (`-preset veryfast`, CRF 26–28), `preload="none"`, y siempre con póster. La marquesina (3,7 MB) hay que bajarla mucho.
- **CSS y JS:** CSS crítico de la portada inline; el resto, minificado. JS diferido con `defer`.

## SEO y vista previa al compartir

Esto es clave para Luz: al mandar el link por WhatsApp tiene que aparecer **su portada**, no un logo genérico.

- `<html lang="es-AR">`, un `<title>` y una `<meta name="description">` por página, y `canonical`.
- **Open Graph y Twitter:** `og:title`, `og:description`, `og:url`, `og:type=website`, `og:locale=es_AR` y **`og:image`**: una imagen de 1200×630 hecha a propósito, con el gato y el logotipo sobre crema y "Club de lectura · Villa Allende, Córdoba". Generala en el build y guardala como `og-dossier.jpg` y `og-links.jpg`. Usá URLs absolutas.
- **Favicons:** el gato, en 16, 32, 180 (apple-touch) y 512, más el `site.webmanifest` con theme-color #70293C.
- **JSON-LD:** `Organization` (nombre, logo, `sameAs` de Instagram, `areaServed` Villa Allende, Córdoba, AR). Más adelante, `Event` para cada encuentro.
- `sitemap.xml` y `robots.txt` en cada sitio, y una página **404** con la marca y un botón para volver.
- Textos alternativos reales en todas las fotos (los `alt` ya están en el JSON).

## Hostinger

- **Estructura en el servidor:** el dominio raíz y el subdominio tienen cada uno su `public_html`. El subdominio `links` se crea en hPanel → Dominios → Subdominios.
- **`.htaccess`** en cada sitio:
  - Forzar https y redirigir www a la versión sin www.
  - Compresión gzip/brotli.
  - Caché larga para `/img`, `/fonts`, `/css` y `/js`: usar nombres con hash en el build y `Cache-Control: max-age=31536000, immutable`. Caché corta para el HTML.
  - `ErrorDocument 404`.
  - Headers de seguridad básicos: `X-Content-Type-Options`, `Referrer-Policy` y una CSP simple.
- **Publicación (solo con el OK de Luz):**
  - Opción simple: subir el contenido de `dist/dossier/` y `dist/links/` con hPanel → Administrador de archivos, o por FTP.
  - Opción recomendada para más adelante: un repositorio de GitHub con el deploy automático de Hostinger, o el CLI: `hostinger up dist/dossier --domain eljardindelosgatosnegros.com.ar --format json`.
  - Antes de publicar, generá un `dist/` limpio y revisá que no queden rutas a `/_blob/`, a claude.ai ni a Google Fonts.
- **Verificación posterior:** abrir el sitio en el celu, probar todos los links, pasar el link por el depurador de Facebook (Sharing Debugger) para refrescar la vista previa y pedirle a Luz que lo mande por WhatsApp.
- **Credenciales:** nunca guardes contraseñas ni tokens en el código. Las variables secretas de PHP van en un archivo fuera de `public_html`.

## Futuro (dejá el terreno preparado, no lo construyas todavía)

- `/api/` en PHP + MySQL (Hostinger: host `127.0.0.1`, puerto 3306) para:
  - Inscripciones con cupos.
  - Lista de interesados.
  - Un panel `/admin` con usuario y contraseña donde Luz edite los textos de `contenido/*.json`, el próximo encuentro y las fotos desde el celu.
- Más páginas: `/encuentros` y `/inscripcion`.
- Si en algún momento se pasa a Vercel, `dist/` se sube tal cual y las partes en PHP se rehacen como funciones.

## Página de links (subdominio)

- Adaptala desde `_origen/links/index.html`, que tiene todo en un `const C = {...}`. Pasá esos datos a `contenido/links.json`.
- El botón "Colaborá con el club" lleva a **https://eljardindelosgatosnegros.com.ar/** (el dossier).
- Los datos del próximo encuentro (libro, autor/a, fecha) todavía son de ejemplo. Si un campo está vacío, esa línea no aparece.

## Orden de trabajo

1. Leer `_origen/` y armar `contenido/*.json` a partir del JSON "state" del dossier y del `const C` de links.
2. Armar el build y el dossier. Compararlo **lado a lado** con `_origen/dossier/index.html` en 390 y 1280 px, con capturas, hasta que se vean iguales.
3. Rendimiento, SEO, imagen OG, favicons y `.htaccess`.
4. Página de links.
5. Lighthouse y revisión final en el celu, con Luz.
6. Publicar en Hostinger, solo cuando Luz dé el OK y el dominio ya esté activo.

## Si algo no está claro

Preguntale a Luz con una sola pregunta concreta y, si podés, con dos opciones para elegir. Si la duda es de diseño, la respuesta casi siempre es: **igual que el original**.
