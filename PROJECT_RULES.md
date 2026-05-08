# 90f.com Project Rules

## Product

90f.com is a football webapp for viewing match scores, fixtures, live match states, league tables, teams, and match details. The app has no backend. All data must be fetched from public ESPN endpoints through a typed client-side service layer.

Primary user goals:

- Quickly see today's matches, upcoming fixtures, and recent results.
- Filter by league, result/fixture mode, expandable date range, match status, and favorite competitions.
- Open a match detail view with score, teams, time/status, venue, broadcast/meta, and summary data when available.
- View league standings where ESPN supports reliable data.

Keep the product focused. Do not add betting, accounts, comments, paid features, or admin flows unless explicitly requested.

## Technology

Use this stack:

- Vue 3 with Composition API and `<script setup lang="ts">`
- TypeScript in strict mode
- Vite
- TailwindCSS
- Vue Router
- Pinia
- TanStack Query for Vue
- ESPN API service layer
- Normalized domain models

Avoid introducing a backend, server functions, database, auth provider, global event bus, or unrelated UI framework.

## App Architecture

Recommended source layout:

```txt
src/
  app/
    router/
    providers/
  assets/
  components/
    common/
    football/
    layout/
  features/
    fixtures/
    match-detail/
    standings/
    teams/
  services/
    espn/
      espnClient.ts
      espnEndpoints.ts
      espnTypes.ts
      espnMappers.ts
  stores/
  domain/
    models.ts
    leagues.ts
    status.ts
  composables/
  utils/
```

Rules:

- Keep ESPN response types in `services/espn/espnTypes.ts`.
- Keep app-facing normalized models in `domain/models.ts`.
- Convert all raw ESPN responses to domain models in mapper functions before data reaches components.
- Components should consume domain models, not raw ESPN payloads.
- Use TanStack Query for remote data, cache state, loading state, refetching, and retries.
- Use Pinia only for client UI state such as selected leagues, filters, favorites, theme, and preferences.
- Keep routes lazy-loaded for feature pages.

## ESPN API

Primary documentation:

- `https://github.com/pseudo-r/Public-ESPN-API/blob/main/docs/sports/soccer.md`

Use these endpoint families:

- Scoreboard: `https://site.api.espn.com/apis/site/v2/sports/soccer/{league}/scoreboard`
- Scoreboard by date: `https://site.api.espn.com/apis/site/v2/sports/soccer/{league}/scoreboard?dates={YYYYMMDD}`
- Teams: `https://site.api.espn.com/apis/site/v2/sports/soccer/{league}/teams`
- Match summary: `https://site.api.espn.com/apis/site/v2/sports/soccer/{league}/summary?event={eventId}`
- Standings: `https://site.api.espn.com/apis/v2/sports/soccer/{league}/standings`

Important API rules:

- Do not call ESPN directly from Vue components.
- Centralize URL building, query params, fetch, timeout, error handling, and response validation in the ESPN service layer.
- Treat ESPN fields as optional unless proven stable.
- Handle missing logos, missing scores, postponed games, abandoned games, TBD times, and empty standings gracefully.
- Standings for soccer should use `/apis/v2/`, not `/apis/site/v2/`, because the site v2 standings endpoint may return empty data.
- Use `YYYYMMDD` for date query params.
- Default timezone display should be user-friendly for Vietnam users unless a later product requirement says otherwise.

## CORS And Rate Limit Risk

This project is frontend-only, so ESPN API availability from browsers must be treated as an operational risk.

CORS risk reduction:

- Keep every ESPN request inside the ESPN service layer so a future proxy can be added without changing components.
- Store ESPN base URLs in environment variables such as `VITE_ESPN_SITE_API_BASE_URL`, `VITE_ESPN_CORE_API_BASE_URL`, and `VITE_ESPN_STANDINGS_API_BASE_URL`.
- Implement one fetch client interface, for example `EspnHttpClient`, so the app can switch from direct ESPN calls to a CDN/proxy endpoint later.
- Detect CORS/network failures and show a friendly Vietnamese message instead of a broken page.
- Keep previously fetched data visible when refetch fails.
- Do not assume all ESPN domains behave the same for browser CORS. Test each endpoint family used by the UI.

Rate-limit and reliability reduction:

- Use TanStack Query cache aggressively to avoid duplicate requests.
- Use stable query keys and deduplicate parallel league/date requests.
- Add request timeouts and cancellation through `AbortController`.
- Add conservative retries with backoff only for transient network/server errors.
- Do not retry 4xx errors repeatedly.
- Use `staleTime`, `gcTime`, and refetch intervals based on match status.
- Poll live matches only while live matches are visible or the related tab/page is active.
- Avoid fetching all leagues by default on mobile. Start with selected or popular leagues.
- Batch UI work by league/date and tolerate partial failures.
- Add a small in-memory guard for identical requests fired within the same short window if TanStack Query is not enough.

Future fallback options if direct browser calls become unreliable:

- Add a lightweight read-through API proxy later, but keep it outside the MVP unless required.
- Use CDN edge caching for scoreboard/standings responses if a deployment platform supports it.
- Add static fallback league metadata in the app for names, slugs, ordering, and default logos where appropriate.

Initial league slugs:

- `fifa.world` FIFA World Cup
- `eng.1` Premier League
- `esp.1` La Liga
- `ger.1` Bundesliga
- `ita.1` Serie A
- `fra.1` Ligue 1
- `uefa.champions` UEFA Champions League
- `uefa.europa` UEFA Europa League

Default selected leagues:

- Use `DEFAULT_LEAGUE_SLUGS` only when the user has no valid saved league selection.
- Persist the user's selected leagues in client storage so the next app load restores the leagues they viewed last time.
- Validate saved league slugs against supported league metadata before using them.
- If saved data is missing, empty, malformed, or unsupported, fall back to `DEFAULT_LEAGUE_SLUGS`.

## Domain Models

Create small, stable app models such as:

```ts
export type MatchStatus =
  | 'scheduled'
  | 'in_progress'
  | 'halftime'
  | 'finished'
  | 'postponed'
  | 'cancelled'
  | 'unknown';

export interface TeamSummary {
  id: string;
  name: string;
  shortName: string;
  abbreviation?: string;
  logoUrl?: string;
}

export interface FootballMatch {
  id: string;
  leagueSlug: string;
  leagueName: string;
  kickoff: string;
  status: MatchStatus;
  statusText: string;
  homeTeam: TeamSummary;
  awayTeam: TeamSummary;
  homeScore?: number;
  awayScore?: number;
  venue?: string;
}
```

Mapping rules:

- Normalize IDs to strings.
- Normalize dates to ISO strings internally.
- Format dates and times only at the UI boundary.
- Keep fallback labels in Vietnamese for visible UI.
- Do not mention timezone in general page helper copy; show timezone correctness through formatted match date/time.
- Avoid leaking ESPN-specific naming into page components.

## Design Direction

Use the provided reference image `template/template-giaodien.png` as the design baseline.

Visual personality:

- Simple, professional, sports-focused, fast to scan.
- Dark navy app shell with strong contrast.
- Accent color: coral/red-orange for active states and primary highlights.
- Secondary accent: amber/yellow for times, filters, and live indicators.
- Muted blue-gray text for metadata.
- Borders should be subtle and thin.
- Cards and controls should feel compact, not decorative.

Suggested palette:

- Page background: `#08131d`
- Surface: `#101f31`
- Elevated surface: `#13263b`
- Border: `#263f5c`
- Primary text: `#f8fafc`
- Secondary text: `#9fb2cc`
- Muted text: `#63809f`
- Primary accent: `#ff6148`
- Amber accent: `#ffb31a`
- Success/live: `#22c55e`
- Danger/loss: `#ef4444`

UI rules:

- Mobile-first responsive design.
- Avoid marketing landing-page layout. The first screen should be the usable match schedule/results experience.
- Keep page sections full-width or naturally constrained. Do not place cards inside cards.
- Use compact match rows/cards with stable heights, team crests, kickoff/status, team names, scores, and a clear tap target.
- On mobile, prioritize date tabs, league filters, match list, and readable team names.
- On desktop, use max-width content, optional two-column layouts for details, and denser tables.
- Buttons and filters must have visible active, hover, focus, loading, and disabled states.
- Text must not overflow buttons, cards, tabs, or match rows.
- Use icons where helpful for calendar, trophy, search, chevron, star/favorite, refresh, and status.
- Match detail timeline should appear directly below the score header; home-team events align left, event type/minute align center, and away-team events align right.

