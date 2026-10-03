from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

import azure.functions as func
from dotenv import load_dotenv

from soulprint import ai, matching, store

load_dotenv(Path(__file__).with_name(".env"))

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
}


def response(payload: object, status: int = 200) -> func.HttpResponse:
    return func.HttpResponse(
        json.dumps(payload, ensure_ascii=False),
        status_code=status,
        mimetype="application/json",
        headers=CORS_HEADERS,
    )


def body(request: func.HttpRequest) -> dict:
    try:
        payload = request.get_json()
        return payload if isinstance(payload, dict) else {}
    except ValueError:
        return {}


@app.route(route="{*path}", methods=["OPTIONS"])
def cors_preflight(_: func.HttpRequest) -> func.HttpResponse:
    return func.HttpResponse(status_code=204, headers=CORS_HEADERS)


@app.route(route="health", methods=["GET"])
def health(_: func.HttpRequest) -> func.HttpResponse:
    return response({"status": "ok", "service": "soulprint-api", "storage": "sqlite-demo"})


@app.route(route="dashboard", methods=["GET"])
def dashboard(_: func.HttpRequest) -> func.HttpResponse:
    people = matching.ranked(store.records("person"))
    profile = store.record("profile", "me") or {}
    return response(
        {
            "soulprint": {
                "traits": profile.get("traits", []),
                "summary": profile.get("summary", ""),
            },
            "suggestions": people[:3],
            "plans": store.records("plan"),
            "activity": ["3 new people liked your Soulprint", "2 new messages"],
        }
    )


@app.route(route="profile", methods=["GET", "PUT"])
def profile(request: func.HttpRequest) -> func.HttpResponse:
    current = store.record("profile", "me") or {}
    if request.method == "GET":
        return response(current)
    payload = body(request)
    answers = payload.get("answers")
    if answers is not None and not isinstance(answers, list):
        return response({"error": "answers must be a list"}, 400)
    current.update(payload)
    return response(store.save("profile", "me", current))


@app.route(route="soulprint", methods=["GET", "PUT"])
def soulprint(request: func.HttpRequest) -> func.HttpResponse:
    current = store.record("soulprint", "me") or {"id": "me", "categories": {}}
    if request.method == "GET":
        return response(current)
    categories = body(request).get("categories")
    if not isinstance(categories, dict):
        return response({"error": "categories must be an object"}, 400)
    allowed = set(matching.CATEGORY_WEIGHTS)
    current["categories"] = {
        key: str(value)[:1000] for key, value in categories.items() if key in allowed
    }
    return response(store.save("soulprint", "me", current))


@app.route(route="people", methods=["GET"])
def people(_: func.HttpRequest) -> func.HttpResponse:
    liked = set((store.record("likes", "me") or {}).get("personIds", []))
    return response(
        [
            {**item, "liked": item["id"] in liked}
            for item in matching.ranked(store.records("person"))
        ]
    )


@app.route(route="people/{person_id}", methods=["GET"])
def person(request: func.HttpRequest) -> func.HttpResponse:
    person_id = request.route_params["person_id"]
    item = store.record("person", person_id)
    if not item:
        return response({"error": "Person not found"}, 404)
    details = matching.score(person_id)
    liked = person_id in (store.record("likes", "me") or {}).get("personIds", [])
    return response({**item, "matching": details, "match": details["score"], "liked": liked})


@app.route(route="people/{person_id}/like", methods=["PUT"])
def like_person(request: func.HttpRequest) -> func.HttpResponse:
    person_id = request.route_params["person_id"]
    if not store.record("person", person_id):
        return response({"error": "Person not found"}, 404)
    likes = store.record("likes", "me") or {"personIds": []}
    selected = bool(body(request).get("liked", True))
    person_ids = set(likes.get("personIds", []))
    person_ids.add(person_id) if selected else person_ids.discard(person_id)
    likes["personIds"] = sorted(person_ids)
    store.save("likes", "me", likes)
    return response({"personId": person_id, "liked": selected})


@app.route(route="matching/{person_id}", methods=["GET"])
def matching_details(request: func.HttpRequest) -> func.HttpResponse:
    person_id = request.route_params["person_id"]
    if not store.record("person", person_id):
        return response({"error": "Person not found"}, 404)
    return response(
        {
            "personId": person_id,
            "categoryWeights": matching.CATEGORY_WEIGHTS,
            "matching": matching.score(person_id),
        }
    )


@app.route(route="conversations/{person_id}", methods=["GET"])
def conversation(request: func.HttpRequest) -> func.HttpResponse:
    item = store.record("conversation", request.route_params["person_id"])
    return response(item if item else {"error": "Conversation not found"}, 200 if item else 404)


@app.route(route="conversations/{person_id}/messages", methods=["POST"])
def message(request: func.HttpRequest) -> func.HttpResponse:
    person_id = request.route_params["person_id"]
    conversation_item = store.record("conversation", person_id)
    text = str(body(request).get("text", "")).strip()[:2000]
    if not conversation_item or not text:
        return response({"error": "A message is required"}, 400)
    conversation_item["messages"].append(
        {
            "id": str(uuid4()),
            "from": "me",
            "text": text,
            "time": datetime.now(UTC).strftime("%I:%M %p").lstrip("0"),
        }
    )
    return response(store.save("conversation", person_id, conversation_item), 201)


@app.route(route="date-ideas", methods=["GET"])
def date_ideas(_: func.HttpRequest) -> func.HttpResponse:
    return response(store.records("place"))


@app.route(route="plans", methods=["GET", "POST"])
def plans(request: func.HttpRequest) -> func.HttpResponse:
    if request.method == "GET":
        return response(store.records("plan"))
    payload = body(request)
    plan_id = f"plan-{uuid4().hex[:10]}"
    item = {
        "id": plan_id,
        "title": str(payload.get("title", "New plan"))[:120],
        "personId": str(payload.get("personId", "daniel")),
        "when": str(payload.get("when", "This Saturday · 4:00 PM"))[:120],
        "place": str(payload.get("place", "Berlin"))[:160],
        "status": "Planned",
        "image": str(payload.get("image", "")),
        "safety": bool(payload.get("safety", False)),
    }
    return response(store.save("plan", plan_id, item), 201)


@app.route(route="settings", methods=["GET", "PUT"])
def settings(request: func.HttpRequest) -> func.HttpResponse:
    current = store.record("settings", "me") or {}
    if request.method == "GET":
        return response(current)
    current.update(body(request))
    return response(store.save("settings", "me", current))


@app.route(route="ai/suggestions", methods=["POST"])
def ai_suggestions(request: func.HttpRequest) -> func.HttpResponse:
    payload = body(request)
    return response(
        ai.suggestions(str(payload.get("person", "Daniel"))[:80], str(payload.get("context", "")))
    )
