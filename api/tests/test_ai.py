import json

import httpx

from soulprint import ai


def test_ai_uses_demo_without_configuration(monkeypatch) -> None:
    monkeypatch.setenv("AI_PROVIDER", "mock")
    monkeypatch.delenv("OPENAI_BASE_URL", raising=False)
    result = ai.suggestions("Daniel")
    assert result["mode"] == "demo"
    assert len(result["ideas"]) == 3


def test_ai_parses_openai_compatible_json(monkeypatch) -> None:
    monkeypatch.setenv("AI_PROVIDER", "groq")
    monkeypatch.setenv("GROQ_API_KEY", "test-key")
    monkeypatch.setenv("AI_MODEL", "test-model")

    def fake_post(*args, **kwargs):
        request = httpx.Request("POST", args[0])
        content = json.dumps(
            {
                "ideas": [
                    {"title": "One", "body": "A"},
                    {"title": "Two", "body": "B"},
                    {"title": "Three", "body": "C"},
                ]
            }
        )
        return httpx.Response(
            200, request=request, json={"choices": [{"message": {"content": content}}]}
        )

    monkeypatch.setattr(httpx, "post", fake_post)
    result = ai.suggestions("Daniel", "shared nature interests")
    assert result["mode"] == "groq:test-model"
    assert result["ideas"][0]["title"] == "One"
