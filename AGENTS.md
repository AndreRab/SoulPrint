# SoulPrint agent instructions

## Context and boundaries

Read [docs/INDEX.md](docs/INDEX.md) before substantial work. The repository is a two-project workspace: `apps/web` is the Vue presentation layer and `api` is the Azure Functions/API and persistence boundary. Presentation code must not access SQLite directly.

## Project rules

- Preserve the supplied SoulPrint reference design: dark navy space, cyan/pink/violet luminescence, glass-like panels, serif display headings, and rounded controls.
- Keep all generated/mocked portraits clearly fictional. Safety, photo verification, emergency contacts, reverse-image checks, and live location are demo UI only until real reviewed providers exist.
- The AI adapter accepts only non-secret configuration from environment variables. Do not commit keys or add a provider-specific dependency to the frontend.
- SQLite is the local/demo persistence adapter. Do not present Function App disk storage as durable multi-user production storage.
- Use `uv` for Python dependencies. npm owns Vue dependencies.

## Delivery policy

- Base branch: `main`; use the `codex/` prefix for new task branches.
- Future requested work may be committed and pushed when a remote exists and the task is verified. The GitHub remote is recorded in the VibeRails adoption manifest.
- Run code review only when requested. Agent delegation and model routing follow the current Codex runtime limits.
- Run focused tests before the final commit for a requested task. CI remains required before any production delivery.

## Quality map

| Paths | Focused command |
|---|---|
| `api/**` | `cd api; uv run pytest` |
| `apps/web/**` | `cd apps/web; npm run typecheck` |
| docs/configuration | validate links and JSON syntax |

Follow the concise adopted rules in `docs/standards/` and report verification limits honestly.

Local instructions: [API agents](api/AGENTS.md) and [web agents](apps/web/AGENTS.md).
