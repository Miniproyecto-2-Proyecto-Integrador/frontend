import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { aplicarMetadatos, metadatosParaRuta } from '../src/services/metadatos.ts'

const leer = ruta => readFileSync(new URL(ruta, import.meta.url), 'utf8')
const config = JSON.parse(leer('../vercel.json'))

test('Inicio es indexable y las demás páginas actuales tienen descripción y noindex', () => {
  const titulos = {
    '/': 'Inicio', '/ingresar': 'Iniciar sesión', '/registro': 'Crear cuenta',
    '/registro/usuario': 'Completar perfil', '/dashboard': 'Panel', '/perfil': 'Mi perfil',
    '/salas/sala-1': 'Sala', '/base-tecnica': 'Base técnica',
    '/ayuda': 'Ayuda', '/accesibilidad': 'Declaración de accesibilidad',
  }
  const descripciones = new Set()
  for (const [ruta, titulo] of Object.entries(titulos)) {
    const meta = metadatosParaRuta(ruta)
    assert.equal(meta.titulo, `${titulo} · Salón de Estudio`)
    assert.ok(meta.descripcion.length > 20)
    assert.equal(meta.robots, ruta === '/' ? 'index, follow' : 'noindex, follow')
    descripciones.add(meta.descripcion)
  }
  assert.equal(descripciones.size, Object.keys(titulos).length)
})

test('rutas desconocidas y descendientes no definidos nunca son indexables por defecto', () => {
  for (const ruta of ['/desconocida', '/dashboard/extra', '/registro/inexistente', '/salas/', '/salas/a/b', '/__proto__']) {
    const meta = metadatosParaRuta(ruta)
    assert.equal(meta.robots, 'noindex')
    assert.equal(meta.titulo, 'Página no encontrada · Salón de Estudio')
  }
})

test('coincide con mayúsculas y barra final de React Router sin incorporar datos personales', () => {
  assert.deepEqual(metadatosParaRuta('/INGRESAR/'), metadatosParaRuta('/ingresar'))
  assert.equal(metadatosParaRuta('/salas/privada_123/').robots, 'noindex, follow')
  const meta = metadatosParaRuta('/persona@example.com')
  assert.doesNotMatch(JSON.stringify(meta), /persona@example.com/)
  assert.doesNotMatch(JSON.stringify(metadatosParaRuta('/salas/identificador-privado')), /identificador-privado/)
})

// Doble acotado del DOM: prueba el helper real, sin instalar una implementación de DOM.
// Los efectos de React y la inspección del head en navegador siguen siendo comprobaciones manuales.
function documentoDePrueba() {
  const nodos = []
  const documento = {
    title: '',
    createElement(tipo) {
      assert.equal(tipo, 'meta')
      return { name: '', content: '', remove() {
        const indice = nodos.indexOf(this)
        if (indice !== -1) nodos.splice(indice, 1)
      } }
    },
    head: {
      appendChild(nodo) { nodos.push(nodo); return nodo },
      querySelectorAll(selector) {
        const nombre = /^meta\[name="([^"]+)"\]$/.exec(selector)?.[1]
        assert.ok(nombre)
        return nodos.filter(nodo => nodo.name === nombre)
      },
    },
  }
  return { documento, nodos }
}

test('actualización idempotente: repetir el efecto no duplica description ni robots', () => {
  const { documento, nodos } = documentoDePrueba()
  aplicarMetadatos('/ingresar', documento)
  const primera = nodos[0]
  aplicarMetadatos('/ingresar', documento)
  assert.equal(nodos.length, 2)
  assert.equal(nodos[0], primera)
  assert.equal(documento.head.querySelectorAll('meta[name="description"]').length, 1)
  assert.equal(documento.head.querySelectorAll('meta[name="robots"]').length, 1)
})

