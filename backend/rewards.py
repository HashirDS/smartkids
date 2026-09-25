"""Stickers, badges and daily streaks.

* Sticker: one for every item a child has learned (from progress.completed_items).
* Streak: days in a row with learning. Each learning action adds today's date (Pakistan time)
  to progress.active_days; the streak is still alive until the end of the next day.
* Badges: worked out from stickers, streaks and quizzes, so nothing extra is stored.
"""
from datetime import datetime, timedelta

from flask import jsonify

from schools import can_view_student, oid

PK_OFFSET = timedelta(hours=5)  # Pakistan time (no daylight saving)

LESSON_BADGES = [
    # key, lesson, title, emoji, goal
    ("abc_star", "abc", "ABC Star", "🔤", 10),
    ("number_star", "numbers", "Number Star", "🔢", 10),
    ("shape_star", "shapes", "Shape Star", "🔷", 5),
    ("colour_star", "colors", "Colour Star", "🎨", 5),
    ("fruit_star", "fruits", "Fruit Star", "🍉", 5),
    ("flag_explorer", "flags", "Flag Explorer", "🚩", 10),
    ("urdu_star", "urdu", "Urdu Star", "📜", 10),
    ("qaida_star", "arabic", "Qaida Star", "📖", 10),
    ("islamic_star", "islamic", "Islamic Studies Star", "🕌", 10),
    ("little_scientist", "science", "Little Scientist", "🔬", 10),
    ("animal_friend", "animals", "Animal Friend", "🦁", 10),
]
STICKER_BADGES = [
    ("first_sticker", "First Sticker", "🌟", 1),
    ("stickers_10", "10 Stickers", "🎈", 10),
    ("stickers_25", "25 Stickers", "🎁", 25),
    ("stickers_50", "50 Stickers", "🏆", 50),
    ("stickers_100", "100 Stickers", "👑", 100),
]
STREAK_BADGES = [
    ("streak_3", "3-day streak", "🔥", 3),
    ("streak_7", "7-day streak", "🚀", 7),
    ("streak_30", "30-day streak", "🌈", 30),
]


def pk_today(now=None):
    return ((now or datetime.utcnow()) + PK_OFFSET).date()


def record_activity(db, user_id, now=None):
    """Mark today as a learning day for this child (safe to call many times a day)."""
    child_oid = oid(str(user_id))
    if db is None or not child_oid:
        return
    try:
        db.progress.update_one({"_id": child_oid}, {"$addToSet": {"active_days": pk_today(now).isoformat()}})
    except Exception as e:
        print(f"Could not record activity: {e}")


def _parse_day(value):
    try:
        return datetime.fromisoformat(str(value)[:10]).date()
    except ValueError:
        return None


def streak_info(progress, now=None):
    today = pk_today(now)
    days = {d for d in map(_parse_day, progress.get("active_days") or []) if d}
    if not days and progress.get("last_activity"):
        # Children who learned before streaks existed get their last day counted.
        last = _parse_day(progress["last_activity"])
        if last:
            days.add(last)

    # Current streak: ends today, or yesterday if today has no learning yet.
    start = today if today in days else today - timedelta(days=1)
    current = 0
    while start - timedelta(days=current) in days:
        current += 1

    longest, run, previous = 0, 0, None
    for day in sorted(days):
        run = run + 1 if previous and day - previous == timedelta(days=1) else 1
        longest = max(longest, run)
        previous = day

    week = [(today - timedelta(days=6 - i)) in days for i in range(7)]
    return {"current": current, "longest": max(longest, current), "today_done": today in days,
            "last_7_days": week, "active_days": len(days)}


def rewards_for(db, child_id, now=None):
    child_oid = oid(str(child_id))
    progress = db.progress.find_one({"_id": child_oid}) or {}
    completed = progress.get("completed_items") or {}
    per_lesson = {k: len(v) for k, v in completed.items() if isinstance(v, list)}
    stickers = sum(per_lesson.values())
    streak = streak_info(progress, now)

    user = db.users.find_one({"_id": child_oid}, {"quiz_history": 1}) or {}
    quizzes = user.get("quiz_history") or []
    perfect = any((q.get("percentage") or 0) >= 100 for q in quizzes)

    badges = []

    def add(key, title, emoji, value, goal, group):
        badges.append({"key": key, "title": title, "emoji": emoji, "group": group,
                       "earned": value >= goal, "progress": min(value, goal), "goal": goal})

    for key, title, emoji, goal in STICKER_BADGES:
        add(key, title, emoji, stickers, goal, "stickers")
    for key, title, emoji, goal in STREAK_BADGES:
        add(key, title, emoji, streak["longest"], goal, "streaks")
    for key, lesson, title, emoji, goal in LESSON_BADGES:
        add(key, title, emoji, per_lesson.get(lesson, 0), goal, "lessons")
    add("first_quiz", "First Quiz", "📝", len(quizzes), 1, "quizzes")
    add("perfect_quiz", "Perfect Score", "💯", 1 if perfect else 0, 1, "quizzes")

    return {
        "stickers": stickers,
        "completed_items": {k: v for k, v in completed.items() if isinstance(v, list)},
        "streak": streak,
        "badges": badges,
        "badges_earned": sum(1 for b in badges if b["earned"]),
    }


def register_reward_routes(app, core):

    @app.route("/api/rewards/<user_id>", methods=["GET"])
    def get_rewards(user_id):
        session = core.current_session()
        if not session:
            return jsonify({"message": "Unauthorized"}), 401
        if not can_view_student(core.db, session, user_id):
            return jsonify({"message": "Child not found."}), 404
        return jsonify(rewards_for(core.db, user_id))
