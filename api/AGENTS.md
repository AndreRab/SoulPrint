# API local instructions

Read the root `AGENTS.md` and `docs/INDEX.md` first. Keep Functions triggers thin; SQLite belongs in `soulprint.store`, and matching/AI logic belongs in its own adapter. Run `uv run pytest` for behavior changes. Never place provider keys, Function connection strings, or durable production-storage claims in source.
