// Compila las fuentes TS/TSX en memoria para pruebas Node, sin dependencias nuevas.
// La URL reservada .invalid y fetch sustituido en las pruebas evitan usar servicios reales.
import { registerHooks } from 'node:module'
import { readFileSync, existsSync } from 'node:fs'
import ts from 'typescript'

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && context.parentURL?.includes('/src/')) {
      const url = new URL(specifier, context.parentURL)
      for (const extension of ['.ts', '.tsx']) {
        const candidato = new URL(url.href + extension)
        if (existsSync(candidato)) return nextResolve(candidato.href, context)
      }
    }
    return nextResolve(specifier, context)
  },
  load(url, context, nextLoad) {
    if (url.includes('/src/') && /\.tsx?$/.test(url)) {
      const original = readFileSync(new URL(url), 'utf8')
      const source = ts.transpileModule(original.replaceAll('import.meta.env', '({ VITE_API_URL: "https://api.invalid" })'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023, jsx: ts.JsxEmit.ReactJSX },
      }).outputText
      return { format: 'module', source, shortCircuit: true }
    }
    return nextLoad(url, context)
  },
})
