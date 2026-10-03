# VibeRails adoption

SoulPrint adopts VibeRails pack `0.5.2` from immutable commit `45ce4050cae91ba3ae8f732b22353f19440fbb5b` at `https://github.com/JakubParol/VibeRails`.

## Configuration And Instruction Baseline

| Field | Value |
|---|---|
| version | 1 |
| initializedFrom | light |
| architecture | minimal |
| verification | local-focused |
| documentation | essential |
| workflow | local |
| review | adaptive |
| modelRouting | inherit |

## Delivery contract

| Field | Adopted value |
|---|---|
| Runtime | `codex` |
| Stack | `mixed` with per-root `documented-exception` profiles for Vue/Vite and Python Azure Functions |
| Work tracking | `none` because work arrives through conversation |
| Code hosting | `github-code-hosting` for `AndreRab/SoulPrint` |
| Script platform | `powershell` |
| Default and PR target branches | `main` |
| Branch pattern | `codex/feature-name` |
| Draft pull requests | `true` |
| Allowed PR writes | `create-pr`, `edit-description` |
| Review publishing | `local-only` |
| Agent skills | `none` selected |
| Self-improvement | `false`; tracker `none`; label `viberails-self-improve` is not active |
| Canonical quality gate | Run uv run pytest for API changes, npm run typecheck and npm run build for web changes, and the adoption audit for documentation changes. |

## Readiness and constraints

- The GitHub remote is configured. GitHub authentication and Azure deployment credentials remain environment-owned.
- Azure Functions Core Tools is not installed on the current workstation, so route registration and Python behavior are verified without `func start`.
- SQLite is local/demo persistence only. A production multi-user deployment requires shared managed storage.
- Identity verification, emergency contacts, emergency actions, and live-location sharing remain clearly labeled demo experiences until reviewed providers exist.
- Groq, Azure Foundry, and generic OpenAI-compatible chat/embedding endpoints are selected through server-side environment variables; no provider key enters the Vue bundle.
