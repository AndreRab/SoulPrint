from __future__ import annotations

import json
from datetime import UTC, datetime

import azure.functions as func

from soulprint import ai, matching, store

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)


def response(payload: object, status: int = 200) -> func.HttpResponse:
    return func.HttpResponse(json.dumps(payload), status_code=status, mimetype="application/json")


def body(request: func.HttpRequest) -> dict:
    try:
        return request.get_json()
    except ValueError:
        return {}


@app.route(route="health", methods=["GET"])
def health(_: func.HttpRequest) -> func.HttpResponse:
    return response({"status": "ok", "service": "soulprint-api"})


@app.route(route="dashboard", methods=["GET"])
def dashboard(_: func.HttpRequest) -> func.HttpResponse:
    people = matching.ranked(store.records("person"))
    return response({"soulprint": {"traits": ["Independent", "Curious", "Direct communicator", "Long-term oriented", "High openness"], "summary": "You value deep conversations, meaningful experiences, and personal growth."}, "suggestions": people[:3], "plans": store.records("plan"), "activity": ["3 new people liked your Soulprint", "2 new messages"]})


@app.route(route="people", methods=["GET"])
def people(_: func.HttpRequest) -> func.HttpResponse:
    return response(matching.ranked(store.records("person")))


@app.route(route="people/{person_id}", methods=["GET"])
def person(request: func.HttpRequest) -> func.HttpResponse:
    item = store.record("person", request.route_params["person_id"])
    if item:
        item = {**item, "matching": matching.score(item["id"])}
        item["match"] = item["matching"]["score"]
    return response(item if item else {"error": "Person not found"}, 200 if item else 404)


@app.route(route="matching/{person_id}", methods=["GET"])
def matching_details(request: func.HttpRequest) -> func.HttpResponse:
    person_id = request.route_params["person_id"]
    if not store.record("person", person_id):
        return response({"error": "Person not found"}, 404)
    return response({"personId": person_id, "categoryWeights": matching.CATEGORY_WEIGHTS, "matching": matching.score(person_id)})


@app.route(route="conversations/{person_id}", methods=["GET"])
def conversation(request: func.HttpRequest) -> func.HttpResponse:
    item = store.record("conversation", request.route_params["person_id"])
    return response(item if item else {"error": "Conversation not found"}, 200 if item else 404)


@app.route(route="conversations/{person_id}/messages", methods=["POST"])
def message(request: func.HttpRequest) -> func.HttpResponse:
    person_id = request.route_params["person_id"]
    conversation = store.record("conversation", person_id)
    text = str(body(request).get("text", "")).strip()
    if not conversation or not text:
        return response({"error": "A message is required"}, 400)
    conversation["messages"].append({"id": f"m{len(conversation['messages']) + 1}", "from": "me", "text": text, "time": datetime.now(UTC).strftime("%I:%M %p").lstrip("0")})
    return response(store.save("conversation", person_id, conversation), 201)


@app.route(route="date-ideas", methods=["GET"])
def date_ideas(_: func.HttpRequest) -> func.HttpResponse:
    return response(store.records("place"))


@app.route(route="plans", methods=["GET", "POST"])
def plans(request: func.HttpRequest) -> func.HttpResponse:
    if request.method == "GET":
        return response(store.records("plan"))
    payload = body(request)
    plan_id = f"plan-{datetime.now(UTC).timestamp():.0f}"
    item = {"id": plan_id, "title": payload.get("title", "New plan"), "personId": payload.get("personId", "daniel"), "when": payload.get("when", "This Saturday · 4:00 PM"), "place": payload.get("place", "Berlin"), "status": "Planned", "image": payload.get("image", ""), "safety": bool(payload.get("safety", False))}
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
    return response(ai.suggestions(str(body(request).get("person", "Daniel"))))
