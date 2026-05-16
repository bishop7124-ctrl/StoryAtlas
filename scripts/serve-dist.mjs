import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, relative } from 'node:path'

const host = process.env.HOST || '127.0.0.1'
const preferredPort = Number(process.env.PORT || 5173)
const root = join(process.cwd(), 'dist')
const indexFile = join(root, 'index.html')

const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
}

const isInsideRoot = (filePath) => {
  const rel = relative(root, filePath)
  return rel && !rel.startsWith('..') && !rel.includes('..\\')
}

const resolveFile = (url) => {
  const pathname = decodeURIComponent(new URL(url, `http://${host}:${preferredPort}`).pathname)
  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, '')
  const filePath = join(root, safePath === '/' ? 'index.html' : safePath)
  if (isInsideRoot(filePath) && existsSync(filePath) && statSync(filePath).isFile()) return filePath
  return join(root, 'index.html')
}

function createStoryAtlasServer() {
  return createServer((req, res) => {
    if (!existsSync(indexFile)) {
      res.statusCode = 500
      res.end('StoryAtlas has not been built yet. Run npm run build first.')
      return
    }

    const filePath = resolveFile(req.url || '/')
    res.setHeader('Content-Type', types[extname(filePath)] || 'application/octet-stream')

    if (req.method === 'HEAD') {
      res.end()
      return
    }

    createReadStream(filePath)
      .on('error', () => {
        res.statusCode = 500
        res.end('Unable to load StoryAtlas.')
      })
      .pipe(res)
  })
}

function listen(port, attemptsLeft = 10) {
  const server = createStoryAtlasServer()

  server.once('error', error => {
    if (error.code === 'EADDRINUSE' && attemptsLeft > 0) {
      console.warn(`Port ${port} is busy; trying ${port + 1}...`)
      server.close()
      listen(port + 1, attemptsLeft - 1)
      return
    }

    console.error(error.code === 'EADDRINUSE'
      ? `Unable to launch StoryAtlas: ports ${preferredPort}-${port} are busy.`
      : `Unable to launch StoryAtlas: ${error.message}`)
    process.exitCode = 1
  })

  server.listen(port, host, () => {
    console.log(`StoryAtlas ready at http://${host}:${port}/`)
  })
}

listen(preferredPort)
