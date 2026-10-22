
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { desc, eq } from 'drizzle-orm'
import { db, pool } from './db/index.js'
import {
  incidents,
  incidentActivity,
  incidentNotes,
} from './db/schema.js'

const app = new Hono()

app.use(
  '*',
  cors({
    origin: 'http://localhost:5173',
    allowMethods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
)

app.get('/health', async (c) => {
  try {
    await pool.query('SELECT 1')
    return c.json({ status: 'ok', database: 'connected' })
  } catch {
    return c.json(
      { status: 'error', database: 'disconnected' },
      503,
    )
  }
})

app.get('/api/incidents', async (c) => {
  const results = await db
    .select()
    .from(incidents)
    .orderBy(desc(incidents.createdAt))

  return c.json(results)
})

app.get('/api/incidents/:id', async (c) => {
  const id = c.req.param('id')

  const [incident] = await db
    .select()
    .from(incidents)
    .where(eq(incidents.id, id))
    .limit(1)

  if (!incident) {
    return c.json({ message: 'Incident not found' }, 404)
  }

  return c.json(incident)
})

app.get('/api/incidents/:id/activity', async (c) => {
  const incidentId = c.req.param('id')

  const [incident] = await db
    .select({ id: incidents.id })
    .from(incidents)
    .where(eq(incidents.id, incidentId))
    .limit(1)

  if (!incident) {
    return c.json({ message: 'Incident not found' }, 404)
  }

  const activity = await db
    .select()
    .from(incidentActivity)
    .where(eq(incidentActivity.incidentId, incidentId))
    .orderBy(desc(incidentActivity.createdAt))

  return c.json(activity)
})

// Retrieve persistent investigation notes for an incident.
app.get('/api/incidents/:id/notes', async (c) => {
  const incidentId = c.req.param('id')

  const [incident] = await db
    .select({ id: incidents.id })
    .from(incidents)
    .where(eq(incidents.id, incidentId))
    .limit(1)

  if (!incident) {
    return c.json({ message: 'Incident not found' }, 404)
  }

  const notes = await db
    .select()
    .from(incidentNotes)
    .where(eq(incidentNotes.incidentId, incidentId))
    .orderBy(desc(incidentNotes.createdAt))

  return c.json(notes)
})

// Save a note and record the action in the incident activity timeline.
app.post('/api/incidents/:id/notes', async (c) => {
  const incidentId = c.req.param('id')

  const [incident] = await db
    .select({ id: incidents.id })
    .from(incidents)
    .where(eq(incidents.id, incidentId))
    .limit(1)

  if (!incident) {
    return c.json({ message: 'Incident not found' }, 404)
  }

  let body: { content?: unknown }

  try {
    body = await c.req.json<{ content?: unknown }>()
  } catch {
    return c.json({ message: 'Request body must be valid JSON' }, 400)
  }

  if (typeof body.content !== 'string') {
    return c.json({ message: 'Note content must be a string' }, 400)
  }

  const content = body.content.trim()

  if (!content) {
    return c.json({ message: 'Note content cannot be empty' }, 400)
  }

  if (content.length > 5000) {
    return c.json(
      { message: 'Note content must be 5000 characters or fewer' },
      400,
    )
  }

  const note = await db.transaction(async (tx) => {
    const [createdNote] = await tx
      .insert(incidentNotes)
      .values({
        incidentId,
        content,
      })
      .returning()

    await tx.insert(incidentActivity).values({
      incidentId,
      action: 'note_added',
      description: 'Investigation note added',
      actor: 'Demo operator',
    })

    return createdNote
  })

  return c.json(note, 201)
})

app.patch('/api/incidents/:id/status', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{ status?: string }>()

  const allowedStatuses = ['Open', 'Investigating', 'Resolved']

  if (!body.status || !allowedStatuses.includes(body.status)) {
    return c.json(
      {
        message: 'Invalid status',
        allowedStatuses,
      },
      400,
    )
  }

  const result = await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(incidents)
      .where(eq(incidents.id, id))
      .limit(1)

    if (!current) {
      return { kind: 'not_found' as const }
    }

    if (current.status === body.status) {
      return {
        kind: 'unchanged' as const,
        incident: current,
      }
    }

    const [updated] = await tx
      .update(incidents)
      .set({
        status: body.status!,
        updatedAt: new Date(),
      })
      .where(eq(incidents.id, id))
      .returning()

    await tx.insert(incidentActivity).values({
      incidentId: id,
      action: 'status_changed',
      previousStatus: current.status,
      newStatus: body.status!,
      description: `Status changed from ${current.status} to ${body.status}`,
      actor: 'Demo operator',
    })

    return {
      kind: 'updated' as const,
      incident: updated,
    }
  })

  if (result.kind === 'not_found') {
    return c.json({ message: 'Incident not found' }, 404)
  }

  if (result.kind === 'unchanged') {
    return c.json({
      message: 'Incident already has this status',
      incident: result.incident,
    })
  }

  return c.json({
    message: 'Incident status updated and activity recorded',
    incident: result.incident,
  })
})

app.patch('/api/incidents/:id/resolve', async (c) => {
  const id = c.req.param('id')

  const result = await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(incidents)
      .where(eq(incidents.id, id))
      .limit(1)

    if (!current) {
      return { kind: 'not_found' as const }
    }

    if (current.status === 'Resolved') {
      return {
        kind: 'unchanged' as const,
        incident: current,
      }
    }

    const [updated] = await tx
      .update(incidents)
      .set({
        status: 'Resolved',
        updatedAt: new Date(),
      })
      .where(eq(incidents.id, id))
      .returning()

    await tx.insert(incidentActivity).values({
      incidentId: id,
      action: 'status_changed',
      previousStatus: current.status,
      newStatus: 'Resolved',
      description: `Incident resolved from ${current.status}`,
      actor: 'Demo operator',
    })

    return {
      kind: 'updated' as const,
      incident: updated,
    }
  })

  if (result.kind === 'not_found') {
    return c.json({ message: 'Incident not found' }, 404)
  }

  if (result.kind === 'unchanged') {
    return c.json({
      message: 'Incident is already resolved',
      incident: result.incident,
    })
  }

  return c.json({
    message: 'Incident resolved and activity recorded',
    incident: result.incident,
  })
})

export default app
