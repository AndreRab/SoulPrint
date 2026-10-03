from __future__ import annotations

import json
import os
import sqlite3
from pathlib import Path
from typing import Any

PEOPLE = [
    {
        "id": "daniel",
        "name": "Daniel",
        "age": 31,
        "city": "Berlin",
        "distance": "3 km",
        "job": "Product Designer",
        "match": 88,
        "bio": "Thoughtful, curious, and happiest near a good meal or a long walk.",
        "image": "https://i.pravatar.cc/800?img=12",
        "tags": ["Nature", "Good food", "Meaningful relationships", "Long-term oriented"],
        "reasons": [
            "You both value deep conversations and personal growth.",
            "You share a long-term outlook and respect independence.",
            "You both enjoy nature, good food, and meaningful experiences.",
            "Your communication styles complement each other.",
        ],
    },
    {
        "id": "emma",
        "name": "Emma",
        "age": 28,
        "city": "Berlin",
        "distance": "5 km",
        "job": "Curator",
        "match": 93,
        "bio": "Art lover with a calm, warm way of making every day feel considered.",
        "image": "https://i.pravatar.cc/800?img=47",
        "tags": ["Deep conversations", "Travel", "Art", "Mental health"],
        "reasons": ["You make room for curiosity.", "You both enjoy intentional time together."],
    },
    {
        "id": "sophie",
        "name": "Sophie",
        "age": 26,
        "city": "Berlin",
        "distance": "7 km",
        "job": "Photographer",
        "match": 87,
        "bio": "A quietly adventurous photographer looking for shared stories.",
        "image": "https://i.pravatar.cc/800?img=44",
        "tags": ["Art", "Personal growth", "Spontaneous plans", "Nature"],
        "reasons": ["You both look for meaning in small moments.", "Your energy balances well."],
    },
    {
        "id": "james",
        "name": "James",
        "age": 30,
        "city": "Berlin",
        "distance": "4 km",
        "job": "Engineer",
        "match": 86,
        "bio": "A builder, hiker and attentive listener with a playful side.",
        "image": "https://i.pravatar.cc/800?img=11",
        "tags": ["Tech", "Hiking", "Meaningful relationships", "Adventure"],
        "reasons": ["You share a practical curiosity.", "Your pacing is mutually comfortable."],
    },
]

PLACES = [
    {"id": "cafe", "title": "Café & Walk in Kreuzberg", "description": "A relaxed first date with good food and an easy canal-side walk.", "image": "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=900&q=80", "fit": 92, "duration": "1.5–2 hours", "kind": "Casual"},
    {"id": "walk", "title": "Sunset Walk by the Canal", "description": "Nature, fresh air, and space for a real conversation.", "image": "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80", "fit": 89, "duration": "1–1.5 hours", "kind": "Outdoor"},
    {"id": "gallery", "title": "Contemporary Art & Coffee", "description": "A shared curiosity with a relaxed place to talk afterward.", "image": "https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=900&q=80", "fit": 86, "duration": "About 2 hours", "kind": "Culture"},
]


def _db_path() -> Path:
    configured = os.getenv("SOULPRINT_DB_PATH")
    if configured:
        return Path(configured)
    return Path(__file__).resolve().parents[1] / "data" / "soulprint.db"


def connection() -> sqlite3.Connection:
    path = _db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.execute("CREATE TABLE IF NOT EXISTS records (kind TEXT NOT NULL, record_id TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY(kind, record_id))")
    if not conn.execute("SELECT 1 FROM records LIMIT 1").fetchone():
        _seed(conn)
    return conn


def _put(conn: sqlite3.Connection, kind: str, record_id: str, payload: dict[str, Any]) -> None:
    conn.execute("INSERT OR REPLACE INTO records(kind, record_id, payload) VALUES (?, ?, ?)", (kind, record_id, json.dumps(payload)))


def _seed(conn: sqlite3.Connection) -> None:
    for person in PEOPLE:
        _put(conn, "person", person["id"], person)
    for place in PLACES:
        _put(conn, "place", place["id"], place)
    _put(conn, "settings", "me", {"goal": "Both", "ageRange": [25, 40], "distance": 25, "messages": True, "checkins": True, "recommendations": False, "theme": "dark"})
    _put(conn, "plan", "today", {"id": "today", "title": "Café & Walk in Kreuzberg", "personId": "daniel", "when": "Today · 4:00 PM", "place": "Kreuzberg canal", "status": "Confirmed", "image": PLACES[0]["image"], "safety": True})
    _put(conn, "plan", "upcoming", {"id": "upcoming", "title": "Museum & Coffee", "personId": "sophie", "when": "Sat, May 17 · 3:00 PM", "place": "Contemporary Art Museum", "status": "Planned", "image": PLACES[1]["image"], "safety": False})
    _put(conn, "conversation", "daniel", {"personId": "daniel", "messages": [
        {"id": "m1", "from": "daniel", "text": "Hey! I saw you enjoy nature and good food. Is there a place in Berlin you always go back to?", "time": "10:14 AM"},
        {"id": "m2", "from": "me", "text": "There’s a little Italian place near Kreuzberg I love. I usually pair it with a walk along the canal.", "time": "10:16 AM"},
        {"id": "m3", "from": "daniel", "text": "That sounds great. I’m always up for a walk by the water. Want to try it together this weekend?", "time": "10:18 AM"},
        {"id": "m4", "from": "me", "text": "I’d like that! Let’s plan something relaxed.", "time": "10:19 AM"},
    ]})
    conn.commit()


def records(kind: str) -> list[dict[str, Any]]:
    with connection() as conn:
        rows = conn.execute("SELECT payload FROM records WHERE kind = ?", (kind,)).fetchall()
    return [json.loads(row["payload"]) for row in rows]


def record(kind: str, record_id: str) -> dict[str, Any] | None:
    with connection() as conn:
        row = conn.execute("SELECT payload FROM records WHERE kind = ? AND record_id = ?", (kind, record_id)).fetchone()
    return json.loads(row["payload"]) if row else None


def save(kind: str, record_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    with connection() as conn:
        _put(conn, kind, record_id, payload)
        conn.commit()
    return payload
