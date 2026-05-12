# Data Fetching Rules

## Fixtures

- Query keys must be stable and include league/date/status filters.
- Combined results/fixtures screens query the single selected league/date pairs and filter normalized matches by mode.
- Fixtures has exactly one selected league at a time.
- Favorite leagues are local-only, persisted in localStorage, and can be added/removed from the ESPN soccer catalog popup.
- Favorite league storage must be versioned; legacy storage should seed or merge the 8 default leagues, while current-version storage must respect user unfavorite choices.
- The league popup groups by World, continent/confederation, then country.
- The league popup may enrich catalog rows with league detail requests, but detail failures must not block or fail the full picker list.
- The league popup should render progressively: show default/favorite/priority leagues first, then merge enriched full-catalog data from background detail requests.
- Keep one selected league active after unfavorite operations.
- The fixtures load-more action increases the active date range by 10 days per click.
- `Kết quả` shows only finished matches for today and previous days in GMT+7.
- `Lịch đấu` shows only scheduled matches for today and future days in GMT+7.
- Results and fixtures group matches by `kickoff` converted to `Asia/Ho_Chi_Minh`, not by ESPN endpoint date.
- Multi-day scoreboard screens fetch the target local dates plus the adjacent previous source date.

## Team Schedule

- Team detail schedule uses the same status split as fixtures.
- Team match rows show kickoff date, time/status display, and league short name when available.
- Team detail schedule/results must scope league-specific schedule requests before calling schedule endpoints.
- For domestic team routes, query only that country's leagues, matching continental competitions, and FIFA/world leagues.
- For continental/world or unknown route leagues, fallback to the non-excluded catalog.
- Team schedule/results must exclude `Club Friendlies` and `Misc` from league-specific requests and all-fixture events.
- League-specific request failures must not fail the full team schedule while at least one source returns data.
- Team detail schedule offers a league filter with `Tất cả` as default.
- Team detail tab/filter state must be reflected in route query params.
- Team detail `Kết quả` sorts newest first.
- Team detail `Lịch đấu` sorts nearest upcoming first.
- ESPN team schedule responses must not be assumed to include stable `response.leagues` or `event.leagues`.
- League-specific schedule events use the requested endpoint league as source metadata.
- All-fixture events infer league from `event.season.displayName` or `event.seasonType.name`.
- Unknown all-fixture events must not fallback to the route league.
- Team detail schedule/results should render partial data as soon as individual league schedule requests return; do not wait for every scoped schedule endpoint to settle before showing the first matches.
- Team schedule composables should expose fetching/updating state separately from loading-with-no-data so UI can avoid showing empty states while partial requests are still pending.

## Standings

- Soccer standings use `/apis/v2/sports/soccer/{league}/standings`.
- Sort standings rows by ESPN-provided `row.rank` ascending at mapper and render boundaries.
- Display ESPN rank as-is; never replace it with `index + 1`.
- Do not insert blank rows for missing ranks.
- Rows without rank stay after ranked rows in ESPN response order.

## Livescore

- Livescore uses one current-date all-soccer scoreboard query by default: `['live-scoreboard', YYYYMMDD]`.
- Livescore filters normalized matches to `in_progress` and `halftime` statuses before rendering.
- Livescore groups visible matches by normalized league and supports `all`, `favorites`, and single favorite-league filters.
- Livescore should keep previously fetched matches visible when refetch fails.
- Livescore polling must stop when the page is not visible or when there are no live matches.

## Cache And Error Handling

Suggested stale times:

- Live scoreboard with live matches: 15-30 seconds.
- Live scoreboard without live matches: 60 seconds.
- Today's scheduled matches: 60 seconds.
- Finished past matches: 10-30 minutes.
- Teams and league metadata: 24 hours.
- Standings: 5-15 minutes.
- Teams, team detail, and roster: 24 hours.
- Team schedule: 5-15 minutes.

Error handling:

- Show friendly Vietnamese error copy.
- Keep partial data visible if some league requests fail.
- Provide a retry action.
- Log developer details only in development mode.
