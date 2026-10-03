# Quality gate

Focused local evidence is required for the changed scope; broad builds and deployment checks belong in CI once configured.

| Paths | Local evidence | CI responsibility |
|---|---|---|
| `api/**` | `cd api; uv run ruff check .; uv run pytest` | Function packaging and Azure smoke test |
| `apps/web/**` | `cd apps/web; npm.cmd run typecheck; npm.cmd run build` | UI deployment and browser acceptance |
| docs/configuration | VibeRails adoption audit, Markdown links and JSON syntax | documentation validation |

Missing CI or Azure Functions Core Tools is a documented limit, never a passing result.
