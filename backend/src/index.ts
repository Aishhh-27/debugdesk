
import 'dotenv/config'
import { serve } from '@hono/node-server'
import app from './app.js'
import { pool } from './db/index.js'

const port = Number(process.env.PORT) || 3000

const server = serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`DebugDesk API running at http://localhost:${info.port}`)
  },
)

const shutdown = () => {
  server.close()
  void pool.end()
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
