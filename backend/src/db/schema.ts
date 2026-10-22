
import {
  pgTable,
  varchar,
  text,
  timestamp,
  serial,
} from 'drizzle-orm/pg-core'

export const incidents = pgTable('incidents', {
  id: varchar('id', { length: 20 }).primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  severity: varchar('severity', { length: 20 }).notNull(),
  status: varchar('status', { length: 30 }).notNull(),
  endpoint: varchar('endpoint', { length: 200 }).notNull(),
  error: text('error').notNull(),
  diagnosis: text('diagnosis'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const incidentActivity = pgTable('incident_activity', {
  id: serial('id').primaryKey(),
  incidentId: varchar('incident_id', { length: 20 })
    .notNull()
    .references(() => incidents.id, { onDelete: 'cascade' }),
  action: varchar('action', { length: 50 }).notNull(),
  previousStatus: varchar('previous_status', { length: 30 }),
  newStatus: varchar('new_status', { length: 30 }),
  description: text('description').notNull(),
  actor: varchar('actor', { length: 100 }).notNull().default('Demo operator'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const incidentNotes = pgTable('incident_notes', {
  id: serial('id').primaryKey(),
  incidentId: varchar('incident_id', { length: 20 })
    .notNull()
    .references(() => incidents.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  author: varchar('author', { length: 100 })
    .notNull()
    .default('Demo operator'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
