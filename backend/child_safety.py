"""Child safety for everything that goes to or comes from AI services (ages 3-6).

Going out:   redact_for_ai() removes emails, phone numbers, ID-card numbers, web links, AI Tutor logins
             and the child's own name before a question/message/topic is sent to Groq, Gemini,
             Replicate or Hugging Face.
Coming back: an after-request filter checks every AI answer. Links are removed, and an answer with
             unsafe words is replaced by a kind, neutral one (quiz questions with them are dropped).
"""
import re

from flask import request

AI_PATHS = {"/api/ai", "/api/chat", "/generate-poem", "/api/generate-ai-quiz"}

# Extra rules added to every AI system prompt.
AI_SAFETY_RULES = (
    "\nSAFETY RULES (always follow): You are talking with a young child aged 3-6. "
    "Never ask for or repeat names, addresses, phone numbers, schools, photos or any personal details. "
    "Never suggest meeting anyone, visiting websites or downloading anything. "
    "Only talk about safe, kind, age-appropriate learning topics; if asked about anything else, "
    "gently suggest a learning topic instead.\n"
)

SAFE_FALLBACK = "Let's learn something fun together! 🌟 Try asking me about letters, numbers, colours or animals."

_EMAIL = re.compile(r"[\w.+-]+@[\w-]+(\.[\w-]+)+")
_URL = re.compile(r"(https?://|www\.)\S+", re.I)
_CNIC = re.compile(r"\b\d{5}-?\d{7}-?\d\b")
_PHONE = re.compile(r"(?<!\w)(\+?\d[\d\s().-]{6,}\d)(?!\w)")

# Whole words only; kept short on purpose (teaching words like "kill time" are rare for ages 3-6).
_BLOCKED = re.compile(
    r"\b(sex\w*|porn\w*|nude\w*|naked|kill\w*|murder\w*|suicide|gun|guns|knife|knives|bomb\w*|"
    r"drug\w*|cocaine|alcohol|beer|wine|cigarette\w*|vape|gambl\w*|casino|hate|stupid|idiot|dumb|"
    r"shut up|damn|hell|fuck\w*|shit\w*|bitch\w*|bastard\w*|dating|girlfriend|boyfriend|kiss\w*)\b",
    re.I,
)


def redact_for_ai(text, names=()):
    """Remove personal details from text before it leaves for an AI service."""
    if not isinstance(text, str):
        return text
    text = _EMAIL.sub("[email]", text)
    text = _URL.sub("[link]", text)
    text = _CNIC.sub("[id]", text)
    text = _PHONE.sub("[number]", text)
    for name in names:
        if isinstance(name, str) and len(name.strip()) >= 2:
            text = re.sub(rf"\b{re.escape(name.strip())}\b", "the child", text, flags=re.I)
    return text


def is_unsafe(text):
    return isinstance(text, str) and bool(_BLOCKED.search(text))


def safe_reply(text):
    """An AI answer that is fine for a young child: no links, and nothing unsafe."""
    if not isinstance(text, str):
        return text
    if is_unsafe(text):
        return SAFE_FALLBACK
    return _URL.sub("", text).strip()


def _safe_question(q):
    if not isinstance(q, dict):
        return False
    parts = [q.get("question"), q.get("answer"), *(q.get("options") or [])]
    return not any(is_unsafe(p) for p in parts if isinstance(p, str))


def filter_ai_response(response):
    """Flask after_request hook: checks AI answers before they reach the child."""
    if request.path not in AI_PATHS or not response.is_json:
        return response
    data = response.get_json(silent=True)
    if not isinstance(data, dict):
        return response
    changed = False
    for key in ("text", "reply", "poem"):
        if isinstance(data.get(key), str):
            cleaned = safe_reply(data[key])
            if cleaned != data[key]:
                data[key] = cleaned
                changed = True
    if isinstance(data.get("questions"), list):
        kept = [q for q in data["questions"] if _safe_question(q)]
        if len(kept) != len(data["questions"]):
            data["questions"] = kept
            changed = True
    if changed:
        import json
        response.set_data(json.dumps(data))
    return response


def names_for_session(db, session, oid):
    """The signed-in child's own names, so they can be removed from AI prompts."""
    if not session or db is None or session.get("user_type") != "child":
        return ()
    user = db.users.find_one({"_id": oid(session.get("user_id"))}, {"first_name": 1, "last_name": 1}) or {}
    return tuple(n for n in (user.get("first_name"), user.get("last_name")) if n)
