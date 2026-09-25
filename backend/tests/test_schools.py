from datetime import datetime

import pytest
from conftest import PASSWORD, auth

import app as backend


def create_school(client, admin_token, name, email):
    r = client.post("/api/admin/schools", headers=auth(admin_token), json={
        "name": name, "city": "Kotli", "country": "Pakistan",
        "principal_first_name": "Pat", "principal_last_name": "Rincipal",
        "principal_email": email, "principal_password": "Principal-123",
    })
    assert r.status_code == 201, r.get_json()
    login = client.post("/api/login", json={"username": email, "password": "Principal-123"})
    assert login.status_code == 200 and login.get_json()["user_type"] == "principal"
    return r.get_json()["school_id"], login.get_json()["token"]


def add_teacher(client, principal_token, email):
    r = client.post("/api/school/teachers", headers=auth(principal_token), json={
        "first_name": "Tia", "last_name": "Cher", "email": email, "password": "Teacher-123"})
    assert r.status_code == 201, r.get_json()
    return r.get_json()["_id"], client.post("/api/login", json={"username": email, "password": "Teacher-123"}).get_json()["token"]


def add_class(client, principal_token, name, teacher_ids, level="kg1"):
    r = client.post("/api/school/classes", headers=auth(principal_token), json={"name": name, "level": level, "teacher_ids": teacher_ids})
    assert r.status_code == 201, r.get_json()
    return r.get_json()["_id"], r.get_json()["code"]


def add_student(client, token, class_id, first="Ali"):
    r = client.post("/api/school/students", headers=auth(token), json={
        "class_id": class_id, "first_name": first, "last_name": "Khan",
        "parent": {"name": "Parent", "email": "parent@test.local", "phone": "+92 300 1234567"}})
    return r


@pytest.fixture
def school_a(client, admin_token):
    school_id, principal = create_school(client, admin_token, "Sunrise School", "principal.a@test.local")
    t1_id, t1 = add_teacher(client, principal, "t1@test.local")
    t2_id, t2 = add_teacher(client, principal, "t2@test.local")
    class1, code1 = add_class(client, principal, "KG1 Blue", [t1_id])
    class2, _ = add_class(client, principal, "Nursery Red", [t2_id], level="nursery")
    kid1 = add_student(client, principal, class1, "Ali").get_json()
    kid2 = add_student(client, principal, class2, "Sara").get_json()
    return {"school_id": school_id, "principal": principal, "t1": t1, "t2": t2, "t1_id": t1_id,
            "class1": class1, "class2": class2, "code1": code1, "kid1": kid1, "kid2": kid2}


def test_class_code_format(school_a):
    assert school_a["code1"].startswith("KG1-") and len(school_a["code1"]) == 8


def test_new_student_can_log_in_with_given_login(client, school_a):
    login = school_a["kid1"]["login"]
    assert login["username"].endswith("@kids.aitutor")
    r = client.post("/api/login", json=login)
    assert r.status_code == 200 and r.get_json()["user_type"] == "child"


def test_teacher_sees_only_own_class(client, school_a):
    names = [s["child_name"] for s in client.get("/api/students", headers=auth(school_a["t1"])).get_json()["students"]]
    assert names == ["Ali Khan"]
    progress = client.get("/api/progress/all_children", headers=auth(school_a["t1"])).get_json()
    assert [p["_id"] for p in progress] == [school_a["kid1"]["_id"]]
    assert client.get(f"/api/progress/summary/{school_a['kid2']['_id']}", headers=auth(school_a["t1"])).status_code == 403
    assert client.get(f"/api/quiz-analytics/{school_a['kid2']['_id']}", headers=auth(school_a["t1"])).status_code == 404
    assert client.post("/api/teacher/assign-quiz", headers=auth(school_a["t1"]), json={"user_id": school_a["kid2"]["_id"], "category": "abc"}).status_code == 404


def test_teacher_cannot_add_student_to_other_class(client, school_a):
    assert add_student(client, school_a["t1"], school_a["class2"]).status_code == 404
    assert add_student(client, school_a["t1"], school_a["class1"], "Zain").status_code == 201


def test_principal_sees_whole_school_but_not_other_schools(client, admin_token, school_a):
    _, principal_b = create_school(client, admin_token, "Moon School", "principal.b@test.local")
    overview = client.get("/api/school", headers=auth(school_a["principal"])).get_json()
    assert {s["first_name"] for s in overview["students"]} == {"Ali", "Sara"}
    assert len(overview["classes"]) == 2 and len(overview["teachers"]) == 2
    assert client.get("/api/school", headers=auth(principal_b)).get_json()["students"] == []
    assert client.get(f"/api/progress/summary/{school_a['kid1']['_id']}", headers=auth(principal_b)).status_code == 403
    # principal B cannot touch school A's classes
    assert client.put(f"/api/school/classes/{school_a['class1']}", headers=auth(principal_b), json={"name": "Hacked"}).status_code == 404


def test_teacher_overview_limited(client, school_a):
    data = client.get("/api/school", headers=auth(school_a["t1"])).get_json()
    assert [c["name"] for c in data["classes"]] == ["KG1 Blue"]
    assert "teachers" not in data
    assert [s["first_name"] for s in data["students"]] == ["Ali"]
    assert data["students"][0]["parent"]["email"] == "parent@test.local"


