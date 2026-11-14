# El Jardín de los Gatos Negros · Sitio web

Instrucciones para Claude Code. Leé este archivo entero antes de tocar nada. El `README.md` explica cómo se usa el proyecto; acá están las reglas y el contexto.

## Con quién trabajás

- **Coco** armó el sitio y maneja el hosting y el repositorio. Con Coco se puede hablar con términos técnicos.
- **Luz** es la creadora del club y comunicadora social. No es programadora. Hablale siempre en **español argentino** (vos), en un registro normal, sin lunfardo y sin jerga técnica. Si un término técnico es inevitable, explicalo en una línea.
- Luz trabaja desde el **celular (Android)** y mira todo ahí primero. Antes de mostrarle algo, revisalo vos en **390 px de ancho** y después en **1280 px**. Cuando le muestres avances, mandale capturas en tamaño celular.
- Pide cambios cortos y muy visuales ("más arriba", "más grande", "que no quede una línea entre los bloques"). Hacé exactamente eso, sin rediseñar lo que no pidió.
- Antes de un cambio grande o de publicar, preguntá. Los cambios chicos hacelos directamente.
- Los **detalles de texto** (por ejemplo, el espacio en "Luz A.Zapata" de la firma) se consultan con Luz, no se cambian solos.

## Qué es el club (contexto para los textos y el SEO)

Club de lectura en **Villa Allende, Córdoba (Argentina)**. Se leen clásicos y contemporáneos, con foco en la vida de quien escribió el libro, sin tono académico y con la idea de conocer gente. Su posicionamiento es artesanal, de alta calidad y premium, pero sin pose: nada de "exclusivo" ni "VIP".
- Instagram: @eljardindelosgatosnegros
- WhatsApp: 3543 69-9326 → https://wa.me/5493543699326
- Email: eljardindelosgatosnegros@gmail.com
- Firma: "Por Luz A. Zapata · comunicadora social, dueña de cuatro hermosos gatos negros y creadora del club."

## Las dos páginas

| Dirección | Página | Carpeta publicada |
|---|---|---|
| **https://eljardindelosgatosnegros.com.ar** (raíz) | **Dossier** | `dist/dossier/` |
| **https://bios.eljardindelosgatosnegros.com.ar** | **Página de links** para la bio de Instagram | `dist/links/` |

El nombre del subdominio (`bios`) está en un solo lugar: `contenido/sitio.json` → `subdominioLinks`.

Hosting: **Hostinger** (hosting compartido de Coco, usuario `u770738641`, con PHP y MySQL). El dominio `.com.ar` está registrado en NIC Argentina y delegado a Hostinger. Tiene que quedar listo para crecer (inscripciones con MySQL, panel para Luz, más páginas) y poder pasarse a Vercel sin rehacer nada.

## Reglas de diseño (no negociables)

El diseño **ya está aprobado por Luz**. La versión publicada tiene que verse y moverse **igual** que `_origen/dossier/index.html` y `_origen/links/index.html`. No se cambian colores, tamaños, espacios, textos ni orden.

- **Paleta:** crema #F1F0EB · negro #010101 · bordó #70293C · verde petróleo #016D71 · frambuesa #953651 · rosa viejo #BE9BA5. Máximo tres colores por pieza.
- **Isologo (el gato):** SIEMPRE negro con ojos crema, sobre cualquier fondo. Nunca blanco, crema, en negativo, sin ojos ni con borde blanco. Sobre fondo oscuro puede ir dentro de un círculo crema.
- **Logotipo:** usá solo los archivos oficiales (`src/compartido/img/logotipo-negro.svg`, `logotipo-crema.svg`). No se redibuja ni se escribe con la fuente. En el logo completo, el texto mide lo mismo que el ancho del gato y la separación es la altura de la "a".
- **Tipografías:**
  - **Trazo** (`src/compartido/fonts/trazo.ttf`, propia): solo en frases cortas, nombres de series y la firma "Por Luz A. Zapata". Nunca en párrafos.
  - **Gabarito** (variable, 400–900, desde el paquete `@fontsource-variable/gabarito`): todo lo demás. 800 para títulos informativos, 700 en negritas de listas y CTA, 500 para datos y etiquetas en mayúscula separada, 400 para textos. Nunca desde Google Fonts.
