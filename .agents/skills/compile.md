# Compile Skill

Use this skill when the user asks to build, compile, rebuild, recreate the Docker image, or rerun the app container for this project.

## Workflow

1. Inspect the current repo state without reverting user changes.
2. Run the test suite:
   - `npm run test:run`
3. Build the app:
   - `npm run build`
4. Build the Docker image:
   - `docker compose build web`
5. Restart the container from the new image:
   - `docker compose up -d web`
6. Verify the container is running:
   - `docker compose ps`
7. Report:
   - tests result
   - build result
   - image/container result
   - app URL: `http://localhost:8080`

## Rules

- Do not edit source files unless the user explicitly asks for a fix.
- If tests or build fail, stop before Docker build and summarize the failing command plus the most important error lines.
- If Docker commands need approval, request escalation for the exact Docker step.
- Do not run destructive Docker cleanup commands unless explicitly requested.
- Keep the final response concise and include commands that succeeded or failed.
