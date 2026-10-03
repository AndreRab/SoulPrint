from __future__ import annotations

import json
import os
from typing import Any

import httpx

DEMO_IDEAS = [
    {
        "title": "Italian food",
        "body": "You both enjoy good food. Compare favorite Italian dishes or cafés around Kreuzberg.",
    },
    {
        "title": "Nature & walks",
        "body": "Ask {person} about a favorite canal-side route or green space.",
    },
    {
        "title": "Meaningful conversations",
        "body": "Explore what makes a weekend feel memorable for each of you.",
    },
]


def _configuration() -> tuple[str, str, dict[str, str], str] | None:
    provider = os.getenv("AI_PROVIDER", "mock")
    if provider == "groq":
        base_url, api_key = (
            os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1"),
            os.getenv("GROQ_API_KEY"),
        )
        model, headers = (
            os.getenv("AI_MODEL") or os.getenv("GROQ_MODEL"),
            {"Authorization": f"Bearer {api_key}"},
        )
    elif provider == "azure_foundry":
        base_url = os.getenv("AZURE_FOUNDRY_ENDPOINT") or os.getenv("OPENAI_BASE_URL")
        api_key = os.getenv("AZURE_FOUNDRY_API_KEY") or os.getenv("OPENAI_API_KEY")
        model, headers = (
            os.getenv("AI_MODEL") or os.getenv("AZURE_FOUNDRY_MODEL"),
            {"api-key": str(api_key)},
        )
    else:
        base_url, api_key = os.getenv("OPENAI_BASE_URL"), os.getenv("OPENAI_API_KEY")
        model, headers = (
            os.getenv("AI_MODEL") or os.getenv("OPENAI_CHAT_MODEL"),
            {"Authorization": f"Bearer {api_key}"},
        )
        provider = "openai-compatible"
    if not all((base_url, api_key, model)):
        return None
    return str(base_url).rstrip("/"), str(model), headers, provider


def _demo(person_name: str, reason: str | None = None) -> dict[str, Any]:
    return {
        "mode": "demo",
        "disclaimer": reason or "Demo suggestions are shown until an AI provider is configured.",
        "person": person_name,
        "ideas": [
            {"title": idea["title"], "body": idea["body"].format(person=person_name)}
            for idea in DEMO_IDEAS
        ],
    }


def suggestions(person_name: str = "Daniel", context: str = "") -> dict[str, Any]:
    config = _configuration()
    if not config:
        return _demo(person_name)
    base_url, model, headers, provider = config
    prompt = (
        "Return JSON only with an 'ideas' array of exactly three objects. Each object needs a short 'title' and a warm, specific 'body'. Suggest safe conversation topics for a dating or friendship chat with "
        + person_name
        + ". Never infer sensitive traits. Context: "
        + context[:2000]
    )
    try:
        result = httpx.post(
            f"{base_url}/chat/completions",
            headers={**headers, "Content-Type": "application/json"},
            json={
                "model": model,
                "temperature": 0.5,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": "You are a concise, respectful social coach."},
                    {"role": "user", "content": prompt},
                ],
            },
            timeout=20.0,
        )
        result.raise_for_status()
        parsed = json.loads(result.json()["choices"][0]["message"]["content"])
        ideas = parsed["ideas"]
        if not isinstance(ideas, list) or len(ideas) != 3:
            raise ValueError("Provider returned an invalid idea count")
        cleaned = [
            {"title": str(item["title"])[:80], "body": str(item["body"])[:400]} for item in ideas
        ]
        return {
            "mode": f"{provider}:{model}",
            "disclaimer": None,
            "person": person_name,
            "ideas": cleaned,
        }
    except (httpx.HTTPError, KeyError, TypeError, ValueError, json.JSONDecodeError):
        return _demo(
            person_name, "The configured AI provider was unavailable; safe demo ideas are shown."
        )
