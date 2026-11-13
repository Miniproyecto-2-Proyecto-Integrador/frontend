# Metadatos, robots.txt y verificación Lighthouse

Rama: feature/US-03-login. Base: db5b9a0.
Cambios locales sin commit, push ni despliegue.

## Problemas y alcance

Valeria reportó ausencia de meta description y robots.txt inválido. En la
investigación previa se confirmó que no existía public/robots.txt y que la URL
de producción devolvía index.html con HTTP 200 y Content-Type text/html.
No se reprodujo el desglose exacto de los 14 errores del reporte original.

Se añaden metadatos y un archivo estático de robots. No se cambian autenticación,
Panel, componentes visuales, endpoints, Firebase, .env ni dependencias.

## Implementación

- index.html: descripción general y título inicial coherentes con Inicio.
  No contiene noindex global.
- src/services/metadatos.ts: mapa único de título, descripción y robots.
  Los textos son públicos y estáticos: no incorporan correo, nombres de usuario,
  identificadores de sala ni datos del perfil.
- useDocumentTitle conserva su nombre y su llamada desde Layout; amplía el efecto
  existente para actualizar los tres metadatos según pathname. No se crean hooks
  por página ni se añade una segunda llamada al mecanismo.
- El actualizador reutiliza la primera etiqueta existente y elimina duplicados
  de description/robots, sin modificar viewport u otras etiquetas. Repetir la
  actualización, incluido StrictMode, no acumula nodos. Al volver a Inicio
  restaura título, descripción y política de indexación.
- public/robots.txt contiene únicamente:

```text
User-agent: *
Allow: /
```

No incluye Disallow ni noindex: permite rastrear las páginas para que se lean
las instrucciones de exclusión, sin reemplazar las protecciones de autenticación.

## Política actual

| Ruta | Meta robots después de React | Cabecera Vercel |
|---|---|---|
| / | index, follow | Sin X-Robots-Tag |
| /ingresar | noindex, follow | noindex, follow |
| /registro y /registro/usuario | noindex, follow | noindex, follow |
| /dashboard | noindex, follow | noindex, follow |
| /perfil | noindex, follow | noindex, follow |
| /salas/ID | noindex, follow | noindex, follow |
| /base-tecnica | noindex, follow | noindex, follow |
| /ayuda y /accesibilidad | noindex, follow | noindex, follow |
| Desconocidas | noindex | Sin cabecera general para rutas desconocidas |

Ayuda y Accesibilidad continúan usando PaginaPendiente, por lo que todavía no
tienen contenido público adecuado para indexación. Cuando esté aprobado ese
contenido habrá que actualizar tanto el mapa de metadatos como sus cabeceras.
Las rutas no reconocidas nunca heredan index por defecto en el mapa.
Se admiten las mayúsculas y la barra final de las rutas conocidas para seguir el
comportamiento de React Router. Los parámetros de consulta no se usan para
personalizar metadatos.

## Vercel y archivos estáticos

Se agregan reglas X-Robots-Tag: noindex, follow para las rutas de la tabla.
Cada source /ruta/:path* incluye la raíz de esa ruta y sus descendientes.
No hay una regla global de noindex ni cabeceras de exclusión para Inicio,
robots.txt, favicon.svg, icons.svg o los assets.

Se conserva exactamente la regla existente:

```json
{ "source": "/(.*)", "destination": "/index.html" }
```

No se añade una reescritura de robots.txt hacia sí mismo ni se reemplaza la
configuración por routes. Vercel documenta que rewrites comprueba el sistema
de archivos por defecto. Con dist/robots.txt generado, ese archivo estático puede
servirse antes del fallback. Esto preserva las recargas directas de React Router.
La configuración real del proyecto y la respuesta HTTP se deben comprobar
después del despliegue: los tests locales no ejecutan el motor de Vercel.

## Pruebas ejecutadas

```powershell
npm run lint
npm run build
node --test tests/*.test.mjs
git diff --check
```

Resultados locales: lint aprobado; build/TypeScript aprobados; 99 pruebas
aprobadas, cero fallidas; diff sin errores. Se incluyen 88 pruebas existentes y
11 nuevas. El build contiene dist/robots.txt idéntico a public/robots.txt.

