# ESPN API Rules

## Endpoint Families

Primary reference: `https://github.com/pseudo-r/Public-ESPN-API/blob/main/docs/sports/soccer.md`

Use these endpoint families:

- Scoreboard: `https://site.api.espn.com/apis/site/v2/sports/soccer/{league}/scoreboard`
- Scoreboard by date: `https://site.api.espn.com/apis/site/v2/sports/soccer/{league}/scoreboard?dates={YYYYMMDD}`
- Teams: `https://site.api.espn.com/apis/site/v2/sports/soccer/{league}/teams`
- Match summary: `https://site.api.espn.com/apis/site/v2/sports/soccer/{league}/summary?event={eventId}`
- Standings: `https://site.api.espn.com/apis/v2/sports/soccer/{league}/standings`
- Soccer league catalog: `https://sports.core.api.espn.com/v2/sports/soccer/leagues?limit=1000`
- Team fixture schedule fallback: `https://site.web.api.espn.com/apis/site/v2/sports/soccer/all/teams/{teamId}/schedule?fixture=true`

## Service Layer

- Do not call ESPN directly from Vue components.
- Centralize URL building, query params, fetch, timeout, error handling, and response validation in the ESPN service layer.
- Treat ESPN fields as optional unless proven stable.
- Use `YYYYMMDD` for date query params.
- Standings for soccer should use `/apis/v2/`, not `/apis/site/v2/`.
- Team detail should prefer Core API `https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/teams/{teamId}` for venue data, with site v2 fallback.

## Proxy And CORS

- Use same-origin proxy paths by default: `/api/espn/site`, `/api/espn/v2`, `/api/espn/core`, and `/api/espn/web`.
- Proxy `/api/espn/site` to `https://site.api.espn.com/apis/site/v2`.
- Proxy `/api/espn/v2` to `https://site.api.espn.com/apis/v2`.
- Proxy `/api/espn/core` to `https://sports.core.api.espn.com/v2`.
- Proxy `/api/espn/web` to `https://site.web.api.espn.com/apis/site/v2`.
- Detect CORS/network failures and show a friendly Vietnamese message.
- Keep previously fetched data visible when refetch fails.
- Do not assume all ESPN domains behave the same for browser CORS.

## League Catalog

- ESPN soccer catalog must not eager-dereference every league `$ref`.
- Parse league slug directly from `$ref` and enrich metadata locally.
- If a catalog item has only `$ref`, parse the slug and infer a readable display name locally; do not show raw slugs such as `esp.copa_del_rey` in the UI.
- Keep curated local names for common competitions when ESPN catalog omits display data, for example `esp.copa_del_rey` -> `Spanish Copa del Rey`.
- Do not request every `/sports/soccer/leagues/{slug}` detail URL just to build schedule scope.
- League metadata may use static local inference for country, confederation, world, and misc/friendly classification.
- Match stage labels, penalty shootout scores, and goal type metadata are not stable across ESPN endpoints; parse them defensively from structured competitor fields, notes, season/stage fields, status detail text, and event/key-event text.
- Knockout round labels in match summary can appear in `header.season.name/displayName`, for example `2025-26 English FA Cup, Final`, `Semifinals`, or `Quarterfinals`.

## Reliability

- Use TanStack Query cache aggressively to avoid duplicate requests.
- Use stable query keys and deduplicate parallel league/date requests.
- Add request timeouts and cancellation through `AbortController`.
- Add conservative retries with backoff only for transient network/server errors.
- Do not retry 4xx errors repeatedly.
- Poll live matches only while live matches are visible or the related tab/page is active.
- Avoid fetching all leagues by default on mobile. Start with selected or popular leagues.
