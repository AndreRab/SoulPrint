# Architecture

SoulPrint uses a minimal two-project architecture.

```text
Vue UI -> HTTP client -> Azure Functions routes -> application helpers -> SQLite / AI adapter
```

- `apps/web`: routes, components, presentation state, and API client. It never imports Python or database code.
- `api`: HTTP triggers, input validation, application helpers, SQLite repository, seeded fixtures, and an AI-provider adapter.
- The AI adapter is selected by environment variables. It can use Groq or Azure Foundry/OpenAI-compatible endpoints and falls back to deterministic demo content.
- SQLite is persistent for local development. On Azure Functions it is a demo seed/cache only; a real deployment needs managed shared storage.
