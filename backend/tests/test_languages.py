from conftest import auth

import app as backend
import parents


def test_child_can_save_urdu_and_arabic_letters(client, make_user):
    kid = make_user("kid@test.local")
    for category, item in (("urdu", "ب"), ("arabic", "ج")):
        r = client.put("/api/progress/mark_item_complete", headers=auth(kid["token"]),
                       json={"user_id": kid["user_id"], "category": category, "item": item})
        assert r.status_code == 200, r.get_json()
    summary = client.get(f"/api/progress/summary/{kid['user_id']}", headers=auth(kid["token"])).get_json()
    assert summary["completed_items"]["urdu"] == ["ب"]
    assert summary["completed_items"]["arabic"] == ["ج"]


def test_new_accounts_start_with_urdu_and_arabic_lists(client, make_user):
    kid = make_user("kid2@test.local")
    progress = backend.db.progress.find_one({"child_name": "Test User"})
    assert progress["completed_items"]["urdu"] == [] and progress["completed_items"]["arabic"] == []
    assert kid["user_type"] == "child"


def test_lessons_can_be_restricted(client, admin_token):
    school = client.post("/api/admin/schools", headers=auth(admin_token), json={
        "name": "Lang School", "principal_first_name": "P", "principal_email": "p@lang.local",
        "principal_password": "Principal-123"}).get_json()
    r = client.put("/api/school/lesson-restrictions", headers=auth(admin_token),
                   json={"school_id": school["school_id"], "restricted_lessons": ["urdu", "arabic", "nope"]})
    assert r.status_code == 200
    saved = backend.db.schools.find_one({"name": "Lang School"})["restricted_lessons"]
    assert sorted(saved) == ["arabic", "urdu"]


def test_quizzes_and_parent_labels_include_new_lessons():
    assert {"urdu", "arabic"} <= set(backend.QUIZ_CATEGORIES)
    assert {"urdu", "arabic"} <= set(parents.CATEGORY_LABELS)


def test_tts_uses_urdu_and_arabic_voices(client, monkeypatch):
    sent = []

    class Ok:
        status_code = 200
        content = b"mp3"
        text = ""

    monkeypatch.setattr(backend, "SPEECH_KEY", "key")
    monkeypatch.setattr(backend, "SPEECH_REGION", "eastus")
    monkeypatch.setattr(backend, "speechsdk", None)
    monkeypatch.setattr(backend.requests, "post", lambda url, headers, data, timeout: sent.append(data.decode()) or Ok())

    for lang, voice, xml_lang in (("ur", "ur-PK-UzmaNeural", "ur-PK"), ("ar", "ar-SA-ZariyahNeural", "ar-SA"),
                                  ("en", "en-US-JennyNeural", "en-US")):
        r = client.get(f"/api/tts?lang={lang}&text=hello")
        assert r.status_code == 200
        assert voice in sent[-1] and f'xml:lang="{xml_lang}"' in sent[-1]
    client.get("/api/tts?lang=ur&teacher=male&text=x")
    assert "ur-PK-AsadNeural" in sent[-1]
    # Unknown languages fall back to English; text is still escaped.
    client.get("/api/tts?lang=xx&text=<b>")
    assert "en-US-JennyNeural" in sent[-1] and "<b>" not in sent[-1]
