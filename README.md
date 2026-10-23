
# DebugDesk — Incident Investigation Dashboard

DebugDesk is a full-stack incident investigation dashboard built to demonstrate practical troubleshooting, API development, incident tracking, and operational workflows.

It simulates a support engineering environment where engineers can investigate application issues, document findings, update incident status, and maintain an auditable history of investigation activity.

## Key Features

- **Incident management:** Browse incidents and inspect their severity, status, endpoint, error details, and diagnosis.
- **Investigation workflow:** Track incidents through Open, Investigating, and Resolved states.
- **Persistent investigation notes:** Record troubleshooting findings with timestamps and author information.
- **Activity timeline:** Maintain a history of incident actions and status changes.
- **REST API:** Expose incident, activity, note, and status operations through a Hono API.
- **Relational data storage:** Use PostgreSQL and Drizzle ORM for structured, persistent data.
- **Automated testing:** Test API behavior, including incident retrieval, missing incidents, validation, and CORS preflight handling.
- **Continuous integration:** Run frontend linting and builds alongside backend migrations, tests, type checks, and builds through GitHub Actions.
- **Containerized database:** Run PostgreSQL locally with Docker Compose and a persistent data volume.

## Technology Stack

| Area | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite, CSS |
| Backend | Node.js, TypeScript, Hono |
| Database | PostgreSQL 17, Drizzle ORM |
| Database migrations | Drizzle Kit |
| Testing | Node.js test runner, TypeScript |
| Development and infrastructure | Docker, Docker Compose, Git |
| CI/CD | GitHub Actions |

## Architecture

```text
Browser
   |
   v
React + TypeScript + Vite
   |
   | HTTP / REST API
   v
Hono API (Node.js + TypeScript)
   |
   v
Drizzle ORM
   |
   v
PostgreSQL
   |
   +-- Incidents
   +-- Investigation notes
   +-- Activity history

GitHub Actions
   |
   +-- Frontend lint and build
   +-- PostgreSQL-backed backend tests
   +-- Database migrations
   +-- Backend type checking and build
```

## Project Structure

```text
customer-app-debug-lab/
├── .github/
│   └── workflows/
│       └── ci.yml
├── backend/
│   ├── drizzle/
│   │   └── *.sql
│   ├── src/
│   │   ├── db/
│   │   │   ├── index.ts
│   │   │   ├── schema.ts
│   │   │   └── seed.ts
│   │   ├── app.ts
│   │   └── index.ts
│   ├── test/
│   │   └── app.test.ts
│   ├── .env.example
│   ├── drizzle.config.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Prerequisites

Install the following:

- Node.js and npm
- Docker Engine with Docker Compose
- Git

## Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/Aishhh-27/debugdesk.git
cd debugdesk
```

If you already have the repository locally, navigate to your existing project directory instead.

### 2. Start PostgreSQL

From the project root:

```bash
docker compose up -d
docker compose ps
```

Docker Compose starts PostgreSQL 17 and stores its data in a persistent named volume.

### 3. Configure the backend

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and configure the local development settings:

```env
PORT=3000
DATABASE_URL=postgresql://debugdesk:local_dev_password@localhost:5432/debugdesk
```

The example file uses a placeholder password. The database URL above matches the local credentials configured in `docker-compose.yml`.

These credentials are for local development only. Do not use them in a production deployment.

### 4. Install dependencies and migrate the database

From the `backend` directory:

```bash
npm ci
npm run db:migrate
```

To load the sample incidents, run:

```bash
npx tsx src/db/seed.ts
```

The seed script inserts sample records without overwriting records that already exist.

### 5. Start the backend

```bash
npm run dev
```

The backend runs at:

- API base URL: `http://localhost:3000`
- Health endpoint: `http://localhost:3000/health`

Keep this terminal running.

### 6. Start the frontend

Open a second terminal:

```bash
cd ~/projects/customer-app-debug-lab/frontend
npm ci
npm run dev
```

Open `http://localhost:5173` in your browser.

Keep the frontend terminal running.

## Development Commands

### Backend

Run these commands from `backend/`.

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server with automatic restarts |
| `npm run test` | Run backend API tests |
| `npm run typecheck` | Check TypeScript types |
| `npm run build` | Compile the backend |
| `npm run db:migrate` | Apply pending database migrations |

### Frontend

Run these commands from `frontend/`.

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run lint` | Run Oxlint |
| `npm run build` | Type-check and build the frontend |
| `npm run preview` | Preview the production build |

## API Reference

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Check backend and database health |
| `GET` | `/api/incidents` | List incidents |
| `GET` | `/api/incidents/:id` | Retrieve a specific incident |
| `GET` | `/api/incidents/:id/activity` | Retrieve incident activity |
| `GET` | `/api/incidents/:id/notes` | Retrieve investigation notes |
| `POST` | `/api/incidents/:id/notes` | Add an investigation note |
| `PATCH` | `/api/incidents/:id/status` | Update incident status |
| `PATCH` | `/api/incidents/:id/resolve` | Resolve an incident |

### Example: Check API health

```bash
curl -i http://localhost:3000/health
```

### Example: List incidents

```bash
curl -i http://localhost:3000/api/incidents
```

### Example: Add an investigation note

```bash
curl -i -X POST http://localhost:3000/api/incidents/INC-1042/notes \
  -H "Content-Type: application/json" \
  -d '{"content":"Reproduced the authentication failure and started investigating the API response."}'
```

Use an incident ID that exists in your database when running these examples.

## Example Investigation Workflow

1. Open the incident dashboard and select an incident.
2. Review the error details and diagnosis.
3. Change the status to `Investigating`.
4. Add notes describing observations and troubleshooting steps.
5. Review the activity timeline for recorded changes.
6. Resolve the incident when the investigation is complete.
7. Refresh the application to check that persisted records remain available.

## Testing and Continuous Integration

The backend includes automated API tests covering:

- CORS preflight behavior.
- Incident list retrieval.
- Retrieval of an existing incident.
- Handling of a missing incident.
- Validation of an invalid status update.

GitHub Actions runs frontend linting and builds, and runs backend migrations, sample data seeding, tests, type checking, and compilation against PostgreSQL.

The latest CI run verified during project development passed both frontend and backend jobs. Check the repository's Actions tab for the current status of subsequent runs.

## Troubleshooting

**PostgreSQL is not ready**

```bash
docker compose ps
docker compose logs postgres
```

Wait for the PostgreSQL health check to pass before running migrations or starting the API.

**The backend cannot connect to PostgreSQL**

- Check that the PostgreSQL container is running.
- Verify the `DATABASE_URL` in `backend/.env`.
- Confirm that the database credentials match `docker-compose.yml`.

**The frontend cannot reach the API**

- Confirm that the backend is running on port `3000`.
- Confirm that the frontend is running on port `5173`.
- Check the browser console and Network tab for HTTP errors.
- Verify the backend's CORS configuration if cross-origin requests fail.

**A database migration fails**

```bash
cd backend
npm run db:migrate
```

Review the error output and confirm that PostgreSQL is healthy and the database URL is correct before retrying.

## Security Considerations

- Keep `.env` files and secrets out of version control.
- Use strong, environment-specific credentials outside local development.
- Restrict CORS to trusted frontend origins.
- Validate incoming API data.
- Add appropriate authentication, authorization, rate limiting, and production secrets management before public deployment.

DebugDesk is a portfolio and learning project, not a production-ready incident management platform.

## License

No specific open-source license has been declared. Unless a license is added, do not assume that the repository is licensed for unrestricted reuse.
