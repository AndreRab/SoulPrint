# VibeRails adoption

| Field | Value |
|---|---|
| Source | `https://github.com/JakubParol/VibeRails` |
| Source commit | `45ce4050cae91ba3ae8f732b22353f19440fbb5b` |
| Pack version | `0.5.2` |
| Target | SoulPrint workspace |

## Effective configuration

| Field | Value |
|---|---|
| version | `1` |
| initializedFrom | `light` |
| architecture | `minimal` |
| verification | `local-focused` |
| documentation | `essential` |
| workflow | `local` |
| review | `adaptive` |
| modelRouting | `inherit` |

## Profiles and readiness

| Area | Selection | Readiness |
|---|---|---|
| Runtime | Codex | Available. |
| Stack | Vue 3 + Python Azure Functions | Stack-profile exception; supplied profiles cover Next.js/FastAPI, not Vue/Functions. |
| Work tracking | none | Conversation-driven work. |
| Code hosting | GitHub | Intended; no target remote is currently configured. |
| Script platform | PowerShell | Current local platform. |
| Skills | none | VibeRails standards are adopted; optional skills were not installed. |
| Self-improvement | summary only | No ticket sink selected. |

## Preflight

The target was an empty Git repository on `main`, with no commit, no source files, no documentation, no CI, and no usable remote. `uv`, Node and npm are available; Azure Functions Core Tools is missing locally.

## Constraints

- Frontend deployment and Function App provisioning require GitHub/Azure credentials and configuration outside this repository.
- SQLite is a local/demo store only for Azure Functions. It must be replaced with shared managed storage for production writes.
- The adopted UI screens are implemented as a demo; real identity, moderation, emergency and location services are not claimed.
