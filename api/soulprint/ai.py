from __future__ import annotations

import os
from typing import Any


def suggestions(person_name: str = "Daniel") -> dict[str, Any]:
    """Return safe demo output until a configured OpenAI-compatible provider is available."""
    provider = os.getenv("AI_PROVIDER", "mock")
    configured = provider == "groq" and os.getenv("GROQ_API_KEY") or provider == "azure_foundry" and os.getenv("AZURE_FOUNDRY_API_KEY")
    return {
        "mode": "provider-configured" if configured else "demo",
        "disclaimer": None if configured else "Demo suggestions are shown until an AI provider is configured.",
        "person": person_name,
        "ideas": [
            {"title": "Italian food", "body": "You both enjoy good food. Compare favorite Italian dishes or cafés around Kreuzberg."},
            {"title": "Nature & walks", "body": f"Ask {person_name} about a favorite canal-side route or green space."},
            {"title": "Meaningful conversations", "body": "Explore what makes a weekend feel memorable for each of you."},
        ],
    }