| Comprobación nueva | Evidencia |
|---|---|
| Título, descripción y política por ruta | tests/seo.test.mjs |
| Privadas y desconocidas noindex por defecto | tests/seo.test.mjs |
| Normalización y ausencia de datos personales | tests/seo.test.mjs |
| Repetición sin duplicados | Actualizador real sobre un doble acotado del DOM |
| Reutilización de etiquetas y conservación de viewport | Actualizador real sobre un doble acotado del DOM |
| Navegación privada → Inicio restaura metadatos | Secuencia del actualizador real |
| Descripción inicial y ausencia de noindex global | Lectura de index.html |
| robots.txt plano y válido | Lectura de public/robots.txt |
| Copia de robots y descripción en build | Lectura de dist después del build |
| Cabeceras de rutas excluidas | Reglas JSON y casos de rutas |
| Inicio/assets sin exclusión y fallback intacto | Reglas JSON |

Las pruebas de DOM usan un doble mínimo sin dependencias nuevas; no montan
React ni ejecutan useEffect en un navegador. Las pruebas de cabeceras evalúan
las reglas simples configuradas, no simulan toda la plataforma Vercel.
La suite completa requiere ejecutar primero npm run build.

## Comprobación después de un despliegue autorizado

Estado de todos los puntos siguientes: pendiente. No se realizó despliegue
ni se volvió a ejecutar Lighthouse como parte de este cambio local.

1. Abrir /robots.txt en la URL desplegada. En Network comprobar HTTP 200,
   Content-Type text/plain y las dos líneas de texto; no debe aparecer HTML,
   la aplicación, una pantalla de acceso ni una redirección inesperada.
2. Revisar la petición document de /: descripción inicial correcta y ausencia
   de X-Robots-Tag: noindex.
3. Revisar peticiones directas a /ingresar, /registro, /registro/usuario,
   /dashboard, /perfil, /salas/ID y /base-tecnica. Comprobar la cabecera
   X-Robots-Tag: noindex, follow. Revisar también Ayuda y Accesibilidad.
4. En Elements comprobar una sola meta description y una sola meta robots
   después de navegar entre Inicio, ingreso, registro, privadas y ruta desconocida.
   Al volver a Inicio deben cambiar ambas etiquetas y el título.
5. Recargar rutas internas y comprobar que continúa funcionando el fallback SPA.
   Verificar que favicon, icons y assets siguen sirviéndose como archivos.
6. Ejecutar Lighthouse en móvil y escritorio con la misma versión/configuración
   que usó QA. Guardar HTML/JSON del informe, URL inicial, URL final y contexto
   de sesión. La finalización Google puede redirigir si no hay sesión pendiente;
   probar con una cuenta de prueba autorizada cuando corresponda.
7. Confirmar que desaparecen los problemas de descripción ausente y robots.txt
   inválido. Revisar por separado las exclusiones intencionales de indexación.

## Limitaciones

- Los cambios todavía no están en producción.
- Las cabeceras de Vercel no se aplican en el servidor local de Vite.
- Descripciones específicas y noindex de rutas desconocidas se actualizan con
  JavaScript. El HTML inicial usa la descripción general; no se incorpora SSR.
- Las cabeceras cubren las rutas explícitas indicadas, no todas las URLs
  desconocidas. Una URL inexistente puede seguir respondiendo 200 por el fallback
  SPA; React muestra Página no encontrada y añade noindex al renderizar.
- noindex es una política de buscadores, no un mecanismo de seguridad.
- Lighthouse puede señalar bloqueo de indexación en las páginas que deben
  excluirse. No se debe quitar noindex para obtener una puntuación más alta.
  No se promete una puntuación SEO concreta.

## Referencias técnicas

- [Vite: public](https://vite.dev/guide/assets#the-public-directory)
- [Vercel: configuración; rewrites comprueba el filesystem](https://vercel.com/docs/project-configuration/vercel-json)
- [Google: SEO con JavaScript y meta robots](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Lighthouse: descripción](https://developer.chrome.com/docs/lighthouse/seo/meta-description)
- [Lighthouse: indexación](https://developer.chrome.com/docs/lighthouse/seo/is-crawlable)

## Archivos

Modificados: index.html, src/hooks/useDocumentTitle.ts, vercel.json y README.md.
Creados: public/robots.txt, src/services/metadatos.ts, tests/seo.test.mjs y docs/SEO.md.