- **Textos:** en español argentino (vos), con un tono cálido y adulto, sin ternura infantil.

## Comportamiento del dossier (ya implementado, no romper)

1. **Portada:** "Club de lectura" + gato + logotipo + "Villa Allende · Córdoba" + flecha. El logotipo SVG va **incrustado en el HTML** (24 `<path>`, uno por letra) y se escribe letra por letra con máscaras, en unos 2 s. El gato son dos imágenes: un cuadro quieto (`isologo-quieto.webp`, 7 KB, lo primero que se ve) y la animación encima (`isologo-intro.webp`: parpadea, ojos quietos mientras se escribe, parpadeo lento al terminar; a los 9,665 s pasa a `isologo-anim.webp` en loop). Todo se repite si la portada sale de la pantalla y vuelve a entrar. El código está en `src/compartido/js/escribir-logo.js` y lo comparten las dos páginas.
2. **Aparición de los textos al hacer scroll:** 44 px (frases en Trazo y títulos, 60 px), curva `cubic-bezier(.16,1,.3,1)`, 1,2 s, escalonado cada 130 ms. Fotos y videos, 36 px. Se repite al salir y volver a entrar. Respeta `prefers-reduced-motion`.
3. **Listas:** números 01–04, gatito, puntito bordó de 12 px o cuadradito (`mk` en el JSON). Entran desde la izquierda (72 px) cada 200 ms; la viñeta aparece al final con un "pop".
4. **Manifiesto con foto de la gata:** dos columnas en compu; en celu primero el texto y después la foto.
5. **Marquesina:** pegada al bloque negro de Alianzas (`flush`), a todo el ancho (`bleed`), sin animación de entrada.
6. **Menú de tres puntitos:** arriba a la derecha, se arma en el build con las etiquetas de cada bloque más Inicio y Contacto (anclas reales `#id`), scroll suave.
7. **Cierre bordó:** gato animado + logotipo crema (como `<img>`), pregunta (700) y bajada (400), botones de Instagram y WhatsApp, "Nos vemos entre las flores" en Trazo.
8. **Franja de créditos** crema al final, con "Por Luz A. Zapata" en Trazo bordó.
9. **Videos:** sin `autoplay` y con `preload="none"`; el JavaScript los reproduce cuando están cerca de la pantalla y los pausa al salir. Siempre muted, loop, `playsinline` y con póster.

No queda nada de claude.ai: ni modo edición, ni `claude.use`, ni `/_blob/`, ni detección de bots, ni Google Fonts. El build falla en GitHub si reaparece alguna de esas rutas.

## Arquitectura

HTML, CSS y JavaScript **sin frameworks**. `tools/build.mjs` genera HTML estático y completo (Google lee el contenido sin ejecutar JavaScript). El navegador no carga ninguna dependencia externa.

```
contenido/
  dossier.json        textos, fotos y orden de bloques del dossier
  links.json          encuentro, botones, mensajes de WhatsApp, firma
  sitio.json          dominio, subdominio, redes, contacto, SEO
  img/                fotos, videos y pósters (fuente de verdad)
src/
  compartido/         base.css, fonts/, img/ (logos y gato), js/escribir-logo.js, extras.mjs (404, robots, sitemap, manifest, .htaccess)
  dossier/            plantilla.mjs + dossier.css + dossier.js + og-dossier.jpg
  links/              plantilla.mjs + links.css + links.js + og-links.jpg
tools/
  build.mjs           arma dist/ a partir de contenido/ + src/
  imagenes.mjs        fotos (sharp → WebP 640/800/1080/1600/2400), videos (ffmpeg-static), fuentes (subset WOFF2), SVG (svgo)
  dev.mjs             npm run dev: servidor local en 0.0.0.0:5173, rebuild en proceso aparte al cambiar contenido/ o src/
  capturas.mjs        capturas de página completa y diff píxel a píxel contra _origen/ (390 y 1280 px)
  og.mjs              genera las imágenes Open Graph con Playwright
_origen/              referencia, NO se publica
dist/                 salida (ignorada por git); la arma GitHub Actions
```

