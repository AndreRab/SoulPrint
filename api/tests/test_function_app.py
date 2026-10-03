import json

import azure.functions as func

import function_app


def request(
    method: str, path: str, payload: dict | None = None, route_params: dict | None = None
) -> func.HttpRequest:
    return func.HttpRequest(
        method=method,
        url=f"http://localhost/api/{path}",
        headers={"Content-Type": "application/json"},
        params={},
        route_params=route_params or {},
        body=json.dumps(payload or {}).encode(),
    )


def payload(response: func.HttpResponse) -> object:
    return json.loads(response.get_body())


def test_routes_register_and_health_has_cors() -> None:
    names = {item.get_function_name() for item in function_app.app.get_functions()}
    assert {"health", "people", "message", "plans", "ai_suggestions"}.issubset(names)
    response = function_app.health(request("GET", "health"))
    assert response.status_code == 200
    assert response.headers["Access-Control-Allow-Origin"] == "*"


def test_profile_like_message_and_plan_flow(tmp_path, monkeypatch) -> None:
    monkeypatch.setenv("SOULPRINT_DB_PATH", str(tmp_path / "routes.db"))

    profile_response = function_app.profile(request("PUT", "profile", {"onboardingComplete": True}))
    assert payload(profile_response)["onboardingComplete"] is True

    like_response = function_app.like_person(
        request("PUT", "people/daniel/like", {"liked": True}, {"person_id": "daniel"})
    )
    assert payload(like_response) == {"personId": "daniel", "liked": True}

    message_response = function_app.message(
        request("POST", "conversations/daniel/messages", {"text": "Hello"}, {"person_id": "daniel"})
    )
    assert payload(message_response)["messages"][-1]["text"] == "Hello"

    plan_response = function_app.plans(
        request("POST", "plans", {"title": "Canal walk", "personId": "daniel"})
    )
    assert plan_response.status_code == 201
    assert payload(plan_response)["title"] == "Canal walk"
