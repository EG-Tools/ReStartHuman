import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const distRoot = '.test-dist'
const runtimeExtensions = new Set([
  '.js',
  '.mjs',
  '.cjs',
  '.json',
  '.node',
  '.css',
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
])

const collectJsFiles = (directory) => {
  const entries = readdirSync(directory, { withFileTypes: true })

  return entries.flatMap((entry) => {
    const resolvedPath = join(directory, entry.name)

    if (entry.isDirectory()) {
      return collectJsFiles(resolvedPath)
    }

    return entry.name.endsWith('.js') ? [resolvedPath] : []
  })
}

const hasRuntimeExtension = (specifier) => {
  const slashIndex = specifier.lastIndexOf('/')
  const dotIndex = specifier.lastIndexOf('.')

  if (dotIndex <= slashIndex) {
    return false
  }

  return runtimeExtensions.has(specifier.slice(dotIndex))
}

if (!statSync(distRoot, { throwIfNoEntry: false })) {
  console.error('컴파일된 테스트 산출물이 없습니다.')
  process.exit(1)
}

const relativeImportPattern = /((?:import|export)\s[^'"\n]*?from\s*|import\s*\()(["'])(\.[^"']+)(\2)/g

for (const filePath of collectJsFiles(distRoot)) {
  const source = readFileSync(filePath, 'utf8')
  const rewritten = source.replace(relativeImportPattern, (full, prefix, quote, specifier, suffix) => {
    if (hasRuntimeExtension(specifier)) {
      return full
    }

    return `${prefix}${quote}${specifier}.js${suffix}`
  })

  if (rewritten !== source) {
    writeFileSync(filePath, rewritten)
  }
}
