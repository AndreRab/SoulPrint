"""Weighted category embeddings and cosine-distance matching."""

from __future__ import annotations

import hashlib
import math
import os
from collections.abc import Iterable
from typing import Any

import httpx

from soulprint import store

CATEGORY_WEIGHTS = {
    "values": 1.35,
    "relationships": 1.30,
    "communication": 1.10,
    "boundaries": 1.15,
    "interests": 0.80,
    "lifestyle": 0.75,
    "social_energy": 0.65,
}


def _normalize(values: Iterable[float]) -> list[float]:
    vector = list(values)
    magnitude = math.sqrt(sum(value * value for value in vector)) or 1.0
    return [value / magnitude for value in vector]


def _fallback_embedding(text: str, dimensions: int = 48) -> list[float]:
    values = [0.0] * dimensions
    for token in text.lower().split():
        digest = hashlib.sha512(token.encode()).digest()
        for index in range(dimensions):
            values[index] += digest[index] / 127.5 - 1.0
    return _normalize(values)


def _provider_configuration() -> tuple[str, str, str, dict[str, str]] | None:
    provider = os.getenv("AI_PROVIDER", "mock")
    base_url = os.getenv("EMBEDDING_BASE_URL") or os.getenv("OPENAI_BASE_URL")
    api_key = os.getenv("EMBEDDING_API_KEY") or os.getenv("OPENAI_API_KEY")
    model = os.getenv("EMBEDDING_MODEL") or os.getenv("OPENAI_EMBEDDING_MODEL")
    if provider == "azure_foundry":
        base_url = base_url or os.getenv("AZURE_FOUNDRY_ENDPOINT")
        api_key = api_key or os.getenv("AZURE_FOUNDRY_API_KEY")
    if not all((base_url, api_key, model)):
        return None
    header = "api-key" if provider == "azure_foundry" else "Authorization"
    token = str(api_key) if header == "api-key" else f"Bearer {api_key}"
    return str(base_url).rstrip("/"), str(model), provider, {header: token}


def embed(text: str) -> tuple[list[float], str]:
    config = _provider_configuration()
    if not config:
        return _fallback_embedding(text), "deterministic-demo-embedding"
    base_url, model, provider, headers = config
    try:
        result = httpx.post(
            f"{base_url}/embeddings",
            headers={**headers, "Content-Type": "application/json"},
            json={"model": model, "input": text},
            timeout=12.0,
        )
        result.raise_for_status()
        vector = result.json()["data"][0]["embedding"]
        return _normalize(float(value) for value in vector), f"{provider}:{model}"
    except (httpx.HTTPError, KeyError, TypeError, ValueError):
        return _fallback_embedding(text), "deterministic-demo-embedding"


def weighted_vector(categories: dict[str, str]) -> tuple[list[float], str]:
    """Embed each category, multiply by its weight, add, and normalize."""
    combined: list[float] = []
    modes: set[str] = set()
    for category, weight in CATEGORY_WEIGHTS.items():
        category_vector, mode = embed(categories.get(category, ""))
        modes.add(mode)
        if not combined:
            combined = [0.0] * len(category_vector)
        if len(category_vector) != len(combined):
            category_vector = _fallback_embedding(categories.get(category, ""), len(combined))
            modes.add("deterministic-demo-embedding")
        combined = [current + weight * value for current, value in zip(combined, category_vector)]
    mode = next(iter(modes)) if len(modes) == 1 else "mixed-fallback"
    return _normalize(combined), mode


def cosine_distance(first: Iterable[float], second: Iterable[float]) -> float:
    left, right = _normalize(first), _normalize(second)
    if len(left) != len(right):
        raise ValueError("Vectors must have equal dimensions")
    return max(0.0, min(2.0, 1.0 - sum(a * b for a, b in zip(left, right, strict=True))))


def _categories(person_id: str) -> dict[str, str]:
    item = store.record("soulprint", person_id)
    if not item:
        raise KeyError(f"Soulprint not found: {person_id}")
    return item["categories"]


def score(person_id: str) -> dict[str, float | str]:
    me, my_mode = weighted_vector(_categories("me"))
    person, person_mode = weighted_vector(_categories(person_id))
    distance = cosine_distance(me, person)
    similarity = max(0.0, 1.0 - distance)
    mode = my_mode if my_mode == person_mode else "mixed-fallback"
    return {
        "distance": round(distance, 4),
        "similarity": round(similarity, 4),
        "score": round(similarity * 100),
        "mode": mode,
    }


def ranked(people: list[dict[str, Any]]) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    for person in people:
        details = score(person["id"])
        result.append({**person, "matching": details, "match": details["score"]})
    return sorted(result, key=lambda item: item["matching"]["distance"])
