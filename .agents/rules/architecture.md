# Architecture Rules

## Source Layout

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

## Domain Models

Use small, stable app models such as `MatchStatus`, `TeamSummary`, `LeagueSummary`, `FootballMatch`, `TeamDetail`, and `MatchDetail`.

Mapping rules:

- Normalize IDs to strings.
- Normalize dates to ISO strings internally.
- Format dates and times only at the UI boundary.
- Keep fallback labels in Vietnamese for visible UI.
- If ESPN returns unknown/missing event status but both team scores are present, normalize the match as `finished`.
- Do not mention timezone in general page helper copy; show correctness through formatted match date/time.
- Avoid leaking ESPN-specific naming into page components.

## State Management

Use Pinia for:

- Selected fixture league.
- Active fixtures tab.
- Result and fixture date-range counts for load-more behavior.
- Favorite leagues or teams.
- Date range preference.
- UI density or theme if later added.

Client storage rules:

- Persist lightweight UI preferences only, such as favorite leagues and selected fixture league.
- Persist favorite teams as lightweight `{ leagueSlug, teamId }` entries.
- Do not persist ESPN API responses in client storage.
- Restore favorite leagues, selected fixture league, and favorite teams during store initialization.
- Keep exactly one selected league active in fixtures.

## TypeScript Rules

- Do not use `any` unless there is a short comment explaining why.
- Prefer `unknown` plus narrowing for untrusted API responses.
- Keep type guards and mappers close to ESPN service code.
- Use explicit return types for exported functions and composables.
- Use discriminated unions for match status and loading/error states when helpful.
