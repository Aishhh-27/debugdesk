
import { before, after, test } from 'node:test'
import assert from 'node:assert/strict'

let app: typeof import('../src/app.js').default
let pool: typeof import('../src/db/index.js').pool

before(async () => {
  process.env.DATABASE_URL ??=
    'postgresql://debugdesk:local_dev_password@localhost:5432/debugdesk'

  const module = await import('../src/app.js')
  const database = await import('../src/db/index.js')

  app = module.default
  pool = database.pool
})

after(async () => {
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

test('GET /api/incidents returns an array of incidents', async () => {
  const response = await app.request('/api/incidents')

  assert.equal(response.status, 200)

  const incidents = await response.json()

  assert.ok(Array.isArray(incidents))
  assert.ok(incidents.length > 0)
})

test('GET /api/incidents/:id returns an existing incident', async () => {
  const response = await app.request('/api/incidents/INC-1043')

  assert.equal(response.status, 200)

  const incident = await response.json()

  assert.equal(incident.id, 'INC-1043')
})

test('GET /api/incidents/:id returns 404 for a missing incident', async () => {
  const response = await app.request('/api/incidents/INC-9999')

  assert.equal(response.status, 404)
})

test('PATCH /api/incidents/:id/status rejects an invalid status', async () => {
  const response = await app.request('/api/incidents/INC-1043/status', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'InvalidStatus',
    }),
  })

  assert.equal(response.status, 400)
})
