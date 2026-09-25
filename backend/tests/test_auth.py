from conftest import PASSWORD, auth


def test_child_register_and_login(client, db):
    r = client.post("/api/register", json={"first_name": "Ali", "last_name": "Khan", "username": "Ali@Test.com", "password": PASSWORD, "user_type": "child"})
    assert r.status_code == 201 and r.get_json()["token"]
    assert db.progress.find_one({})["completed_items"]["flags"] == []
    assert client.post("/api/login", json={"username": "ali@test.com", "password": PASSWORD}).status_code == 200
    assert client.post("/login", json={"username": "ALI@test.com", "password": PASSWORD}).status_code == 200


def test_nosql_operator_injection_rejected(client, make_user):
    make_user("kid@test.local")
    assert client.post("/api/login", json={"username": {"$ne": None}, "password": "x"}).status_code == 400
    assert client.post("/api/login", json={"username": "kid@test.local", "password": {"$ne": None}}).status_code == 400


def test_cannot_register_as_admin(client):
    r = client.post("/api/register", json={"first_name": "X", "last_name": "Y", "username": "x@test.local", "password": PASSWORD, "user_type": "admin"})
    assert r.status_code == 400


def test_teacher_needs_approval(client, db, admin_token):
    r = client.post("/api/register", json={"first_name": "T", "last_name": "One", "username": "t@test.local", "password": PASSWORD, "user_type": "teacher"})
    assert r.status_code == 202 and r.get_json()["pending_approval"] and "token" not in r.get_json()
    r = client.post("/api/login", json={"username": "t@test.local", "password": PASSWORD})
    assert r.status_code == 403 and "approval" in r.get_json()["message"]
    teacher_id = str(db.users.find_one({"username": "t@test.local"})["_id"])
    r = client.put(f"/api/admin/toggle-restrict/{teacher_id}", headers=auth(admin_token))
    assert r.get_json()["restricted"] is False
    assert client.post("/api/login", json={"username": "t@test.local", "password": PASSWORD}).status_code == 200


def test_admin_login(client):
    assert client.post("/api/login", json={"username": "ADMIN@test.local", "password": "AdminPass123"}).status_code == 200
    assert client.post("/api/login", json={"username": "admin@test.local", "password": "wrong"}).status_code == 401


def test_logout_revokes_token(client, make_user):
    kid = make_user("kid@test.local")
    assert client.get("/api/progress/me", headers=auth(kid["token"])).status_code == 200
    assert client.post("/api/logout", headers=auth(kid["token"])).status_code == 200
    assert client.get("/api/progress/me", headers=auth(kid["token"])).status_code == 401


def test_restricting_user_signs_them_out(client, make_user, admin_token):
    kid = make_user("kid@test.local")
    client.put(f"/api/admin/toggle-restrict/{kid['user_id']}", headers=auth(admin_token))
    assert client.get("/api/progress/me", headers=auth(kid["token"])).status_code == 401


def test_login_rate_limit(client):
    codes = [client.post("/api/login", json={"username": "brute@test.local", "password": "nope"}).status_code for _ in range(12)]
    assert codes[-1] == 429
