# ServiceHub

ServiceHub is a React + Vite frontend with a Render-ready Node/Express backend for booking home services and managing live worker registration.

## Features

- Service booking flow with modal form and confirmation
- Worker registration with backend persistence
- Live worker updates using Server-Sent Events
- Service-based filtering
- Availability toggle for testing live updates

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example`.

3. Start the backend:

```bash
npm run dev:server
```

4. Start the frontend in another terminal:

```bash
npm run dev
```

## Render deployment

This repo includes [render.yaml](/C:/Users/win11/.gemini/antigravity/scratch/render.yaml) for deploying:

- one Node web service
- one Postgres database

For production, Render should provide `DATABASE_URL` automatically from the linked Postgres instance.
