
import { before, after, test } from 'node:test'
import assert from 'node:assert/strict'

let app: typeof import('../src/app.js').default

before(async () => {
  process.env.DATABASE_URL ??=
    'postgresql://debugdesk:local_dev_password@localhost:5432/debugdesk'

  const module = await import('../src/app.js')
  app = module.default
})

after(async () => {
  const { pool } = await import('../src/db/index.js')
  await pool.end()
})

test('CORS preflight allows the frontend origin', async () => {
  const response = await app.request('/api/incidents', {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:5173',
      'Access-Control-Request-Method': 'GET',
    },
  })

  assert.equal(response.status, 204)
  assert.equal(
    response.headers.get('access-control-allow-origin'),
    'http://localhost:5173',
  )
})