- Para cambiar un texto, una foto o el orden solo se toca un `.json` (y se agrega la foto a `contenido/img/`). Explicale a Luz que se edita así.
- Modelo de bloques: `full` (con `bleed`/`flush`), `duo` (`r` sq/tall, `fit` contain), `text` (`theme` crema/bordo/negro, `mk`, `side`), `manif`, `palette`, `fonts`. Las fotos se referencian como `{ "src": "img/x.jpg", "alt": "…" }` y los videos como `{ "video": "img/x.mp4", "poster": "img/x-poster.jpg", "alt": "…" }`. Las medidas las saca el build.
- CSS: todo inline y minificado en cada página (son ~10 KB). JS: un archivo con `defer` y hash. Nombres con hash para todo lo cacheable.
- `.htaccess` lleva una CSP: si se agrega un script inline nuevo, hay que sumar su hash en `extras.mjs` (el único actual es el que pone `lw-wait`).

## Rendimiento

Objetivo: Lighthouse móvil ≥ 90 en las cuatro categorías, LCP < 2,5 s. En local (sin compresión) el dossier da ~89 y los links ~97; la medición que vale es sobre Hostinger, con gzip/brotli. Lo que pesa: la intro del gato (~420 KB, animada; no se puede bajar mucho sin tocar la animación) y la marquesina (~780 KB, ya recomprimida desde 3,7 MB).

## SEO y vista previa al compartir

Ya está: `lang="es-AR"`, title/description/canonical por página, Open Graph y Twitter con `og-dossier.jpg` / `og-links.jpg` (1200×630, se generan con `node tools/og.mjs`), favicons (ico, svg, 180, 192, 512) + `site.webmanifest`, JSON-LD `Organization` (dossier) y `WebPage` (links), `sitemap.xml`, `robots.txt`, 404 con la marca. Después de publicar: pasar el link por el depurador de Facebook (Sharing Debugger) y pedirle a Luz que lo mande por WhatsApp.

## Publicación (GitHub → Hostinger)

- `main` es la fuente. Cada push dispara `.github/workflows/deploy.yml`: build, control de rutas prohibidas y publicación de las ramas `deploy-dossier` y `deploy-links` con el contenido listo para servir.
- En Hostinger están registrados los dos repositorios Git: `deploy-dossier` → `public_html/` y `deploy-links` → `public_html/bios/` (el subdominio `bios` vive adentro del `public_html` principal; el `.htaccess` de links redirige cualquier otro host a `https://bios.…/`). Para actualizar: webhooks de GitHub con las URL de *auto deployment* de hPanel → Git, o los secrets `HOSTINGER_WEBHOOK_*` que usa la Action, o a mano con `hosting_git_deploy-website-repository` (API) / botón *Deploy* en hPanel.
- Si alguna vez hay que volver a registrar el repo raíz, la carpeta tiene que estar vacía (la API no borra archivos; se vació subiendo un zip vacío con `deploy-static-site-archive` y borrando el resto con la API del administrador de archivos).
- Publicar solo con el OK de Luz y de Coco. Antes, `npm run build` limpio y revisar que no queden rutas a `/_blob/`, claude.ai ni Google Fonts.
- **Credenciales:** nunca en el código. Las variables secretas de PHP van en un archivo fuera de `public_html`.

## Futuro (dejá el terreno preparado, no lo construyas todavía)

- `/api/` en PHP + MySQL (Hostinger: host `127.0.0.1`, puerto 3306) para inscripciones con cupos, lista de interesados y un panel `/admin` con usuario y contraseña donde Luz edite `contenido/*.json`, el próximo encuentro y las fotos desde el celu.
- Más páginas: `/encuentros` y `/inscripcion`. JSON-LD `Event` para cada encuentro.
- Si en algún momento se pasa a Vercel, `dist/` se sube tal cual y las partes en PHP se rehacen como funciones.

## Si algo no está claro

Preguntá con una sola pregunta concreta y, si podés, con dos opciones para elegir. Si la duda es de diseño, la respuesta casi siempre es: **igual que el original**.
