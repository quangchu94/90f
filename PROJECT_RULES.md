# 90f.com Project Rules

This file is the required quick-read index for the project. Detailed rules live in `.agents/rules/` and should be consulted before touching the related area.

## Rule Files

- [Product](.agents/rules/product.md): product goals, stack, roadmap, and done criteria.
- [Architecture](.agents/rules/architecture.md): source layout, domain models, state, and TypeScript rules.
- [ESPN API](.agents/rules/espn-api.md): endpoint families, proxy rules, CORS/rate-limit handling, and league catalog rules.
- [Data Fetching](.agents/rules/data-fetching.md): TanStack Query usage, fixtures, standings, team schedule, cache, and failure handling.
- [UI](.agents/rules/ui.md): design direction, routes, styling, accessibility, and Vietnamese localization.
- [Deployment](.agents/rules/deployment.md): Docker, Nginx, Vercel, env, and SPA fallback.
- [Testing](.agents/rules/testing.md): testing expectations and development standards.

## Core Rules

- 90f.com is a frontend-only Vue/Vite football webapp for Vietnamese users.
- Do not add a backend, database, auth, betting, comments, payments, or admin flows unless explicitly requested.
- Keep ESPN calls inside `src/services/espn/`; components must consume normalized domain models.
- Use TanStack Query for remote ESPN data and Pinia only for lightweight client UI preferences.
- Use same-origin ESPN proxy paths by default: `/api/espn/site`, `/api/espn/v2`, `/api/espn/core`, and `/api/espn/web`.
- Vite env vars are build-time values. Do not rely on runtime mutation of `VITE_*` variables in the browser.
- Treat ESPN payload fields as optional and unstable unless tests prove otherwise.
- Keep visible copy Vietnamese; keep code names English.

## ESPN League And Schedule Rules

- ESPN soccer catalog must not eager-dereference every league `$ref`. Parse the slug from `$ref` and enrich metadata locally.
- Team detail schedule must scope league-specific schedule requests before calling schedule endpoints.
- For domestic team routes, query only that country, its continental competitions, and FIFA/world leagues.
- For continental/world or unknown route leagues, fallback to the non-excluded catalog.
- Do not request or render `Club Friendlies` or `Misc` in team detail schedule/results.
- Keep the all-fixture fallback endpoint for upcoming team matches, but never let it overwrite a concrete league with a generic or incorrect one.
- League-specific team schedule events use the requested endpoint league as source metadata.
- All-fixture team schedule events infer league from `event.season.displayName` or `event.seasonType.name`.
- Livescore all-soccer events may omit league fields; infer concrete league slugs from season metadata or ESPN UID league ids before applying favorite/league filters.

## Fixtures And Favorites

- Fixtures has exactly one selected league at a time.
- Favorite leagues are local-only, persisted in localStorage, and can be added/removed from the ESPN soccer catalog popup.
- The league popup groups by World, continent/confederation, then country; do not group alphabetically by default.
- Keep one selected league active after unfavorite operations.
- Load-more on fixtures increases the active date range by 10 days per click.

## Standings

- Soccer standings use `/apis/v2/sports/soccer/{league}/standings`.
- Sort standings rows by ESPN-provided `row.rank` ascending at mapper and render boundaries.
- Display ESPN rank as-is; never replace it with `index + 1`.
- Do not insert blank rows for missing ranks. Unranked rows stay after ranked rows in ESPN response order.

## Team Detail

- Team detail has `Kết quả` and `Lịch đấu` tabs with shared status rules.
- `Kết quả` sorts newest-first; `Lịch đấu` sorts nearest upcoming first.
- Team match rows show date, time/status, and league short name.
- Team detail tab/filter state must be reflected in route query params.
- Match detail links opened from team pages include a safe same-origin `returnTo`; match detail back uses it before falling back to `/fixtures`.

## Done Criteria

- Works on mobile and desktop.
- Loading, empty, error, and partial-data states are handled.
- ESPN responses are mapped to normalized domain models.
- UI follows the compact dark sports design direction.
- TypeScript passes without unsafe shortcuts.
- Relevant mapper/helper/component tests are added for risky data changes.
- `npm run test:run`, `npm run build`, Docker build, and container recreate are run when requested.
