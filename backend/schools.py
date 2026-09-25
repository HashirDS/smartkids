"""Schools, classes, principals, and who-can-see-which-child rules.

Structure:  Admin -> School -> Principal
                          -> Classes -> Teachers (teacher_ids) and Students (user.class_ids)

Every teacher/principal query about children goes through `visible_student_filter`
so staff only ever see children in their own school (principal) or classes (teacher).
"""
import re
import secrets
from datetime import datetime

from bson.objectid import ObjectId
from flask import jsonify, request
from validators import email as valid_email

LEVELS = {"preschool": "PRE", "nursery": "NUR", "prep": "PREP", "kg1": "KG1"}
LEVEL_LABELS = {"preschool": "Preschool", "nursery": "Nursery", "prep": "Prep", "kg1": "KG1"}
CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"  # no 0/O or 1/I/L confusion
KID_WORDS = ["lion", "tiger", "panda", "koala", "zebra", "parrot", "mango", "apple", "star", "moon", "rocket", "kite"]
LESSON_KEYS = {"abc", "numbers", "shapes", "colors", "fruits", "drawing", "poems", "flags", "quiz"}


def oid(value):
    return ObjectId(value) if isinstance(value, str) and ObjectId.is_valid(value) else None


def new_class_code(db, level):
    prefix = LEVELS.get(level, "CLS")
    for _ in range(50):
        code = f"{prefix}-{''.join(secrets.choice(CODE_ALPHABET) for _ in range(4))}"
        if not db.classes.find_one({"code": code}):
            return code
    raise RuntimeError("Could not create a unique class code")


# ---------------------------------------------------------------------------
# Default school: keeps accounts made before schools existed working.
# ---------------------------------------------------------------------------

def default_school_and_class(db):
    school = db.schools.find_one({"is_default": True})
    if not school:
        school = {"name": "Default school", "city": "", "country": "", "is_default": True,
                  "restricted_lessons": [], "created_at": datetime.utcnow()}
        school["_id"] = db.schools.insert_one(school).inserted_id
    school_id = str(school["_id"])
    cls = db.classes.find_one({"school_id": school_id, "is_default": True})
    if not cls:
        cls = {"school_id": school_id, "name": "General class", "level": "kg1", "is_default": True,
               "code": new_class_code(db, "kg1"), "teacher_ids": [], "created_at": datetime.utcnow()}
        cls["_id"] = db.classes.insert_one(cls).inserted_id
    return school_id, str(cls["_id"])


def assign_to_default(db, user_id, user_type):
    """Self-registered children and teachers join the default school's general class."""
    school_id, class_id = default_school_and_class(db)
    db.users.update_one({"_id": ObjectId(str(user_id))}, {"$set": {"school_id": school_id, "class_ids": [class_id]}})
    if user_type == "teacher":
        db.classes.update_one({"_id": ObjectId(class_id)}, {"$addToSet": {"teacher_ids": str(user_id)}})


def migrate_existing_users(db):
    """One-time move of old students/teachers (no school yet) into the default school."""
    query = {"user_type": {"$in": ["child", "teacher"]}, "school_id": {"$exists": False}}
    if db.users.count_documents(query, limit=1) == 0:
        return 0
    moved = 0
    for user in list(db.users.find(query, {"_id": 1, "user_type": 1})):
        assign_to_default(db, user["_id"], user["user_type"])
        moved += 1
    return moved


# ---------------------------------------------------------------------------
# Students and parent accounts (shared by school staff and the parent /join page)
# ---------------------------------------------------------------------------

def kid_username(db, first):
    base = re.sub(r"[^a-z]", "", (first or "").lower())[:12] or "kid"
    for _ in range(50):
        username = f"{base}{secrets.randbelow(9000) + 1000}@kids.aitutor"
        if not db.users.find_one({"username": username}):
            return username
    raise RuntimeError("Could not create a unique login")


def kid_password():
    return f"{secrets.choice(KID_WORDS)}-{secrets.randbelow(9000) + 1000}"


