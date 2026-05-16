import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'
import { transform } from 'esbuild'

const root = process.cwd()
const entry = resolve(root, 'src/main.jsx')
const extensions = ['.js', '.jsx', '.ts', '.tsx']
const visited = new Set()
const importPattern = /\bimport\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]|import\(['"]([^'"]+)['"]\)/g

const resolveLocalImport = (fromFile, specifier) => {
  if (!specifier.startsWith('.')) return null

  const base = resolve(dirname(fromFile), specifier)
  const candidates = extname(base)
    ? [base]
    : [
        ...extensions.map(ext => `${base}${ext}`),
        ...extensions.map(ext => join(base, `index${ext}`)),
      ]

  return candidates.find(candidate => existsSync(candidate)) || base
}

const loaderFor = (filePath) => {
  const ext = extname(filePath).slice(1)
  return ext === 'js' ? 'jsx' : ext
}

const checkFile = async (filePath) => {
  if (visited.has(filePath)) return
  visited.add(filePath)

  if (!existsSync(filePath)) {
    throw new Error(`Missing local import: ${filePath}`)
  }

  const source = await readFile(filePath, 'utf8')
  await transform(source, {
    loader: loaderFor(filePath),
    jsx: 'automatic',
  })

  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1] || match[2]
    const resolved = resolveLocalImport(filePath, specifier)
    if (resolved) await checkFile(resolved)
  }
}

await checkFile(entry)
console.log(`Load check passed: ${visited.size} local files resolved and parsed.`)