## Pages And Routes

Recommended routes:

- `/` redirects to `/fixtures`
- `/fixtures` combined match schedule and results page with `Kết quả` and `Lịch đấu` tabs
- `/fixtures/:date` legacy route that should redirect to `/fixtures`
- `/match/:leagueSlug/:eventId` match detail
- `/standings/:leagueSlug` league standings
- `/teams/:leagueSlug` team list

Navigation should be minimal:

- Fixtures
- Results
- Standings
- Leagues

## Data Fetching Rules

Use TanStack Query:

- Query keys must be stable and include league/date/status filters.
- Combined results/fixtures screens should query each selected league/date pair separately and filter normalized matches by mode.
- `Kết quả` should show only finished matches for today and previous days in GMT+7.
- `Lịch đấu` should show only scheduled matches for today and future days in GMT+7.
- Results and fixtures must group matches by `kickoff` converted to `Asia/Ho_Chi_Minh`, not by the ESPN scoreboard endpoint date.
- Multi-day scoreboard screens should fetch the target local dates plus the adjacent previous source date so late European kickoffs are grouped under the correct GMT+7 day.
- Date sections with no matches after mode/status/local-date filtering should not be rendered.
- If a league has no matches across the full fetched range, show one league-level empty state: `Không có trận nào trong khoảng thời gian này`.
- Prefer parallel queries for multiple selected leagues.
- Use reasonable stale times for scoreboard data.
- Refetch live matches more often than scheduled or finished matches.
- Deduplicate loading and error UI through reusable components.

Suggested stale times:

- Live scoreboard: 15-30 seconds
- Today's scheduled matches: 60 seconds
- Finished past matches: 10-30 minutes
- Teams and league metadata: 24 hours
- Standings: 5-15 minutes

Error handling:

- Show friendly Vietnamese error copy.
- Keep partial data visible if some league requests fail.
- Provide a retry action.
- Log developer details only in development mode.

## State Management

Use Pinia for:

- Selected leagues
- Active fixtures tab: `Kết quả` or `Lịch đấu`
- Result and fixture date-range counts for load-more behavior
- Favorite leagues or teams
- Date range preference
- UI density preference if needed
- Theme preference if later added

Do not store fetched ESPN responses in Pinia. TanStack Query owns remote cache.

Client storage rules:

- Persist lightweight UI preferences only, such as selected leagues.
- Do not persist ESPN API responses in client storage.
- Restore selected leagues from storage during store initialization.
- Keep at least one selected league active in the UI.

## TypeScript Rules

- Do not use `any` unless there is a short comment explaining why.
- Prefer `unknown` plus narrowing for untrusted API responses.
- Keep type guards and mappers close to ESPN service code.
- Use explicit return types for exported functions and composables.
- Use discriminated unions for match status and loading/error states when helpful.

## Styling Rules

- Use Tailwind utilities and small reusable components.
- Avoid large custom CSS files unless needed for app-level tokens or complex responsive behavior.
- Keep spacing consistent: `4`, `6`, and `8` are the default section spacing scales.
- Match rows should have predictable dimensions and not shift when scores update.
- Use `line-clamp` or responsive layout adjustments for long team and league names.
- All interactive elements must have accessible focus styles.

## Accessibility

- Use semantic buttons, links, headings, lists, and tables where appropriate.
- Match cards that navigate should be keyboard accessible.
- Icon-only buttons need accessible labels.
- Do not rely on color alone for live, finished, postponed, or selected states.
- Maintain readable contrast on the dark theme.

## Localization

Default visible copy should be Vietnamese.

Preferred terms:

- Fixtures: `Lịch thi đấu`
- Results: `Kết quả`
- Standings: `Bảng xếp hạng`
- Upcoming: `Sắp tới`
- Live: `Đang đá`
- Finished: `Kết thúc`
- Postponed: `Hoãn`
- Cancelled: `Hủy`
- Today: `Hôm nay`
- Tomorrow: `Ngày mai`
- Yesterday: `Hôm qua`

Keep internal code names in English.

## Performance

- Keep initial bundle small with route-level code splitting.
- Lazy-load heavy match detail panels if needed.
- Use optimized crest images from ESPN URLs as provided; add safe fallbacks.
- Avoid unnecessary client-side polling when no live matches are visible.
- Do not render huge league lists by default on mobile.