def create_student(db, bcrypt, cls, first, last, parent, created_by, password=None, extra=None):
    """Create a child account in `cls` with an empty progress record. Returns (id, login)."""
    password = password or kid_password()
    username = kid_username(db, first)
    student = {
        "first_name": first, "last_name": last, "username": username,
        "password": bcrypt.generate_password_hash(password).decode("utf-8"),
        "user_type": "child", "school_id": cls["school_id"], "class_ids": [str(cls["_id"])],
        "level": cls.get("level"), "parent": parent or {},
        "created_by": created_by, "created_at": datetime.utcnow(),
    }
    student.update(extra or {})
    student_id = db.users.insert_one(student).inserted_id
    db.progress.insert_one({
        "_id": student_id, "child_name": f"{first} {last}".strip(),
        "completed_items": {k: [] for k in ("abc", "numbers", "shapes", "colors", "poems", "fruits", "flags")},
        "total_score": 0, "last_activity": None,
    })
    return str(student_id), {"username": username, "password": password}


def link_parent(db, bcrypt, student_id, parent, previous_email=""):
    """Connect a child to the parent account for parent["email"], creating it when needed.

    Returns (login, note): `login` is a one-time {username, password} when a new parent
    account was made; `note` explains when the email could not be linked.
    """
    student_id = str(student_id)
    email = ((parent or {}).get("email") or "").lower()
    if previous_email and previous_email.lower() != email:
        db.users.update_one({"user_type": "parent", "username": previous_email.lower()},
                            {"$pull": {"child_ids": student_id}})
    if not email:
        return None, None
    existing = db.users.find_one({"username": email})
    if existing:
        if existing.get("user_type") != "parent":
            return None, "That email belongs to a staff or student account, so no parent login was made."
        db.users.update_one({"_id": existing["_id"]}, {"$addToSet": {"child_ids": student_id}})
        return None, "Linked to the parent's existing account."
    name = ((parent or {}).get("name") or "").split()
    password = secrets.token_urlsafe(9)
    db.users.insert_one({
        "first_name": name[0] if name else "Parent", "last_name": " ".join(name[1:]),
        "username": email, "password": bcrypt.generate_password_hash(password).decode("utf-8"),
        "user_type": "parent", "child_ids": [student_id], "phone": (parent or {}).get("phone", ""),
        "weekly_email": True, "created_at": datetime.utcnow(),
    })
    return {"username": email, "password": password}, None


# ---------------------------------------------------------------------------
# Visibility
# ---------------------------------------------------------------------------

def staff_record(db, session):
    if not session or session.get("user_type") not in ("teacher", "principal"):
        return None
    return db.users.find_one({"_id": oid(session.get("user_id"))}) or {}


def visible_student_filter(db, session):
    """MongoDB filter on `users` matching the children this user may see."""
    role = (session or {}).get("user_type")
    if role == "admin":
        return {"user_type": "child"}
    if role == "principal":
        me = staff_record(db, session)
        return {"user_type": "child", "school_id": me.get("school_id") or "__none__"}
    if role == "teacher":
        me = staff_record(db, session)
        return {"user_type": "child", "class_ids": {"$in": me.get("class_ids") or []}}
    if role == "parent":
        me = db.users.find_one({"_id": oid(session.get("user_id"))}) or {}
        return {"user_type": "child", "_id": {"$in": [o for o in map(oid, me.get("child_ids") or []) if o]}}
    return {"_id": {"$in": []}}


def visible_student_ids(db, session):
    return [str(u["_id"]) for u in db.users.find(visible_student_filter(db, session), {"_id": 1})]


def can_view_student(db, session, student_id):
    if not session:
        return False
    role = session.get("user_type")
    if role == "child":
        return session.get("user_id") == str(student_id)
    student_oid = oid(str(student_id))
    if not student_oid or role not in ("admin", "principal", "teacher", "parent"):
        return False
    # $and keeps the filter's own _id rule (parents) instead of overwriting it.
    query = {"$and": [visible_student_filter(db, session), {"_id": student_oid}]}
    return db.users.count_documents(query, limit=1) > 0


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

