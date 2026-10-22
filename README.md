# DebugDesk — Incident Investigation Dashboard

DebugDesk is a full-stack incident investigation dashboard designed to demonstrate incident management, troubleshooting workflows, investigation notes, status tracking, and activity auditing.

The project simulates a support and operations environment where engineers can investigate incidents, document findings, track status changes, and maintain an activity history.

## Features

- Incident dashboard with incident details
- Search and filter incidents
- Incident severity and status indicators
- Incident diagnosis details
- Update incident status
- Resolve incidents
- Investigation notes with timestamps and author information
- Persistent notes stored in PostgreSQL
- Activity timeline recording incident actions
- REST API built with Hono
- PostgreSQL database with Drizzle ORM
- React and TypeScript frontend

## Technology Stack

**Frontend**
- React
- TypeScript
- Vite
- CSS

**Backend**
- Node.js
- TypeScript
- Hono
- Drizzle ORM
- PostgreSQL

**Infrastructure and Tools**
- Docker
- Docker Compose
- Drizzle Kit
- Git

## Project Structure

```text
customer-app-debug-lab/
├── backend/
│   ├── drizzle/
│   │   ├── meta/
│   │   └── *.sql
│   ├── src/
│   │   ├── db/
│   │   │   ├── index.ts
│   │   │   ├── schema.ts
│   │   │   └── seed.ts
│   │   └── index.ts
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

Install the following before running the project:

- Node.js and npm
- Docker Engine with Docker Compose
- Git

## Local Setup

### 1. Clone the repository

If you have cloned the repository from GitHub:

```bash
cd customer-app-debug-lab
```

If you are already working in the project directory, continue to the next step.

### 2. Start PostgreSQL

From the project root, run:

```bash
docker compose up -d
```

Check the container:

```bash
docker compose ps
```

PostgreSQL runs on port `5432` and uses a persistent Docker volume.

### 3. Configure the backend

Open a terminal and run:

```bash
cd backend
cp .env.example .env
```

Configure `backend/.env` with the following local development settings:

```env
PORT=3000
DATABASE_URL=postgresql://debugdesk:local_dev_password@localhost:5432/debugdesk
```

**Security note:** These credentials are for local development only. Do not use them in production.

### 4. Install backend dependencies

From the `backend` directory:

```bash
npm install
```

### 5. Apply database migrations

Run:

```bash
npx drizzle-kit migrate
```

This applies any pending SQL migrations to the configured PostgreSQL database.

### 6. Start the backend API

Run:

```bash
npm run dev
```

The backend API runs at:

`http://localhost:3000`

Health check:

`http://localhost:3000/health`

Keep this terminal running.

### 7. Start the frontend

Open a second terminal and run:

```bash
cd ~/projects/customer-app-debug-lab/frontend
npm install
npm run dev
```

Open the local Vite URL shown in the terminal. The default development URL is:

`http://localhost:5173`

Keep the frontend terminal running.

## Backend Scripts

Run these commands from the `backend` directory.

| Command | Description |
|---|---|
| `npm run dev` | Starts the backend in development mode |
| `npm run typecheck` | Checks TypeScript types without generating output |
| `npm run build` | Compiles the backend TypeScript |
| `npx drizzle-kit migrate` | Applies pending database migrations |

## Frontend Scripts

Run these commands from the `frontend` directory.

| Command | Description |
|---|---|
| `npm run dev` | Starts the Vite development server |
| `npm run build` | Type-checks and builds the frontend |
| `npm run lint` | Runs Oxlint |
| `npm run preview` | Previews the production build |

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Checks backend health |
| GET | `/api/incidents` | Retrieves incidents |
| GET | `/api/incidents/:id` | Retrieves a specific incident |
| GET | `/api/incidents/:id/activity` | Retrieves incident activity |
| GET | `/api/incidents/:id/notes` | Retrieves investigation notes |
| POST | `/api/incidents/:id/notes` | Adds an investigation note |
| PATCH | `/api/incidents/:id/status` | Updates incident status |
| PATCH | `/api/incidents/:id/resolve` | Resolves an incident |

## Example Investigation Workflow

1. Open the incident dashboard.
2. Select an incident to inspect its details.
3. Review the error information and diagnosis.
4. Change the incident status to `Investigating`.
5. Add investigation notes describing findings or troubleshooting steps.
6. Review the activity timeline to see recorded actions.
7. Resolve the incident when the investigation is complete.
8. Refresh the page to verify that persisted data remains available.

## Database and Persistence

PostgreSQL stores incident data, investigation notes, and activity records.

Drizzle ORM provides database access, while Drizzle Kit manages SQL migrations.

Investigation notes and incident activity are associated with their incidents. The database schema defines cascading deletion for related records.

## Security Considerations

- The local `.env` file must not be committed.
- `.env.example` contains a placeholder configuration for setup.
- Use strong, environment-specific credentials outside local development.
- Restrict CORS origins appropriately for production deployments.
- Validate incoming API data and apply suitable authentication and authorization before exposing the service publicly.

## Current Status

The core incident investigation workflow is implemented, including incident status updates, resolution, persistent investigation notes, and activity history.

The backend TypeScript checks and build have passed. The frontend should also be built and checked before release.

## License

This project is intended for learning, portfolio development, and demonstration purposes. Add a specific open-source license if you intend to distribute it under one.