## Docker Deployment

The app is a static frontend and should be deployed as a production Vite build served by Nginx.

Docker files:

- `Dockerfile` uses a multi-stage build: Node builds the Vue/Vite app, Nginx serves `dist`.
- `docker/nginx.conf` must support SPA fallback with `try_files $uri $uri/ /index.html`.
- `docker-compose.yml` exposes the app on host port `8080` by default.
- `.dockerignore` must exclude local build artifacts, dependencies, env files, git metadata, logs, and design templates.

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

Build and run without Compose:

```bash
docker build -t 90f-web .
docker run --rm -p 8080:80 90f-web
```

Environment rules:

- Vite environment variables are build-time values, not runtime browser values.
- Pass ESPN base URLs as Docker build args when they need to change.
- Keep defaults aligned with `.env.example`.
- Do not add a backend/proxy to the Docker setup unless CORS or rate-limit testing proves it is required.

Example custom build args:

```bash
docker build -t 90f-web `
  --build-arg VITE_ESPN_SITE_API_BASE_URL=https://site.api.espn.com/apis/site/v2 `
  --build-arg VITE_ESPN_CORE_API_BASE_URL=https://site.api.espn.com/apis/v2 `
  --build-arg VITE_ESPN_STANDINGS_API_BASE_URL=https://site.api.espn.com/apis/v2 `
  .
```

## Vercel Deployment

The app uses Vue Router history mode, so Vercel must be configured with an SPA fallback.

Rules:

- Keep `vercel.json` at the repo root.
- Rewrite all non-asset routes to `/index.html` so direct visits and refreshes on client routes work.
- Direct URLs such as `/fixtures` and `/match/:leagueSlug/:eventId` must not return 404 on Vercel.
- Do not switch to hash routing just to solve static hosting refresh issues.

Required `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Roadmap

### Phase 1: MVP - Scores & Fixtures

Goal: users can view football fixtures and results quickly.

Features:

- Select league.
- Switch between `Kết quả` and `Lịch đấu` tabs.
- View finished results for today and T-1 by default, with load-more past days.
- View scheduled fixtures for today and T+1 by default, with load-more future days.
- Display match statuses: `scheduled`, `live`, `finished`.
- Display home team, away team, logos, and score.
- Basic match detail page.
- Responsive mobile-first layout.

Done when:

- The app is useful from the first screen.
- ESPN scoreboard data is mapped into normalized match models.
- Loading, empty, error, and partial-failure states are handled.
- The interface follows the dark compact reference design.

### Phase 2: League & Team

Features:

- League standings.
- Team list.
- Team detail page.
- Roster.
- Team-specific schedule.
- Favorite teams.

Done when:

- Standings use the soccer-compatible `/apis/v2/` ESPN endpoint.
- Favorite teams persist locally.
- Team pages work even when roster or schedule data is partially unavailable.

### Phase 3: Match Stats & Player Stats

Features:

- Match statistics when ESPN provides data.
- Timeline/play-by-play for goals, cards, substitutions, and major events.
- Player statistics where ESPN soccer endpoints support them.
- Better live-match refresh behavior.
- More complete match detail page.

Done when:

- Unsupported or missing ESPN player/stat endpoints degrade gracefully.
- The detail page remains fast and readable on mobile.
- Additional polling is limited to live/detail views that need it.

## Testing

Minimum testing expectations:

- Unit test ESPN mappers with realistic partial/missing payloads.
- Unit test date formatting helpers.
- Unit test status normalization.
- Component test match row behavior for scheduled, live, finished, and postponed states.

When adding tests, prefer the project's chosen Vue testing stack. If no test stack exists yet, recommend Vitest and Vue Test Utils.

## Development Standards

- Keep commits and changes focused.
- Do not mix broad refactors with feature work.
- Prefer readable, boring code over clever abstractions.
- Name files and components by feature and responsibility.
- Components should stay small enough to understand without scrolling for too long.
- Before adding dependencies, confirm the need is real and aligned with the existing stack.

## Done Criteria

A feature is done when:

- It works on mobile and desktop.
- Loading, empty, error, and partial-data states are handled.
- ESPN responses are mapped to normalized domain models.
- UI follows the reference design direction.
- TypeScript passes without unsafe shortcuts.
- Relevant mapper/helper tests are added or updated for risky data changes.
