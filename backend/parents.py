"""Parents: join with a class code, see their children's progress, weekly email.

A parent account is a `users` document with user_type "parent" and `child_ids`
(string ids of child accounts). Parents are made in two ways:
  * school staff add a child with a parent email (schools.link_parent), or
  * the parent signs up on /join with the class code the school gave them.
"""
import hashlib
import hmac
import html
import os
from datetime import datetime, timedelta

import requests
from flask import jsonify, request
from validators import email as valid_email

from rewards import rewards_for
from schools import LEVEL_LABELS, can_view_student, create_student, kid_password, oid

CATEGORY_LABELS = {"abc": "ABC", "numbers": "Numbers", "shapes": "Shapes", "colors": "Colours",
                   "fruits": "Fruits", "poems": "Poems", "flags": "Flags",
                   "urdu": "Urdu", "arabic": "Arabic Qaida",
                   "islamic": "Islamic Studies", "science": "Science", "animals": "Animals"}
RESEND_URL = "https://api.resend.com/emails/batch"
BATCH_SIZE = 100          # Resend's batch limit
MAX_PARENTS_PER_RUN = 1000


def _parse_time(value):
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)
        except ValueError:
            return None
    return None


def child_report(db, child, since=None):
    """Progress numbers for one child, shared by the parent page and the weekly email."""
    since = since or datetime.utcnow() - timedelta(days=7)
    progress = db.progress.find_one({"_id": child["_id"]}) or {}
    completed = progress.get("completed_items") or {}
    by_category = {key: len(completed.get(key) or []) for key in CATEGORY_LABELS}

    speech = [h for h in progress.get("speech_history") or [] if (_parse_time(h.get("timestamp")) or datetime.min) >= since]
    accuracies = [h.get("accuracy") for h in speech if isinstance(h.get("accuracy"), (int, float))]

    quizzes = list(db.assessments.find({"user_id": child["_id"]}, {"questions": 0}).sort("timestamp", -1).limit(20))
    week_quizzes = [q for q in quizzes if (_parse_time(q.get("timestamp")) or datetime.min) >= since]
    percents = [q.get("percentage") for q in week_quizzes if isinstance(q.get("percentage"), (int, float))]

    cls = db.classes.find_one({"_id": oid((child.get("class_ids") or [None])[0])}) if child.get("class_ids") else None
    school = db.schools.find_one({"_id": oid(child.get("school_id"))}) if child.get("school_id") else None
    teachers = []
    if cls and cls.get("teacher_ids"):
        teachers = [f"{t.get('first_name', '')} {t.get('last_name', '')}".strip()
                    for t in db.users.find({"_id": {"$in": [o for o in map(oid, cls["teacher_ids"]) if o]}})]

    rewards = rewards_for(db, child["_id"])
    return {
        "_id": str(child["_id"]),
        "streak": rewards["streak"]["current"],
        "longest_streak": rewards["streak"]["longest"],
        "badges": [{"title": b["title"], "emoji": b["emoji"]} for b in rewards["badges"] if b["earned"]],
        "first_name": child.get("first_name", ""),
        "last_name": child.get("last_name", ""),
        "username": child.get("username", ""),
        "class_name": (cls or {}).get("name", ""),
        "level": LEVEL_LABELS.get((cls or {}).get("level") or child.get("level"), ""),
        "school_name": "" if not school or school.get("is_default") else school.get("name", ""),
        "teachers": teachers,
        "items_learned": sum(by_category.values()),
        "by_category": by_category,
        "stars": progress.get("total_score", 0) or 0,
        "last_activity": progress.get("last_activity"),
        "week": {
            "active": bool(speech or week_quizzes or (_parse_time(progress.get("last_activity")) or datetime.min) >= since),
            "speaking_tries": len(speech),
            "speaking_accuracy": round(sum(accuracies) / len(accuracies)) if accuracies else None,
            "quizzes": len(week_quizzes),
            "quiz_average": round(sum(percents) / len(percents)) if percents else None,
        },
        "recent_quizzes": [{
            "category": q.get("category"), "score": q.get("score"), "total": q.get("total_questions"),
            "percentage": q.get("percentage"), "when": (_parse_time(q.get("timestamp")) or datetime.utcnow()).isoformat(),
        } for q in quizzes[:5]],
    }


# ---------------------------------------------------------------------------
# Weekly email
# ---------------------------------------------------------------------------

def unsubscribe_token(parent_id):
    secret = os.getenv("CRON_SECRET") or ""
    if not secret:
        return ""
    return hmac.new(secret.encode(), f"unsub:{parent_id}".encode(), hashlib.sha256).hexdigest()[:32]


