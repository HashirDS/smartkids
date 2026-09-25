import json
import sys
import types

from conftest import PASSWORD, auth
from test_schools import add_student, school_a  # noqa: F401  (fixture)

import app as backend
import child_safety


# ----- nothing personal reaches the AI ----------------------------------------

def test_redaction_removes_personal_details():
    text = ("My name is Zara Khan, email zara.mum@gmail.com, call +92 300 1234567, "
            "CNIC 35202-1234567-1, see www.example.com and login zara1234@kids.aitutor")
    out = child_safety.redact_for_ai(text, names=("Zara", "Khan"))
    for secret in ("Zara", "Khan", "gmail", "1234567", "35202", "example.com", "kids.aitutor"):
        assert secret not in out
    assert "the child" in out and "[email]" in out and "[number]" in out


def test_redaction_keeps_learning_questions():
    assert child_safety.redact_for_ai("What comes after 5? Teach me 12 months") == "What comes after 5? Teach me 12 months"


class FakeGroq:
    """Records what would be sent to Groq and returns a chosen answer."""

    def __init__(self, answer):
        self.sent = []
        self.answer = answer
        self.chat = self
        self.completions = self

    def create(self, **kwargs):
        self.sent.append(kwargs["messages"])
        msg = type("M", (), {"content": self.answer})
        return type("R", (), {"choices": [type("C", (), {"message": msg})]})


def test_chat_sends_no_child_name_and_has_safety_rules(client, make_user, monkeypatch):
    kid = make_user("zara@test.local", first="Zara", last="Khan")
    fake = FakeGroq("Hi there! A is for Apple! 🍎")
    monkeypatch.setenv("GROQ_API_KEY", "test")
    monkeypatch.setitem(sys.modules, "groq", types.SimpleNamespace(Groq=lambda api_key: fake))
    r = client.post("/api/chat", headers=auth(kid["token"]),
                    json={"message": "I am Zara Khan, my mum's number is 03001234567"})
    assert r.status_code == 200
    system, user = fake.sent[-1]
    assert "Zara" not in user["content"] and "Khan" not in user["content"] and "03001234567" not in user["content"]
    assert "SAFETY RULES" in system["content"]


def test_unsafe_or_linked_ai_answers_are_replaced(client, make_user, monkeypatch):
    kid = make_user("kid@test.local")
    monkeypatch.setenv("GROQ_API_KEY", "test")
    monkeypatch.setitem(sys.modules, "groq", types.SimpleNamespace(Groq=lambda api_key: FakeGroq("You could buy a gun at www.shop.com")))
    reply = client.post("/api/chat", headers=auth(kid["token"]), json={"message": "hello"}).get_json()["reply"]
    assert reply == child_safety.SAFE_FALLBACK
    monkeypatch.setitem(sys.modules, "groq", types.SimpleNamespace(Groq=lambda api_key: FakeGroq("Look at https://site.com for more colours!")))
    reply = client.post("/api/chat", headers=auth(kid["token"]), json={"message": "hello"}).get_json()["reply"]
    assert "http" not in reply and "colours" in reply


def test_safe_words_are_not_blocked():
    for ok in ("Hello! The heart pumps blood.", "Shells are on the beach", "Skills and drills"):
        assert child_safety.safe_reply(ok) == ok


# ----- consent ------------------------------------------------------------------

def test_child_signup_needs_parent_consent(client):
    body = {"first_name": "A", "last_name": "B", "username": "c@test.local", "password": PASSWORD, "user_type": "child"}
    assert client.post("/api/register", json=body).status_code == 400
    assert client.post("/api/register", json={**body, "parent_consent": True}).status_code == 201
    assert backend.db.users.find_one({"username": "c@test.local"})["consent_source"] == "parent_signup"


def test_teacher_signup_does_not_need_parent_consent(client):
    r = client.post("/api/register", json={"first_name": "T", "last_name": "T", "username": "t@test.local",
                                           "password": PASSWORD, "user_type": "teacher"})
    assert r.status_code == 202


# ----- parents can download and delete ------------------------------------------

def parent_login(client, school_a):
    return client.post("/api/login", json={"username": "parent@test.local",
                                           "password": school_a["kid1"]["parent_login"]["password"]}).get_json()["token"]


def test_parent_downloads_child_data_without_password(client, school_a):
    token = parent_login(client, school_a)
    kid = school_a["kid1"]["_id"]
    kt = client.post("/api/login", json=school_a["kid1"]["login"]).get_json()["token"]
    client.put("/api/progress/mark_item_complete", headers=auth(kt), json={"user_id": kid, "category": "abc", "item": "A"})
    r = client.get(f"/api/parent/children/{kid}/export", headers=auth(token))
    assert r.status_code == 200 and "attachment" in r.headers["Content-Disposition"]
    data = json.loads(r.get_data(as_text=True))
    assert data["child"]["first_name"] == "Ali" and data["progress"]["completed_items"]["abc"] == ["A"]
    text = r.get_data(as_text=True)
    assert "password" not in data["child"] and "$2b$" not in text


def test_parent_cannot_export_or_delete_other_children(client, school_a):
    other = client.post("/api/join", json={"code": school_a["code1"], "first_name": "O", "email": "o@test.local",
                                          "password": "Parent-123", "child_first_name": "Zain", "consent": True}).get_json()
    kid = school_a["kid1"]["_id"]
    assert client.get(f"/api/parent/children/{kid}/export", headers=auth(other["token"])).status_code == 404
    assert client.delete(f"/api/parent/children/{kid}", headers=auth(other["token"]),
                         json={"confirm": "Ali"}).status_code == 404
    assert client.get(f"/api/parent/children/{kid}/export", headers=auth(school_a["t1"])).status_code == 404


def test_parent_deletes_child_data_completely(client, school_a):
    token = parent_login(client, school_a)
    kid = school_a["kid1"]["_id"]
    kt = client.post("/api/login", json=school_a["kid1"]["login"]).get_json()["token"]
    client.put("/api/progress/mark_item_complete", headers=auth(kt), json={"user_id": kid, "category": "abc", "item": "A"})
    backend.db.assessments.insert_one({"user_id": backend.ObjectId(kid), "category": "abc"})
    assert client.delete(f"/api/parent/children/{kid}", headers=auth(token), json={"confirm": "wrong"}).status_code == 400
    r = client.delete(f"/api/parent/children/{kid}", headers=auth(token), json={"confirm": "ali"})
    assert r.status_code == 200
    oid = backend.ObjectId(kid)
    assert backend.db.users.find_one({"_id": oid}) is None
    assert backend.db.progress.find_one({"_id": oid}) is None
    assert backend.db.assessments.count_documents({"user_id": oid}) == 0
    assert client.post("/api/login", json=school_a["kid1"]["login"]).status_code == 401
    assert kid not in backend.db.users.find_one({"username": "parent@test.local"})["child_ids"]
    log = backend.db.deletion_log.find_one({"kind": "child"})
    assert log and "Ali" not in json.dumps(log, default=str)


def test_parent_deletes_own_account(client, school_a):
    token = parent_login(client, school_a)
    assert client.delete("/api/parent/account", headers=auth(token), json={"confirm": "nope"}).status_code == 400
    assert client.delete("/api/parent/account", headers=auth(token), json={"confirm": "DELETE"}).status_code == 200
    assert backend.db.users.find_one({"username": "parent@test.local"}) is None
    assert client.get("/api/parent/children", headers=auth(token)).status_code == 401
    assert backend.db.users.find_one({"_id": backend.ObjectId(school_a["kid1"]["_id"])}) is not None
