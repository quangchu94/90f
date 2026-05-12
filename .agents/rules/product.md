# Product Rules

## Product

90f.com is a football webapp for viewing match scores, fixtures, live match states, league tables, teams, and match details. The app has no backend. All data must be fetched from public ESPN endpoints through a typed client-side service layer.

Primary user goals:

- Quickly see today's matches, upcoming fixtures, and recent results.
- Filter by league, result/fixture mode, expandable date range, match status, and favorite competitions.
- Use favorite competitions as the user-facing league selector source across fixtures, livescore, standings, and teams.
- Open a match detail view with score, teams, time/status, venue, broadcast/meta, and summary data when available.
- Read important match tags, penalty shootout totals, and concise goal qualifiers in match detail when ESPN provides enough data.
- Knockout matches should show round tags such as `Tứ kết`, `Bán kết`, and `Chung kết` when ESPN provides stage/season metadata.
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

## Roadmap

### Phase 1: MVP - Scores & Fixtures

- Select one league for fixtures.
- Switch between `Kết quả` and `Lịch đấu` tabs.
- View finished results for today and T-1 by default, with load-more past days.
- View scheduled fixtures for today and T+1 by default, with load-more future days.
- Display match statuses, teams, logos, and scores.
- Provide a basic match detail page.
- Keep the interface mobile-first and aligned to the compact dark reference design.

### Phase 2: League & Team

- League standings.
- Team list.
- Team detail page.
- Roster.
- Team-specific schedule.
- Favorite teams.
- Standings and team list league selectors use the persisted favorite leagues list; favorite league management remains in the fixtures league picker.

Implementation rules:

- Standings must use `https://site.api.espn.com/apis/v2/sports/soccer/{league}/standings`.
- Team list, roster, and team schedule use site v2 team endpoints where available.
- Team fixture data for upcoming soccer matches may use `site.web.api.espn.com/apis/site/v2/sports/soccer/all/teams/{teamId}/schedule?fixture=true`.
- Team detail pages must degrade gracefully when roster or schedule data is partially unavailable.
- Favorite teams are local-only and persisted in client storage.
- Do not add player detail pages in Phase 2 unless explicitly requested.

### Phase 3: Livescore

- Dedicated live scores page for matches currently in progress.
- Use ESPN all-soccer scoreboard for the current local date when available.
- Show live count, last-updated time, manual refresh, favorite-league filters, and grouped live match rows.
- Poll only while live matches are visible and the document is active.
- Keep stale live data visible if refresh fails.

### Phase 4: Match Stats & Player Stats

- Match statistics where ESPN provides data.
- Timeline/play-by-play for goals, cards, substitutions, and major events.
- Timeline goal labels use `(P)` after the scorer for penalty goals and `(F)` for free-kick goals.
- Player statistics where ESPN soccer endpoints support them.
- More complete match detail page.

## Done Criteria

- The app is useful from the first screen.
- Loading, empty, error, and partial-failure states are handled.
- ESPN data is mapped into normalized domain models.
- The detail page remains fast and readable on mobile.
- Unsupported or missing ESPN endpoints degrade gracefully.