def weekly_email_html(parent, reports, base_url):
    esc = html.escape
    blocks = []
    for r in reports:
        w = r["week"]
        lines = [
            f"<b>{w['speaking_tries']}</b> speaking tries" + (f" &middot; {w['speaking_accuracy']}% clear" if w["speaking_accuracy"] is not None else ""),
            f"<b>{w['quizzes']}</b> quizzes" + (f" &middot; average {w['quiz_average']}%" if w["quiz_average"] is not None else ""),
            f"<b>{r['items_learned']}</b> things learned so far &middot; <b>{r['stars']}</b> stars",
        ]
        if r["streak"]:
            lines.append(f"&#128293; <b>{r['streak']}</b>-day learning streak")
        if r["badges"]:
            lines.append("Badges: " + " ".join(f"{b['emoji']} {esc(b['title'])}" for b in r["badges"][-4:]))
        learned = ", ".join(f"{CATEGORY_LABELS[k]} {v}" for k, v in r["by_category"].items() if v)
        where = " &middot; ".join(esc(x) for x in (r["class_name"], r["school_name"]) if x)
        quiet = "" if w["active"] else (
            "<p style='margin:8px 0 0;color:#A35A00'>No practice this week. Ten minutes of ABC or Numbers together is a great start!</p>")
        blocks.append(
            "<div style='background:#FFF9EC;border-radius:18px;padding:16px 18px;margin:0 0 14px'>"
            f"<p style='margin:0;font-size:20px;font-weight:700;color:#1E2A55'>{esc(r['first_name'])}</p>"
            f"<p style='margin:2px 0 10px;color:#6B7390;font-size:13px'>{where}</p>"
            + "".join(f"<p style='margin:4px 0;color:#1E2A55'>{line}</p>" for line in lines)
            + (f"<p style='margin:8px 0 0;color:#6B7390;font-size:13px'>Learned: {esc(learned)}</p>" if learned else "")
            + quiet + "</div>")
    token = unsubscribe_token(str(parent["_id"]))
    unsub = (f"<a href='{base_url}api/parent/unsubscribe?id={parent['_id']}&t={token}' style='color:#6B7390'>Stop these emails</a>"
             if token else "You can turn these emails off on your parent page.")
    return (
        "<div style='font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:20px'>"
        f"<p style='font-size:22px;font-weight:700;color:#1E2A55;margin:0 0 4px'>Hello {esc(parent.get('first_name') or 'there')},</p>"
        "<p style='color:#4A5578;margin:0 0 16px'>Here is this week at AI Tutor.</p>"
        + "".join(blocks)
        + f"<p style='margin:18px 0'><a href='{base_url}parent' style='background:#2EC26A;color:#fff;padding:9px 16px;"
        "border-radius:999px;text-decoration:none;font-weight:700'>See full progress</a></p>"
        f"<p style='color:#8A91AD;font-size:12px'>AI Tutor, a product of XactGen and Datix AI. {unsub}</p></div>"
    )


def send_weekly_reports(db, base_url, now=None, dry_run=False):
    """Build and send one email per parent who has children and wants the email."""
    now = now or datetime.utcnow()
    since = now - timedelta(days=7)
    api_key = os.getenv("RESEND_API_KEY")
    sender = os.getenv("EMAIL_FROM") or "AI Tutor <reports@datixai.com>"
    query = {"user_type": "parent", "weekly_email": {"$ne": False}, "child_ids.0": {"$exists": True},
             "$or": [{"last_weekly_report": {"$exists": False}}, {"last_weekly_report": {"$lt": now - timedelta(days=6)}}]}
    parents = list(db.users.find(query).limit(MAX_PARENTS_PER_RUN))
    emails, sent_ids = [], []
    for parent in parents:
        children = list(db.users.find({"_id": {"$in": [o for o in map(oid, parent.get("child_ids")) if o]}, "user_type": "child"}))
        if not children:
            continue
        reports = [child_report(db, c, since) for c in children]
        names = " and ".join(r["first_name"] for r in reports[:3])
        emails.append({"from": sender, "to": [parent["username"]], "subject": f"{names}'s week at AI Tutor",
                       "html": weekly_email_html(parent, reports, base_url)})
        sent_ids.append(parent["_id"])

    if dry_run or not api_key:
        return {"parents": len(emails), "sent": 0, "dry_run": True,
                "preview": emails[0]["html"] if emails else None}

    sent, failed = 0, 0
    for i in range(0, len(emails), BATCH_SIZE):
        chunk, ids = emails[i:i + BATCH_SIZE], sent_ids[i:i + BATCH_SIZE]
        try:
            res = requests.post(RESEND_URL, json=chunk, timeout=20,
                                headers={"Authorization": f"Bearer {api_key}"})
            ok = res.status_code < 300
        except requests.RequestException as e:
            print(f"Weekly email batch failed: {e}")
            ok = False
        if ok:
            db.users.update_many({"_id": {"$in": ids}}, {"$set": {"last_weekly_report": now}})
            sent += len(chunk)
        else:
            failed += len(chunk)
    return {"parents": len(emails), "sent": sent, "failed": failed, "dry_run": False}


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

