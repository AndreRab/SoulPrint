# Quality gate

Focused local evidence is required for the changed scope; broad builds and deployment checks belong in CI once configured.

| Paths | Local evidence | CI responsibility |
|---|---|---|
| `api/**` | `cd api; uv run pytest` | Python tests, lint, Function packaging |
| `apps/web/**` | `cd apps/web; npm run typecheck` | typecheck, tests, build, UI deployment |
| docs | Markdown links and JSON syntax | documentation validation |

Missing CI or Azure Functions Core Tools is a documented limit, never a passing result.
