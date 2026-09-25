from datetime import datetime, timedelta

from conftest import auth
from test_schools import add_student, school_a  # noqa: F401  (fixture)

import app as backend
import parents

JOIN = {"first_name": "Amina", "last_name": "Raza", "email": "amina@test.local", "password": "Parent-123",
        "phone": "+92 300 0000000", "child_first_name": "Zain", "child_last_name": "Raza", "consent": True}


def join(client, code, **changes):
    return client.post("/api/join", json={**JOIN, "code": code, **changes})


def parent_token(client, email="parent@test.local", password=None):
    r = client.post("/api/login", json={"username": email, "password": password})
    assert r.status_code == 200, r.get_json()
    assert r.get_json()["user_type"] == "parent"
    return r.get_json()["token"]


# ----- staff-added children get a parent login ------------------------------

def test_staff_adding_child_creates_parent_login_once(client, school_a):
    assert school_a["kid1"]["parent_login"]["username"] == "parent@test.local"
    # Second child with the same parent email is linked, not a second account.
    assert school_a["kid2"]["parent_login"] is None
    parent = backend.db.users.find_one({"username": "parent@test.local"})
    assert parent["user_type"] == "parent"
    assert set(parent["child_ids"]) == {school_a["kid1"]["_id"], school_a["kid2"]["_id"]}


def test_parent_sees_only_own_children(client, school_a):
    token = parent_token(client, password=school_a["kid1"]["parent_login"]["password"])
    data = client.get("/api/parent/children", headers=auth(token)).get_json()
    assert sorted(c["first_name"] for c in data["children"]) == ["Ali", "Sara"]
    assert data["children"][0]["class_name"] in ("KG1 Blue", "Nursery Red")
    join(client, school_a["code1"])
    zain = backend.db.users.find_one({"first_name": "Zain"})
    assert client.get(f"/api/progress/summary/{zain['_id']}", headers=auth(token)).status_code == 403
    assert client.get(f"/api/progress/summary/{school_a['kid1']['_id']}", headers=auth(token)).status_code == 200


def test_changing_parent_email_moves_the_link(client, school_a):
    kid = school_a["kid1"]["_id"]
    r = client.put(f"/api/school/students/{kid}", headers=auth(school_a["principal"]),
                   json={"parent": {"name": "New Mum", "email": "newmum@test.local"}})
    assert r.status_code == 200 and r.get_json()["parent_login"]["username"] == "newmum@test.local"
    old = backend.db.users.find_one({"username": "parent@test.local"})
    assert kid not in old["child_ids"]


def test_staff_email_is_not_turned_into_parent(client, school_a):
    r = client.post("/api/school/students", headers=auth(school_a["principal"]), json={
        "class_id": school_a["class1"], "first_name": "Omar", "parent": {"email": "t1@test.local"}})
    assert r.status_code == 201
    assert r.get_json()["parent_login"] is None and r.get_json()["parent_note"]
    assert backend.db.users.find_one({"username": "t1@test.local"})["user_type"] == "teacher"


# ----- /join with a class code -----------------------------------------------

def test_class_code_lookup(client, school_a):
    r = client.get(f"/api/join/{school_a['code1'].lower()}")
    assert r.status_code == 200 and r.get_json()["class_name"] == "KG1 Blue"
    assert r.get_json()["school_name"] == "Sunrise School"
    assert client.get("/api/join/NOPE-1234").status_code == 404


def test_join_creates_parent_and_child_in_class(client, school_a):
    r = join(client, school_a["code1"])
    assert r.status_code == 201, r.get_json()
    body = r.get_json()
    assert body["user_type"] == "parent" and body["token"]
    assert body["child_login"]["username"].endswith("@kids.aitutor")
    child = backend.db.users.find_one({"username": body["child_login"]["username"]})
    assert child["class_ids"] == [school_a["class1"]] and child["joined_with_code"]
    # The child can log in, and the class teacher sees them.
    assert client.post("/api/login", json=body["child_login"]).status_code == 200
    school = client.get("/api/school", headers=auth(school_a["t1"])).get_json()
    zain = next(s for s in school["students"] if s["first_name"] == "Zain")
    assert zain["joined_with_code"] and zain["has_parent_login"]


def test_join_validation(client, school_a):
    code = school_a["code1"]
    assert join(client, "WRONG").status_code == 404
    assert join(client, code, consent=False).status_code == 400
    assert join(client, code, password="short").status_code == 400
    assert join(client, code, email="not-an-email").status_code == 400
    assert join(client, code, email="t1@test.local").status_code == 409
    assert join(client, code, email={"$ne": ""}).status_code == 400


def test_parent_adds_sibling_and_resets_password(client, school_a):
    token = join(client, school_a["code1"]).get_json()["token"]
    r = client.post("/api/parent/children", headers=auth(token),
                    json={"code": school_a["code1"], "child_first_name": "Hira"})
    assert r.status_code == 201
    kids = client.get("/api/parent/children", headers=auth(token)).get_json()["children"]
    assert sorted(k["first_name"] for k in kids) == ["Hira", "Zain"]
    reset = client.post(f"/api/parent/children/{kids[0]['_id']}/reset-password", headers=auth(token))
    assert reset.status_code == 200
    assert client.post("/api/login", json=reset.get_json()["login"]).status_code == 200
    # Cannot reset someone else's child.
    assert client.post(f"/api/parent/children/{school_a['kid1']['_id']}/reset-password",
                       headers=auth(token)).status_code == 404


