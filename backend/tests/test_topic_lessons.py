import pytest
from conftest import auth

import app as backend
import parents
import schools

NEW = ("islamic", "science", "animals")


@pytest.mark.parametrize("category,item", [("islamic", "pillars:salah"), ("science", "weather:rainy"), ("animals", "farm:cow")])
def test_child_can_save_topic_cards(client, make_user, category, item):
    kid = make_user(f"{category}@test.local")
    r = client.put("/api/progress/mark_item_complete", headers=auth(kid["token"]),
                   json={"user_id": kid["user_id"], "category": category, "item": item})
    assert r.status_code == 200, r.get_json()
    summary = client.get(f"/api/progress/summary/{kid['user_id']}", headers=auth(kid["token"])).get_json()
    assert summary["completed_items"][category] == [item]


def test_topic_lessons_are_known_everywhere():
    assert set(NEW) <= set(backend.QUIZ_CATEGORIES)
    assert set(NEW) <= schools.LESSON_KEYS
    assert set(NEW) <= set(parents.CATEGORY_LABELS)


def test_topic_lessons_can_be_turned_off_for_a_school(client, admin_token):
    school = client.post("/api/admin/schools", headers=auth(admin_token), json={
        "name": "Topic School", "principal_first_name": "P", "principal_email": "p@topic.local",
        "principal_password": "Principal-123"}).get_json()
    r = client.put("/api/school/lesson-restrictions", headers=auth(admin_token),
                   json={"school_id": school["school_id"], "restricted_lessons": ["islamic"]})
    assert r.status_code == 200
    assert backend.db.schools.find_one({"name": "Topic School"})["restricted_lessons"] == ["islamic"]
