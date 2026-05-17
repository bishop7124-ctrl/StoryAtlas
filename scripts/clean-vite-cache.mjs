import { readdir, rm } from 'node:fs/promises'
import { join } from 'node:path'

const viteCacheDirs = [
  join(process.cwd(), 'node_modules', '.vite'),
  join(process.cwd(), 'node_modules', '.vite-yow'),
]

for (const viteCacheDir of viteCacheDirs) {
  try {
    const entries = await readdir(viteCacheDir, { withFileTypes: true })
    await Promise.all(
      entries
        .filter(entry => entry.isDirectory() && entry.name.startsWith('deps_temp_'))
        .map(entry => rm(join(viteCacheDir, entry.name), { recursive: true, force: true }))
    )
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }
}
