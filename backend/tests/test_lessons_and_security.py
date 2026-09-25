from conftest import auth


def test_flags_progress_saved(client, make_user):
    kid = make_user("kid@test.local")
    r = client.put("/api/progress/mark_item_complete", headers=auth(kid["token"]), json={"user_id": kid["user_id"], "category": "flags", "item": "Pakistan"})
    assert r.status_code == 200
    r = client.get(f"/api/progress/summary/{kid['user_id']}", headers=auth(kid["token"]))
    assert "Pakistan" in r.get_json()["completed_items"]["flags"]


def test_child_cannot_write_other_progress(client, make_user):
    kid = make_user("kid@test.local")
    other = make_user("kid2@test.local")
    r = client.put("/api/progress/mark_item_complete", headers=auth(kid["token"]), json={"user_id": other["user_id"], "category": "flags", "item": "Japan"})
    assert r.status_code == 403


def test_unknown_category_rejected(client, make_user):
    kid = make_user("kid@test.local")
    r = client.put("/api/progress/mark_item_complete", headers=auth(kid["token"]), json={"user_id": kid["user_id"], "category": "hacking", "item": "x"})
    assert r.status_code == 400


def test_lesson_access_and_restrictions(client, make_user, admin_token):
    kid = make_user("kid@test.local")
    assert client.get(f"/api/user/lesson-access/{kid['user_id']}").status_code == 401
    r = client.put("/api/admin/update-lesson-restrictions", headers=auth(admin_token), json={"user_id": "000000000000000000000000", "restricted_lessons": ["flags"]})
    assert r.status_code == 404
    r = client.put("/api/admin/update-lesson-restrictions", headers=auth(admin_token), json={"user_id": kid["user_id"], "restricted_lessons": ["flags"]})
    assert r.status_code == 200
    r = client.get(f"/api/user/lesson-access/{kid['user_id']}", headers=auth(kid["token"]))
    assert "flags" in r.get_json()["restricted_lessons"]


def test_teacher_assigns_flags_quiz(client, make_user):
    kid = make_user("kid@test.local")
    teacher = make_user("t@test.local", user_type="teacher")
    client.put("/api/progress/mark_item_complete", headers=auth(kid["token"]), json={"user_id": kid["user_id"], "category": "flags", "item": "Pakistan"})
    r = client.get(f"/api/teacher/quiz-assignments/{kid['user_id']}", headers=auth(teacher["token"]))
    assert "flags" in r.get_json()["suggestions"]
    r = client.post("/api/teacher/assign-quiz", headers=auth(teacher["token"]), json={"user_id": kid["user_id"], "category": "flags"})
    assert r.status_code == 201
    tq = client.get("/api/quizzes/mine", headers=auth(kid["token"])).get_json()["teacher_quiz"]
    assert tq["category"] == "flags" and tq["can_start"]


def test_paid_endpoints_need_login(client):
    assert client.post("/analyze_speech").status_code == 401
    assert client.post("/generate-poem", json={"topic": "cats"}).status_code == 401
    assert client.post("/generate-audio", json={"text": "hi"}).status_code == 401
    assert client.post("/api/chat", json={"message": "hi"}).status_code == 401


def test_ai_rate_limit(client):
    codes = [client.get("/api/ai?question=hi").status_code for _ in range(42)]
    assert codes[-1] == 429


def test_security_headers_and_cors(client):
    r = client.get("/api/status", headers={"Origin": "https://evil.example"})
    assert r.headers.get("X-Content-Type-Options") == "nosniff"
    assert "Access-Control-Allow-Origin" not in r.headers
    r = client.get("/api/status", headers={"Origin": "http://localhost:5173"})
    assert r.headers.get("Access-Control-Allow-Origin") == "http://localhost:5173"


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code in (200, 503)
    assert "database" in r.get_json()
