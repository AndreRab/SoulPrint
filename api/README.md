# SoulPrint API

Python Azure Functions API with a seeded SQLite demo repository. Dependencies are managed by `uv`.

`pyproject.toml` and `uv.lock` are the local dependency source of truth. `requirements.txt` mirrors runtime dependencies because Azure Functions remote build consumes that format.

## Run locally

```powershell
uv sync
Copy-Item .env.example .env
# Create local.settings.json from local.settings.json.example when using Functions Core Tools.
func start
```

If `func` is not recognized on Windows, install Core Tools v4 with `npm.cmd install -g azure-functions-core-tools@4 --unsafe-perm true`, reopen PowerShell, and run `func --version`.

`func start` requires Azure Functions Core Tools. The source and tests can run without it:

```powershell
uv run pytest
uv run ruff check .
```

The API seeds `data/soulprint.db` on first request. Set `SOULPRINT_DB_PATH` to place the local database elsewhere.

## Matching model

Soulprint stores values, relationship goals, communication, boundaries, interests, lifestyle, and social energy as separate semantic categories. Matching embeds each category, applies its configured weight, combines the vectors, and ranks candidates by cosine distance. The demo has a stable local embedding fallback for offline testing; production can replace that adapter with a Foundry/Groq-compatible embeddings endpoint without changing the weighted-vector contract.

## AI providers

Use `AI_PROVIDER=groq` with `GROQ_API_KEY`, or `AI_PROVIDER=azure_foundry` with `AZURE_FOUNDRY_ENDPOINT` and `AZURE_FOUNDRY_API_KEY`. `AI_MODEL` selects the chat model. Generic OpenAI-compatible chat endpoints use `OPENAI_BASE_URL`, `OPENAI_API_KEY`, and `OPENAI_CHAT_MODEL`.

Embeddings use `EMBEDDING_BASE_URL`, `EMBEDDING_API_KEY`, and `EMBEDDING_MODEL`. This makes it possible to use Groq for chat and a Foundry deployment for embeddings. Keys are server-only. Missing or failed providers use curated suggestions and deterministic local embeddings so the UI remains runnable.

## HTTP surface

The Function App exposes `/api/health`, `/api/dashboard`, `/api/profile`, `/api/soulprint`, `/api/people`, `/api/people/{id}`, `/api/people/{id}/like`, `/api/matching/{id}`, `/api/conversations/{id}`, `/api/conversations/{id}/messages`, `/api/date-ideas`, `/api/plans`, `/api/settings`, and `/api/ai/suggestions`.

## Azure Functions limitation

The included SQLite database is for local use and read-only/demo seeding in a Function App. Azure Function disk storage is not a durable shared database; use Azure SQL or Cosmos DB for production writes.
