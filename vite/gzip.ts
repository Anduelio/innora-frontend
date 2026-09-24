import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import type { Plugin } from 'vite'

const COMPRESSIBLE = /\.(js|mjs|css|html|svg|json|txt|xml|wasm)$/

function contentType(url: string): string {
  if (url.endsWith('.css')) return 'text/css; charset=utf-8'
  if (url.endsWith('.svg')) return 'image/svg+xml'
  if (url.endsWith('.json')) return 'application/json; charset=utf-8'
  return 'text/javascript; charset=utf-8'
}

export function gzipAndCache(): Plugin {
  return {
    name: 'gzip-and-cache',
    generateBundle(_options, bundle) {
      for (const [fileName, file] of Object.entries(bundle)) {
        if (!COMPRESSIBLE.test(fileName) || fileName.endsWith('.gz')) continue
        const source = file.type === 'chunk' ? file.code : file.source
        const buffer = Buffer.isBuffer(source) ? source : Buffer.from(typeof source === 'string' ? source : new Uint8Array(source))
        if (buffer.length < 1024) continue
        this.emitFile({
          type: 'asset',
          fileName: `${fileName}.gz`,
          source: gzipSync(buffer, { level: 9 }),
        })
      }
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '').split('?')[0] ?? ''
        if (url === '/' || url.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache')
          next()
          return
        }
        if (!url.startsWith('/assets/')) {
          next()
          return
        }
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
        const accept = req.headers['accept-encoding']
        const gzPath = join(server.config.root, server.config.build.outDir, `${url.slice(1)}.gz`)
        if (typeof accept === 'string' && accept.includes('gzip') && existsSync(gzPath)) {
          res.setHeader('Content-Encoding', 'gzip')
          res.setHeader('Content-Type', contentType(url))
          res.setHeader('Vary', 'Accept-Encoding')
          res.end(readFileSync(gzPath))
          return
        }
        next()
      })
    },
  }
}
