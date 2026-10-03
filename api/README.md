# SoulPrint API

Python Azure Functions API with a seeded SQLite demo repository. Dependencies are managed by `uv`.

## Run locally

```powershell
uv sync
Copy-Item .env.example .env
# Create local.settings.json from local.settings.json.example when using Functions Core Tools.
func start
```

`func start` requires Azure Functions Core Tools. The source and tests can run without it:

```powershell
uv run pytest
uv run ruff check .
```

The API seeds `data/soulprint.db` on first request. Set `SOULPRINT_DB_PATH` to place the local database elsewhere.

## Matching model

Soulprint stores values, relationship goals, communication, boundaries, interests, lifestyle, and social energy as separate semantic categories. Matching embeds each category, applies its configured weight, combines the vectors, and ranks candidates by cosine distance. The demo has a stable local embedding fallback for offline testing; production can replace that adapter with a Foundry/Groq-compatible embeddings endpoint without changing the weighted-vector contract.

## AI providers

Use `AI_PROVIDER=groq` with `GROQ_API_KEY`, or `AI_PROVIDER=azure_foundry` with `AZURE_FOUNDRY_ENDPOINT` and `AZURE_FOUNDRY_API_KEY`. Keys are server-only. A missing or failed provider uses curated demo suggestions so the UI always remains runnable.

## Azure Functions limitation

The included SQLite database is for local use and read-only/demo seeding in a Function App. Azure Function disk storage is not a durable shared database; use Azure SQL or Cosmos DB for production writes.