test('reutiliza etiquetas iniciales, elimina duplicados y conserva otras etiquetas', () => {
  const { documento, nodos } = documentoDePrueba()
  for (const nombre of ['description', 'description', 'robots', 'robots', 'viewport']) {
    const nodo = documento.createElement('meta')
    nodo.name = nombre
    documento.head.appendChild(nodo)
  }
  const inicial = nodos[0]
  const viewport = nodos[4]
  aplicarMetadatos('/registro', documento)
  assert.equal(nodos.length, 3)
  assert.equal(nodos[0], inicial)
  assert.equal(inicial.content, metadatosParaRuta('/registro').descripcion)
  assert.ok(nodos.includes(viewport))
})

test('navegar de rutas privadas o desconocidas a Inicio restaura todos sus metadatos', () => {
  const { documento, nodos } = documentoDePrueba()
  for (const ruta of ['/', '/perfil', '/registro/usuario', '/desconocida', '/']) {
    aplicarMetadatos(ruta, documento)
    const meta = metadatosParaRuta(ruta)
    assert.equal(documento.title, meta.titulo)
    assert.equal(nodos.find(nodo => nodo.name === 'description').content, meta.descripcion)
    assert.equal(nodos.find(nodo => nodo.name === 'robots').content, meta.robots)
    assert.equal(nodos.length, 2)
  }
})

test('HTML inicial contiene una descripción y título coherentes, sin noindex global', () => {
  const html = leer('../index.html')
  assert.equal((html.match(/<meta\s+name="description"/g) ?? []).length, 1)
  assert.ok(html.includes(metadatosParaRuta('/').descripcion))
  assert.ok(html.includes(`<title>${metadatosParaRuta('/').titulo}</title>`))
  assert.doesNotMatch(html, /noindex/i)
})

test('robots.txt permite rastreo sin HTML, Disallow ni directivas noindex', () => {
  const texto = leer('../public/robots.txt').replaceAll('\r\n', '\n')
  assert.equal(texto, 'User-agent: *\nAllow: /\n')
  assert.doesNotMatch(texto, /<!doctype|<html|Disallow|noindex/i)
})

test('build incluye dist/robots.txt sin transformar y conserva metadatos en el HTML', () => {
  assert.ok(existsSync(new URL('../dist/robots.txt', import.meta.url)), 'Ejecuta npm run build antes de la suite completa.')
  assert.equal(leer('../dist/robots.txt'), leer('../public/robots.txt'))
  assert.ok(leer('../dist/index.html').includes(metadatosParaRuta('/').descripcion))
  assert.doesNotMatch(leer('../dist/index.html'), /noindex/i)
})

// Evaluar la semántica de los sources simples /ruta/:path*, no simular el despliegue Vercel.
function cabecerasPara(pathname) {
  return config.headers.filter(regla => {
    assert.ok(regla.source.endsWith('/:path*'))
    const prefijo = regla.source.slice(0, -'/:path*'.length)
    return pathname === prefijo || pathname.startsWith(prefijo + '/')
  }).flatMap(regla => regla.headers)
}

test('Vercel excluye rutas de autenticación, privadas, técnicas y provisionales desde HTTP', () => {
  for (const ruta of [
    '/ingresar', '/registro', '/registro/usuario', '/dashboard', '/perfil',
    '/salas/123', '/base-tecnica', '/ayuda', '/accesibilidad',
    '/registro/', '/perfil/extra',
  ]) {
    const robots = cabecerasPara(ruta).filter(header => header.key.toLowerCase() === 'x-robots-tag')
    assert.equal(robots.length, 1, ruta)
    assert.equal(robots[0].value, 'noindex, follow')
  }
})

test('Vercel no añade noindex a Inicio o archivos estáticos y conserva el fallback SPA', () => {
  for (const ruta of ['/', '/robots.txt', '/assets/app.js', '/favicon.svg', '/icons.svg', '/registro-publico']) {
    assert.deepEqual(cabecerasPara(ruta), [])
  }
  assert.deepEqual(config.rewrites, [{ source: '/(.*)', destination: '/index.html' }])
  assert.equal(config.redirects, undefined)
  assert.equal(config.routes, undefined)
})