def register_parent_routes(app, core):

    def db():
        return core.db

    def err(message, status=400):
        return jsonify({"message": message}), status

    def site_url():
        return (os.getenv("PUBLIC_APP_URL") or request.host_url).rstrip("/") + "/"

    def parent_session():
        session = core.current_session()
        return session if session and session.get("user_type") == "parent" else None

    def find_class(code):
        code = (core.clean_str(code, 20) or "").upper().replace(" ", "")
        if not code:
            return None, None
        cls = db().classes.find_one({"code": code})
        if not cls:
            return None, None
        school = db().schools.find_one({"_id": oid(cls.get("school_id"))})
        return cls, school

    def class_payload(cls, school):
        return {"class_name": cls.get("name"), "level": LEVEL_LABELS.get(cls.get("level"), ""),
                "school_name": "" if not school or school.get("is_default") else school.get("name", ""),
                "school_city": (school or {}).get("city", "")}

    def child_names(data):
        first = core.clean_str(data.get("child_first_name"), 60)
        last = core.clean_str(data.get("child_last_name"), 60) or ""
        return first, last

    @app.route("/api/join/<code>", methods=["GET"])
    def check_class_code(code):
        if core.rate_limited(f"join-check:{core.client_ip()}", 30, 600):
            return core.too_many_requests()
        cls, school = find_class(code)
        if not cls:
            return err("We could not find that class code. Please check it with your school.", 404)
        return jsonify(class_payload(cls, school))

    @app.route("/api/join", methods=["POST"])
    def join_with_code():
        if core.rate_limited(f"join:{core.client_ip()}", 10, 3600):
            return core.too_many_requests()
        data = core.json_body()
        cls, school = find_class(data.get("code"))
        if not cls:
            return err("We could not find that class code. Please check it with your school.", 404)
        p_first = core.clean_str(data.get("first_name"), 60)
        p_last = core.clean_str(data.get("last_name"), 60) or ""
        p_email = (core.clean_str(data.get("email"), 254) or "").lower()
        p_phone = core.clean_str(data.get("phone"), 30) or ""
        password = data.get("password") if isinstance(data.get("password"), str) else ""
        c_first, c_last = child_names(data)
        if not p_first or not p_email or not c_first:
            return err("Please fill in your name, email and your child's first name.")
        if not valid_email(p_email):
            return err("Please enter a valid email address.")
        if not 8 <= len(password) <= 128:
            return err("Your password must be 8 to 128 characters.")
        if data.get("consent") is not True:
            return err("Please confirm you are the child's parent or guardian and accept the terms.")
        if db().users.find_one({"username": p_email}):
            return err("This email already has an account. Log in, then use \"Add a child\" on your parent page.", 409)

        parent_id = db().users.insert_one({
            "first_name": p_first, "last_name": p_last, "username": p_email,
            "password": core.bcrypt.generate_password_hash(password).decode("utf-8"),
            "user_type": "parent", "child_ids": [], "phone": p_phone, "weekly_email": True,
            "consent_at": datetime.utcnow(), "created_at": datetime.utcnow(),
        }).inserted_id
        parent_details = {"name": f"{p_first} {p_last}".strip(), "email": p_email, "phone": p_phone}
        child_id, login = create_student(db(), core.bcrypt, cls, c_first, c_last, parent_details,
                                         str(parent_id), extra={"joined_with_code": True})
        db().users.update_one({"_id": parent_id}, {"$set": {"child_ids": [child_id]}})
        token = core.issue_token(str(parent_id), "parent")
        return jsonify({
            "message": "Welcome to AI Tutor!", "user_id": str(parent_id), "user_type": "parent",
            "first_name": p_first, "last_name": p_last, "token": token,
            "child_login": login, **class_payload(cls, school),
        }), 201

    @app.route("/api/parent/children", methods=["GET"])
    def parent_children():
        session = parent_session()
        if not session:
            return err("Unauthorized", 401)
        me = db().users.find_one({"_id": oid(session.get("user_id"))}) or {}
        children = list(db().users.find({"_id": {"$in": [o for o in map(oid, me.get("child_ids") or []) if o]},
                                         "user_type": "child"}).sort("first_name", 1))
        return jsonify({
            "parent": {"first_name": me.get("first_name", ""), "last_name": me.get("last_name", ""),
                       "email": me.get("username", ""), "phone": me.get("phone", ""),
                       "weekly_email": me.get("weekly_email", True) is not False},
            "children": [child_report(db(), c) for c in children],
        })

    @app.route("/api/parent/children", methods=["POST"])
    def parent_add_child():
        session = parent_session()
        if not session:
            return err("Unauthorized", 401)
        if core.rate_limited(f"parent-add:{session.get('user_id')}", 20, 3600):
            return core.too_many_requests()
        data = core.json_body()
        cls, school = find_class(data.get("code"))
        if not cls:
            return err("We could not find that class code. Please check it with your school.", 404)
        c_first, c_last = child_names(data)
        if not c_first:
            return err("Please enter your child's first name.")
        me = db().users.find_one({"_id": oid(session.get("user_id"))}) or {}
        if len(me.get("child_ids") or []) >= 10:
            return err("You can add up to 10 children. Please contact us for more.")
        parent_details = {"name": f"{me.get('first_name', '')} {me.get('last_name', '')}".strip(),
                          "email": me.get("username", ""), "phone": me.get("phone", "")}
        child_id, login = create_student(db(), core.bcrypt, cls, c_first, c_last, parent_details,
                                         session.get("user_id"), extra={"joined_with_code": True})
        db().users.update_one({"_id": me["_id"]}, {"$addToSet": {"child_ids": child_id}})
        return jsonify({"message": "Child added.", "_id": child_id, "child_login": login,
                        **class_payload(cls, school)}), 201

    @app.route("/api/parent/children/<child_id>/reset-password", methods=["POST"])
    def parent_reset_child_password(child_id):
        session = parent_session()
        if not session or not can_view_student(db(), session, child_id):
            return err("Child not found.", 404)
        child = db().users.find_one({"_id": oid(child_id)})
        password = kid_password()
        db().users.update_one({"_id": child["_id"]}, {"$set": {
            "password": core.bcrypt.generate_password_hash(password).decode("utf-8")}})
        db().sessions.delete_many({"user_id": str(child["_id"])})
        return jsonify({"message": "New password created. It is shown only once.",
                        "login": {"username": child.get("username"), "password": password}})

    @app.route("/api/parent/settings", methods=["PUT"])
    def parent_settings():
        session = parent_session()
        if not session:
            return err("Unauthorized", 401)
        data = core.json_body()
        update = {}
        if isinstance(data.get("weekly_email"), bool):
            update["weekly_email"] = data["weekly_email"]
        phone = core.clean_str(data.get("phone"), 30)
        if phone is not None:
            update["phone"] = phone
        if update:
            db().users.update_one({"_id": oid(session.get("user_id"))}, {"$set": update})
        return jsonify({"message": "Saved."})

    @app.route("/api/parent/unsubscribe", methods=["GET"])
    def parent_unsubscribe():
        parent_id = core.clean_str(request.args.get("id"), 24) or ""
        token = core.clean_str(request.args.get("t"), 64) or ""
        expected = unsubscribe_token(parent_id)
        if not expected or not hmac.compare_digest(token, expected) or not oid(parent_id):
            return "This link is not valid. You can turn the weekly email off on your parent page.", 400
        db().users.update_one({"_id": oid(parent_id), "user_type": "parent"}, {"$set": {"weekly_email": False}})
        return ("<p style='font-family:Arial;padding:24px'>Done. You will not get the weekly AI Tutor email any more. "
                "You can turn it back on from your parent page.</p>")

    @app.route("/api/cron/weekly-report", methods=["GET", "POST"])
    def weekly_report_cron():
        secret = os.getenv("CRON_SECRET") or ""
        header = request.headers.get("Authorization", "")
        if not secret or not hmac.compare_digest(header.encode(), f"Bearer {secret}".encode()):
            return err("Unauthorized", 401)
        result = send_weekly_reports(db(), site_url(), dry_run=request.args.get("dry_run") == "1")
        result.pop("preview", None)
        return jsonify(result)

    @app.route("/api/admin/weekly-report/preview", methods=["GET"])
    def weekly_report_preview():
        session = core.current_session()
        if not session or session.get("user_type") != "admin":
            return err("Unauthorized", 401)
        return jsonify(send_weekly_reports(db(), site_url(), dry_run=True))