def register_school_routes(app, core):
    """`core` is the main app module (db, sessions, bcrypt, helpers)."""

    def db():
        return core.db

    def err(message, status=400):
        return jsonify({"message": message}), status

    def session_for(*roles):
        session = core.current_session()
        if not session or session.get("user_type") not in roles:
            return None
        return session

    def school_payload(school):
        return {"_id": str(school["_id"]), "name": school.get("name", ""), "city": school.get("city", ""),
                "country": school.get("country", ""), "is_default": bool(school.get("is_default")),
                "restricted_lessons": school.get("restricted_lessons", [])}

    def person(user, extra=None):
        data = {"_id": str(user["_id"]), "first_name": user.get("first_name", ""),
                "last_name": user.get("last_name", ""), "email": user.get("username", ""),
                "restricted": bool(user.get("restricted"))}
        data.update(extra or {})
        return data

    def resolve_school(session, school_id=None):
        """Admin picks any school; principal and teacher are locked to their own."""
        if session.get("user_type") == "admin":
            school = db().schools.find_one({"_id": oid(school_id)}) if school_id else None
        else:
            me = staff_record(db(), session)
            school = db().schools.find_one({"_id": oid(me.get("school_id"))}) if me.get("school_id") else None
        return school

    def temp_password():
        return secrets.token_urlsafe(9)

    def check_password(value, minimum=6):
        return isinstance(value, str) and minimum <= len(value) <= 128

    # ----- who am I ---------------------------------------------------------
    @app.route("/api/me", methods=["GET"])
    def me():
        session = core.current_session()
        if not session:
            return err("Unauthorized", 401)
        role = session.get("user_type")
        if role == "admin":
            return jsonify({"user_type": "admin", "first_name": "System", "last_name": "Administrator", "school": None, "classes": []})
        user = db().users.find_one({"_id": oid(session.get("user_id"))}) or {}
        school = db().schools.find_one({"_id": oid(user.get("school_id"))}) if user.get("school_id") else None
        classes = list(db().classes.find({"_id": {"$in": [oid(c) for c in user.get("class_ids") or [] if oid(c)]}}))
        return jsonify({
            "user_type": role, "first_name": user.get("first_name", ""), "last_name": user.get("last_name", ""),
            "school": school_payload(school) if school else None,
            "classes": [{"_id": str(c["_id"]), "name": c.get("name"), "level": c.get("level")} for c in classes],
        })

    # ----- admin: schools ---------------------------------------------------
    @app.route("/api/admin/schools", methods=["GET"])
    def admin_list_schools():
        if not session_for("admin"):
            return err("Unauthorized", 401)
        rows = []
        for school in db().schools.find().sort("created_at", 1):
            sid = str(school["_id"])
            principal = db().users.find_one({"user_type": "principal", "school_id": sid})
            rows.append({
                **school_payload(school),
                "principal": person(principal) if principal else None,
                "classes": db().classes.count_documents({"school_id": sid}),
                "teachers": db().users.count_documents({"user_type": "teacher", "school_id": sid}),
                "students": db().users.count_documents({"user_type": "child", "school_id": sid}),
            })
        return jsonify(rows)

    @app.route("/api/admin/schools", methods=["POST"])
    def admin_create_school():
        if not session_for("admin"):
            return err("Unauthorized", 401)
        data = core.json_body()
        name = core.clean_str(data.get("name"), 120)
        city = core.clean_str(data.get("city"), 80) or ""
        country = core.clean_str(data.get("country"), 80) or ""
        p_first = core.clean_str(data.get("principal_first_name"), 60)
        p_last = core.clean_str(data.get("principal_last_name"), 60) or ""
        p_email = (core.clean_str(data.get("principal_email"), 254) or "").lower()
        p_password = data.get("principal_password")
        if not name or not p_first or not p_email:
            return err("School name, principal name and principal email are required.")
        if not valid_email(p_email):
            return err("Principal email is not valid.")
        if p_password in (None, ""):
            p_password = temp_password()
        elif not check_password(p_password, 8):
            return err("Principal password must be 8 to 128 characters.")
        if db().users.find_one({"username": p_email}):
            return err("That email already has an account.", 409)
        school = {"name": name, "city": city, "country": country, "is_default": False,
                  "restricted_lessons": [], "created_at": datetime.utcnow()}
        school_id = str(db().schools.insert_one(school).inserted_id)
        db().users.insert_one({
            "first_name": p_first, "last_name": p_last, "username": p_email,
            "password": core.bcrypt.generate_password_hash(p_password).decode("utf-8"),
            "user_type": "principal", "school_id": school_id, "class_ids": [], "created_at": datetime.utcnow(),
        })
        return jsonify({"message": "School created. Share the principal's login; the password is shown only once.",
                        "school_id": school_id, "login": {"username": p_email, "password": p_password}}), 201

    @app.route("/api/admin/schools/<school_id>", methods=["PUT"])
    def admin_update_school(school_id):
        if not session_for("admin"):
            return err("Unauthorized", 401)
        data = core.json_body()
        update = {}
        for field, limit in (("name", 120), ("city", 80), ("country", 80)):
            value = core.clean_str(data.get(field), limit)
            if value is not None:
                update[field] = value
        if not update.get("name", "x"):
            return err("School name cannot be empty.")
        result = db().schools.update_one({"_id": oid(school_id)}, {"$set": update})
        if result.matched_count == 0:
            return err("School not found.", 404)
        return jsonify({"message": "School updated."})

    @app.route("/api/admin/schools/<school_id>", methods=["DELETE"])
    def admin_delete_school(school_id):
        if not session_for("admin"):
            return err("Unauthorized", 401)
        school = db().schools.find_one({"_id": oid(school_id)})
        if not school:
            return err("School not found.", 404)
        if school.get("is_default"):
            return err("The default school cannot be deleted.")
        sid = str(school["_id"])
        if db().users.count_documents({"school_id": sid, "user_type": {"$in": ["child", "teacher"]}}, limit=1):
            return err("Move or remove this school's teachers and students first.")
        principals = [str(u["_id"]) for u in db().users.find({"school_id": sid, "user_type": "principal"}, {"_id": 1})]
        db().users.delete_many({"school_id": sid, "user_type": "principal"})
        db().sessions.delete_many({"user_id": {"$in": principals}})
        db().classes.delete_many({"school_id": sid})
        db().schools.delete_one({"_id": school["_id"]})
        return jsonify({"message": "School deleted."})

    # ----- school overview (principal, admin, teacher) ----------------------
    @app.route("/api/school", methods=["GET"])
    def school_overview():
        session = session_for("admin", "principal", "teacher")
        if not session:
            return err("Unauthorized", 401)
        school = resolve_school(session, request.args.get("school_id"))
        if not school:
            return err("No school found for this account.", 404)
        sid = str(school["_id"])
        role = session.get("user_type")
        class_query = {"school_id": sid}
        if role == "teacher":
            me = staff_record(db(), session)
            class_query["_id"] = {"$in": [oid(c) for c in me.get("class_ids") or [] if oid(c)]}
        classes = list(db().classes.find(class_query).sort("created_at", 1))
        class_ids = [str(c["_id"]) for c in classes]

        teachers = list(db().users.find({"user_type": "teacher", "school_id": sid}))
        teacher_names = {str(t["_id"]): f"{t.get('first_name', '')} {t.get('last_name', '')}".strip() for t in teachers}

        student_query = {"user_type": "child", "school_id": sid}
        if role == "teacher":
            student_query["class_ids"] = {"$in": class_ids}
        students = list(db().users.find(student_query).sort("first_name", 1))
        progress = {str(p["_id"]): p for p in db().progress.find({"_id": {"$in": [s["_id"] for s in students]}})}

        def learned(student_id):
            items = (progress.get(student_id) or {}).get("completed_items") or {}
            return sum(len(v) for v in items.values() if isinstance(v, list))

        class_names = {str(c["_id"]): c.get("name") for c in classes}
        student_ids = [str(s["_id"]) for s in students]
        linked_children = {cid for p in db().users.find({"user_type": "parent", "child_ids": {"$in": student_ids}}, {"child_ids": 1})
                           for cid in p.get("child_ids") or []}
        payload = {
            "school": school_payload(school),
            "role": role,
            "levels": LEVEL_LABELS,
            "classes": [{
                "_id": str(c["_id"]), "name": c.get("name"), "level": c.get("level"), "code": c.get("code"),
                "is_default": bool(c.get("is_default")),
                "teacher_ids": c.get("teacher_ids") or [],
                "teachers": [teacher_names.get(t, "") for t in c.get("teacher_ids") or [] if t in teacher_names],
                "students": sum(1 for s in students if str(c["_id"]) in (s.get("class_ids") or [])),
            } for c in classes],
            "students": [person(s, {
                "class_id": (s.get("class_ids") or [None])[0],
                "class_name": class_names.get((s.get("class_ids") or [None])[0], ""),
                "parent": s.get("parent") or {},
                "has_parent_login": str(s["_id"]) in linked_children,
                "joined_with_code": bool(s.get("joined_with_code")),
                "items_learned": learned(str(s["_id"])),
            }) for s in students],
        }
        if role != "teacher":
            payload["teachers"] = [person(t, {"class_ids": t.get("class_ids") or []}) for t in teachers]
        return jsonify(payload)

    @app.route("/api/school/lesson-restrictions", methods=["PUT"])
    def school_lesson_restrictions():
        session = session_for("admin", "principal")
        if not session:
            return err("Unauthorized", 401)
        data = core.json_body()
        school = resolve_school(session, data.get("school_id"))
        if not school:
            return err("School not found.", 404)
        lessons = data.get("restricted_lessons")
        if not isinstance(lessons, list):
            return err("restricted_lessons must be a list")
        lessons = sorted({x for x in lessons if isinstance(x, str) and x in LESSON_KEYS})
        db().schools.update_one({"_id": school["_id"]}, {"$set": {"restricted_lessons": lessons}})
        return jsonify({"message": "School lesson access updated.", "restricted_lessons": lessons})

    # ----- classes ------------------------------------------------------------
    def valid_teacher_ids(school_id, raw):
        if not isinstance(raw, list):
            return []
        wanted = [oid(t) for t in raw[:10] if oid(t)]
        found = db().users.find({"_id": {"$in": wanted}, "user_type": "teacher", "school_id": school_id}, {"_id": 1})
        return [str(t["_id"]) for t in found]

    def sync_teacher_classes(class_id, teacher_ids, school_id):
        """Keep users.class_ids in step with classes.teacher_ids."""
        db().users.update_many({"user_type": "teacher", "school_id": school_id, "class_ids": class_id,
                                "_id": {"$nin": [ObjectId(t) for t in teacher_ids]}},
                               {"$pull": {"class_ids": class_id}})
        if teacher_ids:
            db().users.update_many({"_id": {"$in": [ObjectId(t) for t in teacher_ids]}},
                                   {"$addToSet": {"class_ids": class_id}})

    @app.route("/api/school/classes", methods=["POST"])
    def create_class():
        session = session_for("admin", "principal")
        if not session:
            return err("Unauthorized", 401)
        data = core.json_body()
        school = resolve_school(session, data.get("school_id"))
        if not school:
            return err("School not found.", 404)
        name = core.clean_str(data.get("name"), 60)
        level = data.get("level") if data.get("level") in LEVELS else None
        if not name or not level:
            return err("Class name and level (Preschool, Nursery, Prep or KG1) are required.")
        sid = str(school["_id"])
        teacher_ids = valid_teacher_ids(sid, data.get("teacher_ids"))
        doc = {"school_id": sid, "name": name, "level": level, "code": new_class_code(db(), level),
               "teacher_ids": teacher_ids, "created_at": datetime.utcnow()}
        class_id = str(db().classes.insert_one(doc).inserted_id)
        sync_teacher_classes(class_id, teacher_ids, sid)
        return jsonify({"message": "Class created.", "_id": class_id, "code": doc["code"]}), 201

    def load_class_for(session, class_id, allow_teacher=False):
        cls = db().classes.find_one({"_id": oid(class_id)})
        if not cls:
            return None
        role = session.get("user_type")
        if role == "admin":
            return cls
        me = staff_record(db(), session)
        if cls.get("school_id") != me.get("school_id"):
            return None
        if role == "teacher" and (not allow_teacher or str(cls["_id"]) not in (me.get("class_ids") or [])):
            return None
        return cls

    @app.route("/api/school/classes/<class_id>", methods=["PUT"])
    def update_class(class_id):
        session = session_for("admin", "principal")
        if not session:
            return err("Unauthorized", 401)
        cls = load_class_for(session, class_id)
        if not cls:
            return err("Class not found.", 404)
        data = core.json_body()
        update = {}
        name = core.clean_str(data.get("name"), 60)
        if name:
            update["name"] = name
        if data.get("level") in LEVELS:
            update["level"] = data["level"]
        if "teacher_ids" in data:
            update["teacher_ids"] = valid_teacher_ids(cls["school_id"], data.get("teacher_ids"))
        if update:
            db().classes.update_one({"_id": cls["_id"]}, {"$set": update})
        if "teacher_ids" in update:
            sync_teacher_classes(str(cls["_id"]), update["teacher_ids"], cls["school_id"])
        return jsonify({"message": "Class updated."})

    @app.route("/api/school/classes/<class_id>", methods=["DELETE"])
    def delete_class(class_id):
        session = session_for("admin", "principal")
        if not session:
            return err("Unauthorized", 401)
        cls = load_class_for(session, class_id)
        if not cls:
            return err("Class not found.", 404)
        if cls.get("is_default"):
            return err("The general class of the default school cannot be deleted.")
        cid = str(cls["_id"])
        if db().users.count_documents({"user_type": "child", "class_ids": cid}, limit=1):
            return err("Move this class's students to another class first.")
        db().users.update_many({"class_ids": cid}, {"$pull": {"class_ids": cid}})
        db().classes.delete_one({"_id": cls["_id"]})
        return jsonify({"message": "Class deleted."})

    @app.route("/api/school/classes/<class_id>/new-code", methods=["POST"])
    def new_code(class_id):
        session = session_for("admin", "principal", "teacher")
        if not session:
            return err("Unauthorized", 401)
        cls = load_class_for(session, class_id, allow_teacher=True)
        if not cls:
            return err("Class not found.", 404)
        code = new_class_code(db(), cls.get("level"))
        db().classes.update_one({"_id": cls["_id"]}, {"$set": {"code": code}})
        return jsonify({"message": "New class code created.", "code": code})

    # ----- teachers -------------------------------------------------------------
    @app.route("/api/school/teachers", methods=["POST"])
    def add_teacher():
        """Create a teacher in this school, or attach an existing teacher account by email."""
        session = session_for("admin", "principal")
        if not session:
            return err("Unauthorized", 401)
        data = core.json_body()
        school = resolve_school(session, data.get("school_id"))
        if not school:
            return err("School not found.", 404)
        sid = str(school["_id"])
        teacher_email = (core.clean_str(data.get("email"), 254) or "").lower()
        if not teacher_email or not valid_email(teacher_email):
            return err("A valid teacher email is required.")
        existing = db().users.find_one({"username": teacher_email})
        if existing:
            if existing.get("user_type") != "teacher":
                return err("That email belongs to a non-teacher account.", 409)
            if existing.get("school_id") and existing.get("school_id") != sid:
                old = db().schools.find_one({"_id": oid(existing["school_id"])}) or {}
                if not old.get("is_default") and session.get("user_type") != "admin":
                    return err("That teacher already belongs to another school.", 409)
            tid = str(existing["_id"])
            db().classes.update_many({"teacher_ids": tid}, {"$pull": {"teacher_ids": tid}})
            db().users.update_one({"_id": existing["_id"]}, {
                "$set": {"school_id": sid, "class_ids": [], "restricted": False},
                "$unset": {"pending_approval": ""},
            })
            return jsonify({"message": "Existing teacher added to the school.", "_id": tid}), 200
        first = core.clean_str(data.get("first_name"), 60)
        last = core.clean_str(data.get("last_name"), 60) or ""
        password = data.get("password")
        if not first:
            return err("Teacher first name is required.")
        if password in (None, ""):
            password = temp_password()
        elif not check_password(password, 8):
            return err("Teacher password must be 8 to 128 characters.")
        tid = str(db().users.insert_one({
            "first_name": first, "last_name": last, "username": teacher_email,
            "password": core.bcrypt.generate_password_hash(password).decode("utf-8"),
            "user_type": "teacher", "school_id": sid, "class_ids": [], "created_at": datetime.utcnow(),
        }).inserted_id)
        return jsonify({"message": "Teacher account created. The password is shown only once.", "_id": tid,
                        "login": {"username": teacher_email, "password": password}}), 201

    @app.route("/api/school/teachers/<teacher_id>", methods=["DELETE"])
    def remove_teacher(teacher_id):
        """Remove a teacher from the school (the account moves back to the default school)."""
        session = session_for("admin", "principal")
        if not session:
            return err("Unauthorized", 401)
        teacher = db().users.find_one({"_id": oid(teacher_id), "user_type": "teacher"})
        if not teacher:
            return err("Teacher not found.", 404)
        if session.get("user_type") == "principal" and teacher.get("school_id") != staff_record(db(), session).get("school_id"):
            return err("Teacher not found.", 404)
        tid = str(teacher["_id"])
        db().classes.update_many({"teacher_ids": tid}, {"$pull": {"teacher_ids": tid}})
        default_sid, _ = default_school_and_class(db())
        db().users.update_one({"_id": teacher["_id"]}, {"$set": {"school_id": default_sid, "class_ids": []}})
        db().sessions.delete_many({"user_id": tid})
        return jsonify({"message": "Teacher removed from the school."})

    # ----- students ---------------------------------------------------------------
    def clean_parent(data):
        parent = data.get("parent") if isinstance(data.get("parent"), dict) else {}
        p_email = (core.clean_str(parent.get("email"), 254) or "").lower()
        if p_email and not valid_email(p_email):
            return None, "Parent email is not valid."
        return {
            "name": core.clean_str(parent.get("name"), 120) or "",
            "email": p_email,
            "phone": re.sub(r"[^0-9+\-() ]", "", core.clean_str(parent.get("phone"), 30) or ""),
        }, None

    @app.route("/api/school/students", methods=["POST"])
    def add_student():
        session = session_for("admin", "principal", "teacher")
        if not session:
            return err("Unauthorized", 401)
        data = core.json_body()
        cls = load_class_for(session, data.get("class_id"), allow_teacher=True)
        if not cls:
            return err("Choose one of your classes.", 404)
        first = core.clean_str(data.get("first_name"), 60)
        last = core.clean_str(data.get("last_name"), 60) or ""
        if not first:
            return err("The child's first name is required.")
        parent, problem = clean_parent(data)
        if problem:
            return err(problem)
        password = data.get("password")
        if password not in (None, "") and not check_password(password, 6):
            return err("Password must be 6 to 128 characters.")
        student_id, login = create_student(db(), core.bcrypt, cls, first, last, parent,
                                           session.get("user_id"), password or None)
        parent_login, parent_note = link_parent(db(), core.bcrypt, student_id, parent)
        return jsonify({
            "message": "Student added. Share this login with the parent; the password is shown only once.",
            "_id": student_id, "login": login, "parent_login": parent_login, "parent_note": parent_note,
        }), 201

    @app.route("/api/school/students/<student_id>", methods=["PUT"])
    def update_student(student_id):
        session = session_for("admin", "principal", "teacher")
        if not session:
            return err("Unauthorized", 401)
        if not can_view_student(db(), session, student_id):
            return err("Student not found.", 404)
        student = db().users.find_one({"_id": oid(student_id)})
        data = core.json_body()
        update = {}
        parent_login = parent_note = None
        for field in ("first_name", "last_name"):
            value = core.clean_str(data.get(field), 60)
            if value:
                update[field] = value
        if "parent" in data:
            parent, problem = clean_parent(data)
            if problem:
                return err(problem)
            update["parent"] = parent
            parent_login, parent_note = link_parent(db(), core.bcrypt, student_id, parent,
                                                    (student.get("parent") or {}).get("email", ""))
        if data.get("class_id"):
            cls = load_class_for(session, data.get("class_id"), allow_teacher=True)
            if not cls:
                return err("Choose one of your classes.", 404)
            if session.get("user_type") != "admin" and cls["school_id"] != student.get("school_id"):
                return err("Choose a class in the student's school.", 400)
            update.update({"class_ids": [str(cls["_id"])], "school_id": cls["school_id"], "level": cls.get("level")})
        if update:
            db().users.update_one({"_id": student["_id"]}, {"$set": update})
        return jsonify({"message": "Student updated.", "parent_login": parent_login, "parent_note": parent_note})

    @app.route("/api/school/students/<student_id>/reset-password", methods=["POST"])
    def reset_student_password(student_id):
        session = session_for("admin", "principal", "teacher")
        if not session:
            return err("Unauthorized", 401)
        if not can_view_student(db(), session, student_id):
            return err("Student not found.", 404)
        password = kid_password()
        student = db().users.find_one({"_id": oid(student_id)})
        db().users.update_one({"_id": student["_id"]}, {"$set": {
            "password": core.bcrypt.generate_password_hash(password).decode("utf-8")}})
        db().sessions.delete_many({"user_id": str(student["_id"])})
        return jsonify({"message": "New password created. It is shown only once.",
                        "login": {"username": student.get("username"), "password": password}})
