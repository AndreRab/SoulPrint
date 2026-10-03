"""Weighted Soulprint vector matching with a deterministic offline fallback."""
from __future__ import annotations

import hashlib
import math
from collections.abc import Iterable

CATEGORY_WEIGHTS = {"values": 1.35, "relationships": 1.3, "communication": 1.1, "boundaries": 1.15, "interests": .8, "lifestyle": .75, "social_energy": .65}
SOULPRINTS = {
    "me": {"values":"curiosity honesty personal growth independence","relationships":"long term partnership meaningful connection emotional safety","communication":"thoughtful direct conversation active listening","boundaries":"respectful pace consent emotional space","interests":"reading coffee travel photography","lifestyle":"city walks cultural weekends intentional routines","social_energy":"balanced warm quiet time"},
    "daniel": {"values":"curiosity honesty personal growth independence","relationships":"long term partnership meaningful connection emotional safety","communication":"direct thoughtful conversation listening","boundaries":"respectful pace clear communication personal space","interests":"nature good food walks design","lifestyle":"city walks calm weekends intentional routines","social_energy":"balanced warm quiet time"},
    "emma": {"values":"openness empathy personal growth care","relationships":"intentional connection trust long term possibilities","communication":"warm reflective conversations listening","boundaries":"gentle pace mutual respect","interests":"art travel museums mental health","lifestyle":"cultural weekends coffee thoughtful routines","social_energy":"calm socially curious"},
    "sophie": {"values":"creativity curiosity freedom kindness","relationships":"authentic connection shared experiences","communication":"open playful conversations","boundaries":"independence emotional honesty","interests":"photography art nature spontaneous plans","lifestyle":"adventurous city life outdoors","social_energy":"expressive adaptable"},
    "james": {"values":"reliability curiosity care growth","relationships":"meaningful partnership steady connection","communication":"clear practical kind communication","boundaries":"consent respect predictable pace","interests":"technology hiking adventure food","lifestyle":"active weekends builder routines","social_energy":"grounded outgoing small groups"},
}

def _fallback_embedding(text: str, dimensions: int = 24) -> list[float]:
    values = [0.0] * dimensions
    for token in text.lower().split():
        digest = hashlib.sha256(token.encode()).digest()
        for index in range(dimensions): values[index] += digest[index] / 127.5 - 1
    size = math.sqrt(sum(value * value for value in values)) or 1
    return [value / size for value in values]

def weighted_vector(categories: dict[str, str]) -> list[float]:
    values = [value * CATEGORY_WEIGHTS[name] for name in CATEGORY_WEIGHTS for value in _fallback_embedding(categories.get(name, ""))]
    size = math.sqrt(sum(value * value for value in values)) or 1
    return [value / size for value in values]

def cosine_distance(first: Iterable[float], second: Iterable[float]) -> float:
    left, right = list(first), list(second)
    return 1 - sum(a*b for a,b in zip(left, right, strict=True)) / ((math.sqrt(sum(a*a for a in left)) or 1) * (math.sqrt(sum(b*b for b in right)) or 1))

def score(person_id: str) -> dict[str, float | str]:
    distance = max(0.0, cosine_distance(weighted_vector(SOULPRINTS["me"]), weighted_vector(SOULPRINTS[person_id])))
    similarity = 1 - distance
    return {"distance": round(distance,4), "similarity": round(similarity,4), "score": round(similarity*100), "mode":"deterministic-demo-embedding"}

def ranked(people: list[dict]) -> list[dict]:
    result = []
    for person in people:
        item = {**person, "matching": score(person["id"])}; item["match"] = item["matching"]["score"]; result.append(item)
    return sorted(result, key=lambda item: item["matching"]["distance"])
