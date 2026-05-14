# Testing And Development Rules

## Testing

Minimum testing expectations:

- Unit test ESPN mappers with realistic partial/missing payloads.
- Unit test date formatting helpers.
- Unit test status normalization.
- Component test match row behavior for scheduled, live, finished, and postponed states.
- Add regression tests for ESPN endpoint/scoping bugs, especially team schedule scope and league catalog parsing.
- Prefer Vitest and Vue Test Utils for this project.

When changing risky ESPN data logic:

- Test missing optional fields.
- Test unknown statuses.
- Test score parsing from strings, numbers, and nested ESPN score shapes.
- Test dedupe and merge preference rules.
- Test partial failures and 404s.
- When changing match detail player stats, test sparse leader rows so values align under the correct `Total Shots`, `Accurate Passes`, `Saves`, or similar columns.
- When adding match detail lineup behavior, test both roster mapping and commentary-based substitution parsing.

## Development Standards

- Keep commits and changes focused.
- Do not mix broad refactors with feature work unless explicitly requested.
- Prefer readable, boring code over clever abstractions.
- Name files and components by feature and responsibility.
- Components should stay small enough to understand without scrolling for too long.
- Before adding dependencies, confirm the need is real and aligned with the existing stack.

## Verification

Run as appropriate for the task:

```bash
npm run test:run
npm run build
docker compose build
docker compose up -d --force-recreate web
docker compose ps
```

If local `npm` is unavailable, use Docker:

```bash
docker run --rm -v ${PWD}:/app -w /app node:22-alpine npm run test:run
docker run --rm -v ${PWD}:/app -w /app node:22-alpine npm run build
```
