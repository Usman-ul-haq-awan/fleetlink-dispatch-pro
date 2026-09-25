# AGENTS.md

## Project Context

This is a Base44 app repository. Treat it as user-owned application code, keep changes focused on the user's request, and preserve existing project conventions.

Start with `README.md` for local setup, environment variables, and publish workflow.

## Base44 References

- CLI overview: https://docs.base44.com/developers/references/cli/get-started/overview.md
- Agent skills: https://docs.base44.com/developers/backend/overview/skills.md

If your agent supports Agent Skills, install or update Base44 skills before Base44-specific work:

```bash
npx skills add base44/skills
```

## Key Files

- `src/`: frontend application source.
- `src/api/base44Client.js`: frontend Base44 SDK client.
- `vite.config.js`: Vite config and Base44 Vite plugin setup.
- `.env.local`: local-only environment values; never commit secrets.

## Working Notes

- Use `base44 dev` as the default local development command when you need the local Base44 backend. It can run the backend and frontend together.
- When docs or code mention the frontend being started automatically, that usually means the Base44 project config includes `site.serveCommand`, for example `"serveCommand": "npm run dev"` in `base44/config.jsonc`.
- Use `npm run dev` only for frontend-only work against the hosted Base44 backend.
- Prefer the existing Base44 CLI workflow over adding new npm scripts for Base44-specific tasks.
- Reuse the existing SDK client and Vite plugin patterns before adding new Base44 integration paths.
- Run the relevant checks from `package.json` before finishing code changes.

## Sandbox Setup (docker-compose.base44.yml)

- This is a frontend-only Base44 app (Vite + React). The backend (entities, functions, workflows) runs on the hosted Base44 platform — there is no local backend in the repo. The `@base44/vite-plugin` proxies `/api` requests to the Base44 backend configured via `VITE_BASE44_APP_BASE_URL`.
- Run in the sandbox with `docker compose -f docker-compose.base44.yml up -d`. The web service is a `node:22` container that runs `npm install && npx vite --host 0.0.0.0 --port 5173`, mapped to host port 3000.
- `VITE_BASE44_APP_ID` and `VITE_BASE44_APP_BASE_URL` are required for the app to connect to its hosted Base44 backend. Without real values the frontend still renders (login page) but all API calls 404. Provide them via the Base44 dashboard Secrets page.
- Fixed two source corruption bugs on import: `src/pages/CarrierDatabase.jsx` had literal `\n\n` text instead of real newlines (line 257), and `src/lib/researchRunner.js` had escaped backticks (`\``) and escaped template expressions (`\${`) instead of normal template literals.
