import os
from pathlib import Path

from soulprint import matching, store


def test_seeded_people_and_round_trip_message(tmp_path: Path) -> None:
    os.environ["SOULPRINT_DB_PATH"] = str(tmp_path / "test.db")
    people = store.records("person")
    assert len(people) == 4
    assert store.record("person", "daniel")["match"] == 88


def test_saved_settings_persist(tmp_path: Path) -> None:
    os.environ["SOULPRINT_DB_PATH"] = str(tmp_path / "settings.db")
    saved = store.save("settings", "me", {"theme": "light"})
    assert saved["theme"] == "light"
    assert store.record("settings", "me") == {"theme": "light"}


def test_weighted_vector_matching_ranks_by_cosine_distance() -> None:
    results = matching.ranked(store.PEOPLE)
    assert results[0]["id"] == "daniel"
    assert results[0]["matching"]["distance"] < results[-1]["matching"]["distance"]
