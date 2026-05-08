# 90f.com

90f.com is a frontend-only football webapp for checking match results, upcoming fixtures, and basic match details. The app is built for Vietnamese users with a compact, mobile-first dark interface and match times displayed in Vietnam time.

## Features

- Results and fixtures tabs.
- Finished results for today and previous days.
- Upcoming fixtures for today and future days.
- League filter with the selected leagues persisted in browser storage.
- Match cards with teams, crests, kickoff/status, and score.
- Match detail page with score header, key events, venue, broadcast/meta data when ESPN provides it.
- GMT+7 display logic using `Asia/Ho_Chi_Minh`.
- Responsive layout: one match per row on mobile, two per row on desktop.
- Graceful loading, empty, error, and partial-failure states.

## Tech Stack

- Vue 3
- TypeScript
- Vite
- TailwindCSS
- Vue Router
- Pinia
- TanStack Query for Vue
- Vitest + Vue Test Utils
- Docker + Nginx for container deployment

## Data Source

The app reads public football data from ESPN through a typed service layer.

Reference documentation:

```txt
https://github.com/pseudo-r/Public-ESPN-API/blob/main/docs/sports/soccer.md
```

Main endpoints used:

- Scoreboard: `/sports/soccer/{league}/scoreboard?dates={YYYYMMDD}`
- Match summary: `/sports/soccer/{league}/summary?event={eventId}`

Components should not call ESPN directly. Raw ESPN responses are mapped into normalized domain models before reaching the UI.

## Getting Started

Install dependencies:

```bash
npm install
```

Copy environment defaults if you want a local `.env` file:

```bash
cp .env.example .env
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Run tests:

```bash
npm run test:run
```

## Environment Variables

Vite environment variables are build-time values.

```txt
VITE_ESPN_SITE_API_BASE_URL=https://site.api.espn.com/apis/site/v2
VITE_ESPN_CORE_API_BASE_URL=https://site.api.espn.com/apis/v2
VITE_ESPN_STANDINGS_API_BASE_URL=https://site.api.espn.com/apis/v2
```

`.env.example` is safe to commit. Local `.env*` files are ignored by Git.

## Docker

Build and run with Docker Compose:

```bash
docker compose up --build
```

Open:

```txt
http://localhost:8080
```

Run detached:

```bash
docker compose up --build -d
```

Stop:

```bash
docker compose down
```

## Deploy To Vercel

Recommended Vercel settings:

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

Add the `VITE_ESPN_*` variables in Vercel Project Settings if you need to override the defaults from `.env.example`.

This project is a static SPA using Vue Router history mode. The root `vercel.json` rewrites all routes to `/index.html`, so direct visits and refreshes on client routes such as `/fixtures` and `/match/esp.1/748491` do not return 404.

## GitHub

Suggested repository:

```txt
https://github.com/quangchu94/90f
```

Before pushing, check what will be committed:

```bash
git status --short
```

Files that should stay out of Git include dependencies, build output, local env files, Vercel metadata, logs, coverage, and local design templates. See `.gitignore` for the full list.

## Project Rules

Implementation decisions and product rules are documented in `PROJECT_RULES.md`.