def test_parent_cannot_use_staff_or_admin_routes(client, school_a):
    token = join(client, school_a["code1"]).get_json()["token"]
    assert client.get("/api/school", headers=auth(token)).status_code == 401
    assert client.get("/api/admin/users", headers=auth(token)).status_code == 401
    assert client.post("/api/school/students", headers=auth(token), json={}).status_code == 401
    kid = client.get("/api/parent/children", headers=auth(token)).get_json()["children"][0]["_id"]
    r = client.put("/api/progress/mark_item_complete", headers=auth(token),
                   json={"user_id": kid, "category": "abc", "item": "A"})
    assert r.status_code == 401


def test_admin_sees_parent_links(client, school_a, admin_token):
    users = client.get("/api/admin/users", headers=auth(admin_token)).get_json()
    parent = next(u for u in users if u["role"] == "parent")
    assert "Ali" in parent["linked"] and "Sara" in parent["linked"]
    ali = next(u for u in users if u["name"] == "Ali Khan")
    assert "parent@test.local" in ali["linked"]
    assert client.get("/api/admin/stats", headers=auth(admin_token)).get_json()["parents"] == 1


def test_deleting_child_unlinks_parent(client, school_a, admin_token):
    kid = school_a["kid1"]["_id"]
    assert client.delete(f"/api/admin/delete-user/{kid}", headers=auth(admin_token)).status_code == 200
    assert kid not in backend.db.users.find_one({"username": "parent@test.local"})["child_ids"]


# ----- weekly email -----------------------------------------------------------

def test_weekly_report_counts_this_week_only(client, school_a):
    kid_oid = backend.db.users.find_one({"first_name": "Ali"})["_id"]
    now = datetime.utcnow()
    backend.db.progress.update_one({"_id": kid_oid}, {"$set": {"speech_history": [
        {"accuracy": 80, "timestamp": now.isoformat()},
        {"accuracy": 60, "timestamp": (now - timedelta(days=1)).isoformat()},
        {"accuracy": 10, "timestamp": (now - timedelta(days=30)).isoformat()},
    ]}, "$addToSet": {"completed_items.abc": "A"}})
    backend.db.assessments.insert_one({"user_id": kid_oid, "category": "abc", "percentage": 90, "timestamp": now})
    report = parents.child_report(backend.db, backend.db.users.find_one({"_id": kid_oid}))
    assert report["week"] == {"active": True, "speaking_tries": 2, "speaking_accuracy": 70, "quizzes": 1, "quiz_average": 90}
    idle = parents.child_report(backend.db, backend.db.users.find_one({"first_name": "Sara"}))
    assert idle["week"]["active"] is False
    assert report["items_learned"] == 1


def test_weekly_cron_needs_secret_and_respects_opt_out(client, school_a, monkeypatch):
    monkeypatch.delenv("RESEND_API_KEY", raising=False)
    assert client.get("/api/cron/weekly-report").status_code == 401
    monkeypatch.setenv("CRON_SECRET", "cron-secret-1")
    assert client.get("/api/cron/weekly-report", headers=auth("wrong")).status_code == 401
    r = client.get("/api/cron/weekly-report", headers=auth("cron-secret-1"))
    assert r.status_code == 200 and r.get_json()["parents"] == 1 and r.get_json()["dry_run"]

    parent = backend.db.users.find_one({"username": "parent@test.local"})
    token = parents.unsubscribe_token(str(parent["_id"]))
    assert client.get(f"/api/parent/unsubscribe?id={parent['_id']}&t=bad").status_code == 400
    assert client.get(f"/api/parent/unsubscribe?id={parent['_id']}&t={token}").status_code == 200
    r = client.get("/api/cron/weekly-report", headers=auth("cron-secret-1"))
    assert r.get_json()["parents"] == 0


def test_weekly_email_is_sent_through_resend_once(client, school_a, monkeypatch):
    monkeypatch.setenv("CRON_SECRET", "cron-secret-1")
    monkeypatch.setenv("RESEND_API_KEY", "re_test")
    calls = []

    class Ok:
        status_code = 200

    monkeypatch.setattr(parents.requests, "post", lambda url, json, timeout, headers: calls.append(json) or Ok())
    r = client.get("/api/cron/weekly-report", headers=auth("cron-secret-1")).get_json()
    assert r["sent"] == 1 and len(calls) == 1
    email = calls[0][0]
    assert email["to"] == ["parent@test.local"] and "Ali" in email["subject"] and "Sara" in email["html"]
    # Running again the same week does not send twice.
    assert client.get("/api/cron/weekly-report", headers=auth("cron-secret-1")).get_json()["parents"] == 0


def test_parent_settings(client, school_a):
    token = join(client, school_a["code1"]).get_json()["token"]
    assert client.put("/api/parent/settings", headers=auth(token), json={"weekly_email": False}).status_code == 200
    assert client.get("/api/parent/children", headers=auth(token)).get_json()["parent"]["weekly_email"] is False
