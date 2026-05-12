# Deployment Rules

## Docker

The app is a static frontend deployed as a production Vite build served by Nginx.

Docker rules:

- `Dockerfile` uses a multi-stage build: Node builds Vue/Vite, Nginx serves `dist`.
- `docker/nginx.conf` must support SPA fallback with `try_files $uri $uri/ /index.html`.
- `docker-compose.yml` exposes the app on host port `8080` by default.
- `.dockerignore` excludes local build artifacts, dependencies, env files, git metadata, logs, and design templates.
- Use Nginx proxy locations for `/api/espn/site`, `/api/espn/v2`, `/api/espn/core`, and `/api/espn/web`.

Common commands:

```bash
docker compose up --build
docker compose up --build -d
docker compose down
docker build -t 90f-web .
docker run --rm -p 8080:80 90f-web
```

After feature work, use `.agents/skills/compile.md` as the build workflow: run tests, run the Vite build, build `90f-web:latest`, restart `docker compose up -d web`, and verify the app at `http://localhost:8080`.

## Environment

- Vite environment variables are build-time values, not runtime browser values.
- Pass ESPN base URLs as Docker build args when they need to change.
- Default Docker and Vercel builds should use same-origin proxy paths instead of direct ESPN URLs.
- Keep defaults aligned with `.env.example`.

Example build args:

```bash
docker build -t 90f-web `
  --build-arg VITE_ESPN_SITE_API_BASE_URL=/api/espn/site `
  --build-arg VITE_ESPN_CORE_API_BASE_URL=/api/espn/core `
  --build-arg VITE_ESPN_STANDINGS_API_BASE_URL=/api/espn/v2 `
  --build-arg VITE_ESPN_WEB_API_BASE_URL=/api/espn/web `
  .
```

## Vercel

The app uses Vue Router history mode, so Vercel must be configured with an SPA fallback.

Rules:

- Keep `vercel.json` at the repo root.
- Keep ESPN proxy rewrites before the SPA fallback rewrite.
- Rewrite `/api/espn/site/:path*`, `/api/espn/v2/:path*`, `/api/espn/core/:path*`, and `/api/espn/web/:path*` to ESPN before rewriting app routes to `/index.html`.
- Rewrite all non-asset routes to `/index.html`.
- Direct URLs such as `/fixtures` and `/match/:leagueSlug/:eventId` must not return 404.
- Do not switch to hash routing just to solve refresh issues.
- Match detail links opened from team pages include a safe same-origin `returnTo`; match detail back uses it before falling back to `/fixtures`.

Required rewrite shape:

```json
{
  "headers": [
    {
      "source": "/api/espn/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=60, stale-while-revalidate=300"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/espn/site/:path*",
      "destination": "https://site.api.espn.com/apis/site/v2/:path*"
    },
    {
      "source": "/api/espn/v2/:path*",
      "destination": "https://site.api.espn.com/apis/v2/:path*"
    },
    {
      "source": "/api/espn/core/:path*",
      "destination": "https://sports.core.api.espn.com/v2/:path*"
    },
    {
      "source": "/api/espn/web/:path*",
      "destination": "https://site.web.api.espn.com/apis/site/v2/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