def test_teacher_cannot_manage_classes_or_teachers(client, school_a):
    assert client.post("/api/school/classes", headers=auth(school_a["t1"]), json={"name": "X", "level": "kg1"}).status_code == 401
    assert client.post("/api/school/teachers", headers=auth(school_a["t1"]), json={"email": "x@test.local"}).status_code == 401
    assert client.get("/api/admin/schools", headers=auth(school_a["principal"])).status_code == 401


def test_move_student_and_reassign_teacher(client, school_a):
    kid = school_a["kid1"]["_id"]
    r = client.put(f"/api/school/students/{kid}", headers=auth(school_a["principal"]), json={"class_id": school_a["class2"]})
    assert r.status_code == 200
    assert client.get(f"/api/progress/summary/{kid}", headers=auth(school_a["t1"])).status_code == 403
    assert client.get(f"/api/progress/summary/{kid}", headers=auth(school_a["t2"])).status_code == 200
    # give class2 to teacher 1 as well
    client.put(f"/api/school/classes/{school_a['class2']}", headers=auth(school_a["principal"]), json={"teacher_ids": [school_a["t1_id"]]})
    assert client.get(f"/api/progress/summary/{kid}", headers=auth(school_a["t1"])).status_code == 200


def test_class_with_students_cannot_be_deleted(client, school_a):
    assert client.delete(f"/api/school/classes/{school_a['class1']}", headers=auth(school_a["principal"])).status_code == 400


def test_school_lesson_restrictions(client, school_a):
    r = client.put("/api/school/lesson-restrictions", headers=auth(school_a["principal"]), json={"restricted_lessons": ["flags", "not-a-lesson"]})
    assert r.get_json()["restricted_lessons"] == ["flags"]
    kid_token = client.post("/api/login", json=school_a["kid1"]["login"]).get_json()["token"]
    access = client.get(f"/api/user/lesson-access/{school_a['kid1']['_id']}", headers=auth(kid_token)).get_json()
    assert "flags" in access["restricted_lessons"]


def test_reset_password(client, school_a):
    r = client.post(f"/api/school/students/{school_a['kid1']['_id']}/reset-password", headers=auth(school_a["t1"]))
    new_login = r.get_json()["login"]
    assert client.post("/api/login", json=new_login).status_code == 200
    assert client.post(f"/api/school/students/{school_a['kid2']['_id']}/reset-password", headers=auth(school_a["t1"])).status_code == 404


def test_self_signup_goes_to_default_school(client, make_user, db):
    kid = make_user("self@test.local")
    user = db.users.find_one({"username": "self@test.local"})
    school = db.schools.find_one({"is_default": True})
    assert user["school_id"] == str(school["_id"]) and len(user["class_ids"]) == 1


def test_existing_users_migrated(db):
    db.users.insert_one({"first_name": "Old", "username": "old@test.local", "user_type": "child", "created_at": datetime.utcnow()})
    db.users.insert_one({"first_name": "OldT", "username": "oldt@test.local", "user_type": "teacher", "created_at": datetime.utcnow()})
    assert backend.migrate_existing_users(db) == 2
    kid = db.users.find_one({"username": "old@test.local"})
    teacher = db.users.find_one({"username": "oldt@test.local"})
    assert kid["class_ids"] == teacher["class_ids"]
    cls = db.classes.find_one({"is_default": True})
    assert str(teacher["_id"]) in cls["teacher_ids"]
    assert backend.migrate_existing_users(db) == 0


def test_attach_pending_teacher_approves(client, school_a, db):
    client.post("/api/register", json={"first_name": "New", "last_name": "T", "username": "newt@test.local", "password": PASSWORD, "user_type": "teacher"})
    r = client.post("/api/school/teachers", headers=auth(school_a["principal"]), json={"email": "newt@test.local"})
    assert r.status_code == 200
    assert client.post("/api/login", json={"username": "newt@test.local", "password": PASSWORD}).status_code == 200


def test_admin_school_listing_and_delete_rules(client, admin_token, school_a):
    rows = client.get("/api/admin/schools", headers=auth(admin_token)).get_json()
    row = next(r for r in rows if r["name"] == "Sunrise School")
    assert row["classes"] == 2 and row["teachers"] == 2 and row["students"] == 2 and row["principal"]["email"] == "principal.a@test.local"
    assert client.delete(f"/api/admin/schools/{school_a['school_id']}", headers=auth(admin_token)).status_code == 400
    admin_view = client.get(f"/api/school?school_id={school_a['school_id']}", headers=auth(admin_token)).get_json()
    assert len(admin_view["students"]) == 2


def test_me_endpoint(client, school_a):
    me = client.get("/api/me", headers=auth(school_a["t1"])).get_json()
    assert me["user_type"] == "teacher" and me["school"]["name"] == "Sunrise School" and me["classes"][0]["name"] == "KG1 Blue"


def test_generated_passwords_for_staff(client, admin_token):
    r = client.post("/api/admin/schools", headers=auth(admin_token), json={
        "name": "Star School", "principal_first_name": "P", "principal_email": "p.star@test.local"})
    login = r.get_json()["login"]
    assert len(login["password"]) >= 12
    principal = client.post("/api/login", json=login).get_json()["token"]
    r = client.post("/api/school/teachers", headers=auth(principal), json={"first_name": "T", "email": "t.star@test.local"})
    assert client.post("/api/login", json=r.get_json()["login"]).status_code == 200
