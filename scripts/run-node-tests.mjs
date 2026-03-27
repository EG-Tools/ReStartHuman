import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const testsRoot = '.test-dist/tests'

const collectTestFiles = (directory) => {
  const entries = readdirSync(directory, { withFileTypes: true })

  return entries.flatMap((entry) => {
    const resolvedPath = join(directory, entry.name)

    if (entry.isDirectory()) {
      return collectTestFiles(resolvedPath)
    }

    return entry.name.endsWith('.test.js') ? [resolvedPath] : []
  })
}

if (!statSync(testsRoot, { throwIfNoEntry: false })) {
  console.error('자동 테스트 파일을 찾지 못했습니다.')
  process.exit(1)
}

const testFiles = collectTestFiles(testsRoot)

if (testFiles.length === 0) {
  console.error('실행할 자동 테스트 파일이 없습니다.')
  process.exit(1)
}

const result = spawnSync(
  process.execPath,
  ['--test', '--experimental-specifier-resolution=node', ...testFiles],
  { stdio: 'inherit' },
)

process.exit(result.status ?? 1)
