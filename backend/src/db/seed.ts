import 'dotenv/config'
import { db, pool } from './index.js'
import { incidents } from './schema.js'

const sampleIncidents = [
  {
    id: 'INC-1042',
    title: 'Login API returns 401',
    category: 'Authentication',
    severity: 'Critical',
    status: 'Investigating',
    endpoint: 'POST /api/auth/login',
    error: '401 Unauthorized — access token is missing or invalid.',
    diagnosis:
      'Check token generation, expiration, and the Authorization header. Confirm that the login service validates credentials correctly.',
  },
  {
    id: 'INC-1043',
    title: 'Dashboard requests blocked',
    category: 'CORS',
    severity: 'High',
    status: 'Open',
    endpoint: 'GET /api/dashboard',
    error: 'Blocked by CORS policy: missing Access-Control-Allow-Origin.',
    diagnosis:
      'Check the API CORS middleware and ensure the frontend origin is explicitly allowed.',
  },
  {
    id: 'INC-1044',
    title: 'Customer list loads slowly',
    category: 'Performance',
    severity: 'Medium',
    status: 'Open',
    endpoint: 'GET /api/customers',
    error: 'Request duration exceeded 2500 ms.',
    diagnosis:
      'Inspect database query duration, missing indexes, and external API latency. Compare response times before and after optimization.',
  },
]

try {
  await db
    .insert(incidents)
    .values(sampleIncidents)
    .onConflictDoNothing()

  console.log('DebugDesk sample incidents seeded successfully')
} catch (error) {
  console.error('Failed to seed incidents:', error)
  process.exitCode = 1
} finally {
  await pool.end()
}
