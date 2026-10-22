
import { useEffect, useState } from 'react'
import './App.css'

type Ticket = {
  id: string
  title: string
  category: string
  severity: 'Critical' | 'High' | 'Medium'
  status: 'Open' | 'Investigating' | 'Resolved'
  endpoint: string
  error: string
  diagnosis: string | null
  createdAt: string
  updatedAt: string
}

type ActivityEntry = {
  id: number
  incidentId: string
  action: string
  previousStatus: string | null
  newStatus: string | null
  description: string
  actor: string
  createdAt: string
}

type IncidentNote = {
  id: number
  incidentId: string
  content: string
  author: string
  createdAt: string
  updatedAt: string
}

type IncidentResponse = {
  message?: string
  incident?: Ticket
  error?: string
}

const API_URL = 'http://localhost:3000'

const STATUSES: Ticket['status'][] = [
  'Open',
  'Investigating',
  'Resolved',
]

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function App() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedId, setSelectedId] = useState('INC-1042')
  const [search, setSearch] = useState('')
  const [showDiagnosis, setShowDiagnosis] = useState(false)
  const [loading, setLoading] = useState(true)
  const [savingStatus, setSavingStatus] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [apiError, setApiError] = useState('')
  const [actionMessage, setActionMessage] = useState('')

  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [activityError, setActivityError] = useState('')

  const [notes, setNotes] = useState<IncidentNote[]>([])
  const [notesLoading, setNotesLoading] = useState(false)
  const [notesError, setNotesError] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  useEffect(() => {
    async function loadTickets() {
      try {
        const response = await fetch(`${API_URL}/api/incidents`)

        if (!response.ok) {
          throw new Error(`API returned HTTP ${response.status}`)
        }

        const data: Ticket[] = await response.json()
        setTickets(data)
        setApiError('')

        if (data.length > 0) {
          setSelectedId((current) =>
            data.some((ticket) => ticket.id === current)
              ? current
              : data[0].id,
          )
        }
      } catch (error) {
        setApiError(
          error instanceof Error
            ? error.message
            : 'Unable to connect to the DebugDesk API.',
        )
      } finally {
        setLoading(false)
      }
    }

    void loadTickets()
  }, [])

  useEffect(() => {
    if (!selectedId) {
      return
    }

    const controller = new AbortController()

    async function loadActivity() {
      setActivityLoading(true)
      setActivityError('')

      try {
        const response = await fetch(
          `${API_URL}/api/incidents/${encodeURIComponent(selectedId)}/activity`,
          { signal: controller.signal },
        )

        if (!response.ok) {
          throw new Error(`Activity API returned HTTP ${response.status}`)
        }

        const data: ActivityEntry[] = await response.json()
        setActivity(data)
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return

        setActivityError(
          error instanceof Error
            ? error.message
            : 'Unable to load incident activity.',
        )
      } finally {
        if (!controller.signal.aborted) setActivityLoading(false)
      }
    }

    void loadActivity()
    return () => controller.abort()
  }, [selectedId])

  useEffect(() => {
    if (!selectedId) {
      return
    }

    const controller = new AbortController()

    async function loadNotes() {
      setNotesLoading(true)
      setNotesError('')

      try {
        const response = await fetch(
          `${API_URL}/api/incidents/${encodeURIComponent(selectedId)}/notes`,
          { signal: controller.signal },
        )

        if (!response.ok) {
          throw new Error(`Notes API returned HTTP ${response.status}`)
        }

        const data: IncidentNote[] = await response.json()
        setNotes(data)
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return

        setNotesError(
          error instanceof Error
            ? error.message
            : 'Unable to load investigation notes.',
        )
      } finally {
        if (!controller.signal.aborted) setNotesLoading(false)
      }
    }

    void loadNotes()
    return () => controller.abort()
  }, [selectedId])

  const filteredTickets = tickets.filter((ticket) =>
    `${ticket.id} ${ticket.title} ${ticket.category}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  )

  const selected = tickets.find((ticket) => ticket.id === selectedId)

  async function refreshActivity(id: string) {
    try {
      const response = await fetch(
        `${API_URL}/api/incidents/${encodeURIComponent(id)}/activity`,
      )

      if (!response.ok) {
        throw new Error(`Activity API returned HTTP ${response.status}`)
      }

      const data: ActivityEntry[] = await response.json()

      if (id === selectedId) {
        setActivity(data)
        setActivityError('')
      }
    } catch (error) {
      setActivityError(
        error instanceof Error
          ? error.message
          : 'Unable to refresh incident activity.',
      )
    }
  }

  async function updateTicketStatus(
    id: string,
    status: Ticket['status'],
  ) {
    setSavingStatus(true)
    setApiError('')
    setActionMessage('')

    try {
      const response = await fetch(
        `${API_URL}/api/incidents/${encodeURIComponent(id)}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        },
      )

      const data: IncidentResponse = await response.json()

      if (!response.ok || !data.incident) {
        throw new Error(
          data.message || data.error || 'Unable to update incident status.',
        )
      }

      setTickets((current) =>
        current.map((ticket) =>
          ticket.id === id ? data.incident! : ticket,
        ),
      )

      setActionMessage(
        data.message || `${id} status changed to ${status} and saved.`,
      )

      await refreshActivity(id)
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : 'Unable to update incident status.',
      )
    } finally {
      setSavingStatus(false)
    }
  }

  async function resolveTicket(id: string) {
    setResolving(true)
    setApiError('')
    setActionMessage('')

    try {
      const response = await fetch(
        `${API_URL}/api/incidents/${encodeURIComponent(id)}/resolve`,
        { method: 'PATCH' },
      )

      const data: IncidentResponse = await response.json()

      if (!response.ok || !data.incident) {
        throw new Error(
          data.message || data.error || 'Unable to resolve incident.',
        )
      }

      setTickets((current) =>
        current.map((ticket) =>
          ticket.id === id ? data.incident! : ticket,
        ),
      )

      setActionMessage(
        data.message || `${id} was resolved and saved to PostgreSQL.`,
      )

      await refreshActivity(id)
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : 'Unable to resolve incident.',
      )
    } finally {
      setResolving(false)
    }
  }

  async function submitNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedId || !noteContent.trim() || savingNote) return

    setSavingNote(true)
    setNotesError('')
    setApiError('')
    setActionMessage('')

    try {
      const response = await fetch(
        `${API_URL}/api/incidents/${encodeURIComponent(selectedId)}/notes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: noteContent.trim() }),
        },
      )

      const data: IncidentNote | { message?: string } =
        await response.json()

      if (!response.ok || !('id' in data)) {
        throw new Error(
          'message' in data
            ? data.message || 'Unable to save investigation note.'
            : 'Unable to save investigation note.',
        )
      }

      const incidentId = selectedId

      setNotes((current) =>
        incidentId === selectedId
          ? [data, ...current]
          : current,
      )
      setNoteContent('')
      setActionMessage('Investigation note saved to PostgreSQL.')

      await refreshActivity(incidentId)
    } catch (error) {
      setNotesError(
        error instanceof Error
          ? error.message
          : 'Unable to save investigation note.',
      )
    } finally {
      setSavingNote(false)
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">D</div>
          <div>
            <strong>DebugDesk</strong>
            <span>SUPPORT ENGINEERING LAB</span>
          </div>
        </div>

        <p className="nav-label">WORKSPACE</p>
        <button className="nav-item active">▦ &nbsp; Overview</button>
        <button className="nav-item">◷ &nbsp; Incidents</button>
        <button className="nav-item">⌘ &nbsp; API explorer</button>
        <button className="nav-item">▤ &nbsp; Logs</button>

        <div className="sidebar-bottom">
          <div className="online-dot" />
          <div>
            <strong>Demo environment</strong>
            <span>PostgreSQL connected</span>
          </div>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <span>Workspace / Overview</span>
          <div className="profile">
            <span className="online-dot" />
            Demo operator
            <div className="avatar">A</div>
          </div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">CUSTOMER SUPPORT OPERATIONS</p>
              <h1>Debugging overview</h1>
              <p className="subheading">
                Investigate customer issues, inspect errors, and track resolutions.
              </p>
            </div>
            <span className="environment-badge">● LOCAL ENVIRONMENT</span>
          </div>

          {apiError && (
            <div className="diagnosis-box" role="alert">
              <strong>Something went wrong</strong>
              <p>{apiError}</p>
            </div>
          )}

          {actionMessage && (
            <div className="diagnosis-box" role="status">
              <strong>Action completed</strong>
              <p>{actionMessage}</p>
            </div>
          )}

          {loading ? (
            <section className="panel">
              <p>Loading incidents from PostgreSQL...</p>
            </section>
          ) : (
            <>
              <div className="stats-grid">
                <article className="stat-card">
                  <span>Total incidents</span>
                  <strong>{tickets.length}</strong>
                  <small>Records from PostgreSQL</small>
                </article>

                <article className="stat-card">
                  <span>Open incidents</span>
                  <strong>
                    {tickets.filter((t) => t.status !== 'Resolved').length}
                  </strong>
                  <small>Require investigation</small>
                </article>

                <article className="stat-card">
                  <span>Critical severity</span>
                  <strong>
                    {
                      tickets.filter(
                        (t) =>
                          t.severity === 'Critical' &&
                          t.status !== 'Resolved',
                      ).length
                    }
                  </strong>
                  <small>High-priority attention</small>
                </article>

                <article className="stat-card">
                  <span>Resolved</span>
                  <strong>
                    {tickets.filter((t) => t.status === 'Resolved').length}
                  </strong>
                  <small>Saved resolution records</small>
                </article>
              </div>

              <section className="panel incidents-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Recent incidents</h2>
                    <p>Choose an incident to inspect its error and diagnosis.</p>
                  </div>

                  <input
                    className="search-input"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search incidents..."
                    aria-label="Search incidents"
                  />
                </div>

                <div className="ticket-list">
                  {filteredTickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      className={`ticket-row ${selectedId === ticket.id ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedId(ticket.id)
                        setShowDiagnosis(false)
                        setActionMessage('')
                        setNotesError('')
                        setNoteContent('')
                      }}
                    >
                      <span className="ticket-marker">!</span>

                      <span className="ticket-info">
                        <strong>{ticket.title}</strong>
                        <small>
                          {ticket.id} · {ticket.category}
                        </small>
                      </span>

                      <span className={`severity ${ticket.severity.toLowerCase()}`}>
                        {ticket.severity}
                      </span>

                      <span className={`status ${ticket.status.toLowerCase()}`}>
                        {ticket.status}
                      </span>
                    </button>
                  ))}

                  {filteredTickets.length === 0 && (
                    <p className="empty-state">No incidents match your search.</p>
                  )}
                </div>
              </section>

              {selected && (
                <section className="panel detail-panel">
                  <div className="panel-heading">
                    <div>
                      <p className="eyebrow">INCIDENT DETAIL · {selected.id}</p>
                      <h2>{selected.title}</h2>
                      <p>{selected.endpoint}</p>
                    </div>

                    <span className={`status ${selected.status.toLowerCase()}`}>
                      {selected.status}
                    </span>
                  </div>

                  <h3>Observed error</h3>
                  <pre className="error-box">{selected.error}</pre>

                  <div className="status-editor">
                    <label htmlFor="incident-status">Update incident status</label>
                    <select
                      id="incident-status"
                      value={selected.status}
                      disabled={savingStatus || resolving}
                      onChange={(event) =>
                        void updateTicketStatus(
                          selected.id,
                          event.target.value as Ticket['status'],
                        )
                      }
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>

                    {savingStatus && (
                      <small>Saving status to PostgreSQL...</small>
                    )}
                  </div>

                  {showDiagnosis && (
                    <div className="diagnosis-box">
                      <strong>Suggested investigation</strong>
                      <p>
                        {selected.diagnosis ||
                          'No diagnosis has been recorded yet.'}
                      </p>
                      <small>
                        Demo diagnostic guidance. Verify findings before applying fixes.
                      </small>
                    </div>
                  )}

                  <div className="detail-actions">
                    <button
                      className="secondary-button"
                      onClick={() => setShowDiagnosis((current) => !current)}
                    >
                      {showDiagnosis ? 'Hide diagnosis' : 'Show diagnosis'}
                    </button>

                    <button
                      className="primary-button"
                      disabled={
                        selected.status === 'Resolved' ||
                        resolving ||
                        savingStatus
                      }
                      onClick={() => void resolveTicket(selected.id)}
                    >
                      {resolving
                        ? 'Saving...'
                        : selected.status === 'Resolved'
                          ? 'Resolved'
                          : 'Mark as resolved'}
                    </button>
                  </div>

                  <section
                    className="notes-section"
                    aria-labelledby="notes-heading"
                    style={{ marginTop: '30px' }}
                  >
                    <div className="panel-heading">
                      <div>
                        <h2 id="notes-heading">Investigation notes</h2>
                        <p>
                          Record findings, troubleshooting steps, and next actions.
                        </p>
                      </div>
                      <span className="environment-badge">
                        {notes.length} {notes.length === 1 ? 'NOTE' : 'NOTES'}
                      </span>
                    </div>

                    <form onSubmit={submitNote} className="note-form">
                      <label htmlFor="investigation-note">
                        New investigation note
                      </label>
                      <textarea
                        id="investigation-note"
                        value={noteContent}
                        onChange={(event) => setNoteContent(event.target.value)}
                        placeholder="Describe what you checked, what you found, or what you plan to investigate next..."
                        rows={4}
                        maxLength={5000}
                        required
                        disabled={savingNote}
                      />
                      <div className="note-form-footer">
                        <small>{noteContent.length}/5000 characters</small>
                        <button
                          className="primary-button"
                          type="submit"
                          disabled={!noteContent.trim() || savingNote}
                        >
                          {savingNote ? 'Saving note...' : 'Add investigation note'}
                        </button>
                      </div>
                    </form>

                    {notesError && (
                      <div className="diagnosis-box" role="alert">
                        <strong>Investigation note error</strong>
                        <p>{notesError}</p>
                      </div>
                    )}

                    {notesLoading ? (
                      <p>Loading saved investigation notes...</p>
                    ) : notes.length === 0 ? (
                      <p className="empty-state">
                        No investigation notes yet. Add your first note above.
                      </p>
                    ) : (
                      <div className="notes-list">
                        {notes.map((note) => (
                          <article className="note-card" key={note.id}>
                            <p className="note-content">{note.content}</p>
                            <div className="note-meta">
                              <span className="avatar note-avatar">
                                {note.author.charAt(0).toUpperCase()}
                              </span>
                              <span>
                                <strong>{note.author}</strong>
                                <small>{formatDate(note.createdAt)}</small>
                              </span>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>

                  <section
                    className="activity-section"
                    aria-labelledby="activity-heading"
                    style={{ marginTop: '30px' }}
                  >
                    <div className="panel-heading">
                      <div>
                        <h2 id="activity-heading">Incident activity</h2>
                        <p>
                          Status changes and investigation events for {selected.id}.
                        </p>
                      </div>
                      <span className="environment-badge">
                        {activity.length} {activity.length === 1 ? 'EVENT' : 'EVENTS'}
                      </span>
                    </div>

                    {activityLoading ? (
                      <p>Loading activity history...</p>
                    ) : activityError ? (
                      <div className="diagnosis-box" role="alert">
                        <strong>Could not load activity</strong>
                        <p>{activityError}</p>
                      </div>
                    ) : activity.length === 0 ? (
                      <p className="empty-state">
                        No activity recorded for this incident yet.
                      </p>
                    ) : (
                      <ol className="activity-list">
                        {activity.map((entry) => (
                          <li className="activity-item" key={entry.id}>
                            <span className="activity-marker" aria-hidden="true">
                              {entry.newStatus === 'Resolved'
                                ? '✓'
                                : entry.action === 'status_changed'
                                  ? '↻'
                                  : '•'}
                            </span>

                            <div className="activity-content">
                              <strong>
                                {entry.action === 'note_added'
                                  ? 'Investigation note added'
                                  : entry.newStatus
                                    ? `Status changed to ${entry.newStatus}`
                                    : entry.action.replaceAll('_', ' ')}
                              </strong>

                              <p>{entry.description}</p>

                              {entry.previousStatus && entry.newStatus && (
                                <div className="activity-status-change">
                                  <span
                                    className={`status ${entry.previousStatus.toLowerCase()}`}
                                  >
                                    {entry.previousStatus}
                                  </span>
                                  <span aria-hidden="true">→</span>
                                  <span
                                    className={`status ${entry.newStatus.toLowerCase()}`}
                                  >
                                    {entry.newStatus}
                                  </span>
                                </div>
                              )}

                              <small>
                                {formatDate(entry.createdAt)} · {entry.actor}
                              </small>
                            </div>
                          </li>
                        ))}
                      </ol>
                    )}
                  </section>
                </section>
              )}
            </>
          )}

          <footer>
            DebugDesk · Portfolio demo · Sample data only · No real customer information
          </footer>
        </div>
      </section>
    </main>
  )
}

export default App
