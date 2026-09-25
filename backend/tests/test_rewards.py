from datetime import datetime, timedelta

import gtts
from conftest import auth

import app as backend
import parents
import rewards

NOW = datetime(2026, 9, 25, 10, 0)  # 15:00 in Pakistan


def days(*offsets):
    today = rewards.pk_today(NOW)
    return [(today - timedelta(days=o)).isoformat() for o in offsets]


def test_streak_counts_days_in_a_row():
    info = rewards.streak_info({"active_days": days(0, 1, 2, 5, 6)}, NOW)
    assert info["current"] == 3 and info["longest"] == 3 and info["today_done"]
    assert info["last_7_days"] == [True, True, False, False, True, True, True]


def test_streak_survives_until_end_of_next_day_then_resets():
    assert rewards.streak_info({"active_days": days(1, 2)}, NOW)["current"] == 2
    assert rewards.streak_info({"active_days": days(2, 3)}, NOW)["current"] == 0
    assert rewards.streak_info({"active_days": days(2, 3)}, NOW)["longest"] == 2


def test_pakistan_date_is_used():
    late_utc = datetime(2026, 9, 25, 20, 0)  # already 26 Sep in Pakistan
    assert rewards.pk_today(late_utc).isoformat() == "2026-09-26"


def test_old_accounts_count_their_last_activity():
    info = rewards.streak_info({"last_activity": (NOW - timedelta(hours=1)).isoformat()}, NOW)
    assert info["current"] == 1


def learn(client, kid, category, item):
    r = client.put("/api/progress/mark_item_complete", headers=auth(kid["token"]),
                   json={"user_id": kid["user_id"], "category": category, "item": item})
    assert r.status_code == 200


def test_learning_gives_stickers_badges_and_streak(client, make_user):
    kid = make_user("stars@test.local")
    for letter in "ABCDEFGHIJ":
        learn(client, kid, "abc", letter)
    data = client.get(f"/api/rewards/{kid['user_id']}", headers=auth(kid["token"])).get_json()
    assert data["stickers"] == 10
    assert data["streak"]["current"] == 1 and data["streak"]["today_done"]
    earned = {b["key"] for b in data["badges"] if b["earned"]}
    assert {"first_sticker", "stickers_10", "abc_star"} <= earned
    assert "stickers_25" not in earned and "streak_3" not in earned
    number_star = next(b for b in data["badges"] if b["key"] == "number_star")
    assert number_star["progress"] == 0 and number_star["goal"] == 10


def test_rewards_are_private(client, make_user):
    a = make_user("a@test.local")
    b = make_user("b@test.local")
    assert client.get(f"/api/rewards/{b['user_id']}", headers=auth(a["token"])).status_code == 404
    assert client.get(f"/api/rewards/{a['user_id']}").status_code == 401


def test_parent_report_includes_streak_and_badges(client, make_user):
    kid = make_user("kid@test.local")
    learn(client, kid, "animals", "farm:cow")
    child = backend.db.users.find_one({"username": "kid@test.local"})
    report = parents.child_report(backend.db, child)
    assert report["streak"] == 1
    assert any(b["title"] == "First Sticker" for b in report["badges"])


def test_urdu_voice_falls_back_to_free_google_voice(client, monkeypatch):
    spoken = []

    class FakeTTS:
        def __init__(self, text, lang, slow):
            spoken.append((text, lang))

        def write_to_fp(self, fp):
            fp.write(b"mp3-bytes")

    monkeypatch.setattr(gtts, "gTTS", FakeTTS)
    monkeypatch.setattr(backend, "SPEECH_KEY", None)
    r = client.get("/api/tts?lang=ur&text=بے سے بلی")
    assert r.status_code == 200 and r.data == b"mp3-bytes"
    assert spoken[-1] == ("بے سے بلی", "ur")

    # Azure configured but failing -> also falls back.
    class Bad:
        status_code = 401
        text = "bad key"

    monkeypatch.setattr(backend, "SPEECH_KEY", "key")
    monkeypatch.setattr(backend, "SPEECH_REGION", "eastus")
    monkeypatch.setattr(backend, "speechsdk", None)
    monkeypatch.setattr(backend.requests, "post", lambda *a, **k: Bad())
    r = client.get("/api/tts?lang=ar&text=بَاء")
    assert r.status_code == 200 and spoken[-1] == ("بَاء", "ar")
