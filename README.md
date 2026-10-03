# SoulPrint

SoulPrint is a personality-first dating experience. It pairs a Vue single-page application with a Python Azure Functions API, seeded SQLite demo data, and an optional OpenAI-compatible AI provider.

## Local development

Prerequisites: Node 24+, npm, Python 3.12+, [uv](https://docs.astral.sh/uv/), and Azure Functions Core Tools (only for serving the API with `func start`).

```powershell
# terminal 1
cd api
uv sync
func start

# terminal 2
cd apps/web
npm.cmd install
npm.cmd run dev
```

The web application starts at `http://localhost:5173` and calls the local API at `http://localhost:7071/api`. Without an AI key, the API uses safe deterministic demo suggestions.

On Windows, `npm.cmd` avoids the PowerShell `npm.ps1` execution-policy error. If `func` is not recognized, install Azure Functions Core Tools v4 once with `npm.cmd install -g azure-functions-core-tools@4 --unsafe-perm true`, restart the terminal, and verify with `func --version`. You can still run all backend tests without Core Tools using `cd api; uv run pytest`.

## Structure

```text
.
|-- api/             Python Azure Functions API, SQLite data and tests
|-- apps/web/        Vue 3 application
|-- docs/            Architecture, UI and VibeRails adoption records
`-- .viberails/      Adopted-project configuration
```

## AI configuration

Copy `api/.env.example` to `api/.env` and select `groq`, `azure_foundry`, or a generic OpenAI-compatible base URL. Chat and embedding models can use separate endpoints. Never commit real keys. See [API setup](api/README.md).

## Quality gate

Run focused checks for the area changed:

```powershell
cd api; uv run pytest
cd apps/web; npm run typecheck
```

Full project verification and deployment workflows are documented in [the quality gate](docs/standards/quality-gate.md).

## Documentation

Start with [the documentation index](docs/INDEX.md) and [agent instructions](AGENTS.md).
Each runnable app has local instructions: [API README](api/README.md), [API agents](api/AGENTS.md), [web README](apps/web/README.md), and [web agents](apps/web/AGENTS.md).
