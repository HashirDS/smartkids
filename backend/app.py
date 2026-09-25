import sys
sys.stdout.reconfigure(line_buffering=True)
import random
import sys
from flask import Flask, request, jsonify, Response

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass
from flask_cors import CORS
from pymongo import MongoClient
from flask_bcrypt import Bcrypt
import requests
import os
from dotenv import load_dotenv
from validators import email
import base64
import bcrypt
from datetime import datetime, timedelta
from bson.objectid import ObjectId
from pymongo import ReturnDocument
from xml.sax.saxutils import escape as xml_escape
import hmac
from werkzeug.security import check_password_hash
# --- NEW IMPORTS FOR AI & TTS ---
import json
import os
import base64
import io
from flask import Flask, request, jsonify
import os

# Heavy SDKs stay optional so the Vercel function stays under the size limit.
# Browser speech covers pronunciation when these packages are not installed.
speechsdk = None
replicate = None
gTTS = None
genai = None
# --- NEW IMPORTS FOR SPEECH SYSTEM ---
import tempfile
import time
import secrets
from difflib import SequenceMatcher
from werkzeug.utils import secure_filename

# ---------------------------------

# --- IMPORTS FOR LOCAL MODEL (for Poem Generator) ---

# ---
# Load environment variables from backend/.env, then the project .env.
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# Initialize the Flask application
app = Flask(__name__)

@app.route("/")
def home():
    return "SmartTutor Backend is running!"

# Reject oversized uploads (speech recordings are a few hundred KB at most).
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024

# Cross-Origin Resource Sharing: the live site calls its own API (same origin),
# so only local development and any origins listed in CORS_ORIGINS are allowed.
_cors_origins = [r"http://localhost(:\d+)?", r"http://127\.0\.0\.1(:\d+)?"]
_cors_origins += [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
CORS(app, origins=_cors_origins, expose_headers=["Visemes"])

@app.after_request
def add_security_headers(response):
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    return response

# Initialize the bcrypt extension
bcrypt = Bcrypt(app)

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    print("MONGO_URI is not set. Add it to the .env file.")
    db = None
else:
    try:
        client = MongoClient(MONGO_URI)
        db = client.smart_tutor
        print("Successfully connected to MongoDB.")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        db = None

SESSION_DAYS = 30

if db is not None:
    try:
        # Old sessions and rate-limit counters are removed by MongoDB automatically.
        db.sessions.create_index("created_at", expireAfterSeconds=SESSION_DAYS * 24 * 3600)
        db.sessions.create_index("token")
        db.rate_limits.create_index("expires_at", expireAfterSeconds=0)
    except Exception as e:
        print(f"Could not create indexes: {e}")

def issue_token(user_id, user_type):
    token = secrets.token_urlsafe(32)
    db.sessions.insert_one({
        "token": token,
        "user_id": str(user_id),
        "user_type": user_type,
        "created_at": datetime.utcnow(),
    })
    return token

def _bearer_token():
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    return header[7:].strip() or None

def current_session():
    if db is None:
        return None
    token = _bearer_token()
    if not token:
        return None
    session = db.sessions.find_one({"token": token})
    if not session:
        return None
    created = session.get("created_at")
    if isinstance(created, datetime) and datetime.utcnow() - created > timedelta(days=SESSION_DAYS):
        db.sessions.delete_one({"_id": session["_id"]})
        return None
    return session

def reject_unless(*roles):
    session = current_session()
    if not session or session.get("user_type") not in roles:
        return jsonify({"message": "Unauthorized"}), 401
    return None

def client_ip():
    # Vercel sets x-real-ip / x-forwarded-for to the visitor's address.
    ip = request.headers.get("X-Real-Ip") or request.headers.get("X-Forwarded-For", "").split(",")[0]
    return (ip or request.remote_addr or "unknown").strip()

def rate_limited(key, limit, window_seconds):
    """Count a request against `key`; True once more than `limit` happen in the window."""
    if db is None:
        return False
    bucket = int(time.time() // window_seconds)
    try:
        doc = db.rate_limits.find_one_and_update(
            {"_id": f"{key}:{bucket}"},
            {
                "$inc": {"count": 1},
                "$setOnInsert": {"expires_at": datetime.utcnow() + timedelta(seconds=window_seconds * 2)},
            },
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
        return doc.get("count", 0) > limit
    except Exception as e:
        print(f"Rate limit check failed: {e}")
        return False

def too_many_requests():
    return jsonify({"message": "Too many requests. Please wait a few minutes and try again."}), 429

def json_body():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}

def clean_str(value, max_len):
    """Return a trimmed string, or None when the value is not a plain string (blocks $-operator injection)."""
    if not isinstance(value, str):
        return None
    return value.strip()[:max_len]

# (Your API Key Code... UNCHANGED)
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY') or os.getenv('VITE_GEMINI_API_KEY')
ELEVENLABS_API_KEY = os.getenv('ELEVENLABS_API_KEY')
SPEECH_KEY = os.getenv("SPEECH_KEY")
SPEECH_REGION = os.getenv("SPEECH_REGION")
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")

# --- GROQ CLIENT INITIALIZATION ---
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("⚠️ WARNING: GROQ_API_KEY not found in environment variables.")
    groq_client = None
else:
    try:
        from groq import Groq
        groq_client = Groq(api_key=GROQ_API_KEY)
        print("✅ Groq client initialized successfully")
    except ImportError:
        print("⚠️ WARNING: Groq package not installed")
        groq_client = None

if not GEMINI_API_KEY:
    print("Warning: GEMINI_API_KEY not found in environment variables.")
if not ELEVENLABS_API_KEY:
    print("Warning: ELEVENLABS_API_KEY not found in environment variables.")
if not SPEECH_KEY or not SPEECH_REGION:
    print("Warning: Azure TTS SPEECH_KEY or SPEECH_REGION not found in environment variables.")



# --- Helper Function: System Instruction (UNCHANGED) ---
def system_instruction(topic):
    return f"""
    You are a cheerful Kindergarten Teacher for a 3-year-old child.
    
    STRICT RULES FOR RESPONSE:
    1. ZERO FLUFF: Do not say "Let's learn" or "Here we go". Start the lesson immediately.
    2. BE INSTRUCTIONAL: 
       - If asked for "ABC", say ONLY: "A is for Apple 🍎, B is for Ball 🏀, C is for Cat 🐱!"
       - If asked for "Colors", say ONLY: "Red like a Strawberry 🍓, Blue like the Sky ☁️!"
    3. KEEP IT SHORT: Max 2 sentences.
    4. NO GREETINGS: Do not say "Hello" unless the user specifically said "Hi" or "Hello" first.
    5. TONE: Simple, happy, and educational. Use emojis.

    User Request: {topic}
    """

# --- existing Helper Function (UNCHANGED) ---
def make_text_baby_friendly(text):
    lines = text.strip().split('\n')
    processed_lines = []
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
        line = line.replace('.', '... ')
        # ... (rest of your function) ...
        processed_lines.append(line)
    processed_text = ' '.join(processed_lines)
    processed_text = f"Hello little one! {processed_text} ... Wasn't that fun?"
    return processed_text

# --- SPEECH HELPER FUNCTIONS ---
def normalize_text(text):
    """Remove punctuation and extra spaces, convert to uppercase"""
    import re
    text = re.sub(r'[^\w\s]', '', text)
    text = ' '.join(text.split())
    return text.upper().strip()

def check_pronunciation_match(expected, recognized):
    """
    Tuned for 3-5 year olds.
    Handles common speech impediments (R->W, L->W) and 'baby talk' substitutions.
    """
    # 1. Normalize both inputs
    expected = normalize_text(expected)
    recognized = normalize_text(recognized)
    
    if not expected or not recognized:
        return 0, "no_speech"

    # --- TODDLER DICTIONARY (Common Mispronunciations) ---
    TODDLER_VARIANTS = {
        # Numbers
        "ONE":   ["WON", "WAN", "ON", "UN"],
        "TWO":   ["TO", "TOO", "TU", "DO", "SHOE"],
        "THREE": ["TREE", "FREE", "FWEE", "SREE"],
        "FOUR":  ["FOR", "FO", "FOW"],
        "FIVE":  ["FIVE", "FIFE", "FIV", "PIE"],
        "SIX":   ["SICKS", "SICK", "SEX", "ISH"],
        "SEVEN": ["SEVEN", "SEVN", "SAVEN"],
        "EIGHT": ["ATE", "EIT", "AIT"],
        "NINE":  ["NINE", "NIEN", "NAN"],
        "TEN":   ["TAN", "TIN", "DEN"],

        # Colors
        "RED":    ["WED", "RAD", "RID"],
        "BLUE":   ["BOO", "BWUE", "BLU", "LOO"],
        "GREEN":  ["GWEEN", "GEEN", "GRIN"],
        "YELLOW": ["LELLOW", "YEYOW", "YELLO"],
        "ORANGE": ["AWNGE", "ORNJ", "ANJ"],
        "PURPLE": ["PUPPLE", "POPLE"],

        # Fruits
        "APPLE":  ["APPU", "APPEL", "APOL"],
        "BANANA": ["NANA", "BANA", "NANNA"],
        "GRAPES": ["GAPES", "GWAPES"],

        # Shapes
        "CIRCLE": ["SIKLE", "SIRKEL", "COCO"],
        "SQUARE": ["SKWARE", "KARE"],
        "STAR":   ["TAH", "TAR", "STA"],
    }

    # 2. Perfect Match
    if expected == recognized:
        return 100, "perfect"

    # 3. Check Toddler Dictionary
    if expected in TODDLER_VARIANTS:
        if recognized in TODDLER_VARIANTS[expected]:
            return 98, "toddler_match"  # High score for "Wed" instead of "Red"

    # 4. Partial/Substring Match (Very forgiving)
    if expected in recognized:
        return 95, "sentence_match"
    
    # 5. Common Letter Swaps (Algorithm)
    # 3-year-olds often swap R->W or TH->F. 
    baby_version = expected.replace("R", "W").replace("TH", "F").replace("L", "W")
    if baby_version == recognized:
         return 92, "speech_impediment_match"

    # 6. Fuzzy Similarity (SequenceMatcher)
    similarity = SequenceMatcher(None, expected, recognized).ratio() * 100
    
    # Check similarity against variants too
    if expected in TODDLER_VARIANTS:
        for variant in TODDLER_VARIANTS[expected]:
            variant_sim = SequenceMatcher(None, variant, recognized).ratio() * 100
            if variant_sim > similarity:
                similarity = variant_sim

    # 7. Final Thresholds (Lowered for encouragement)
    if similarity >= 75:  
        return round(similarity, 2), "high_similarity"
    elif similarity >= 50:
        return round(similarity, 2), "medium_similarity"
    
    return round(similarity, 2), "low_similarity"

# --- (Your Auth & Progress Endpoints - UNCHANGED) ---
# New teacher accounts can see every student's progress, so an admin approves
# them first (set TEACHER_APPROVAL_REQUIRED=0 to turn this off).
TEACHER_APPROVAL_REQUIRED = os.getenv("TEACHER_APPROVAL_REQUIRED", "1") != "0"

@app.route("/register", methods=["POST"])
@app.route("/api/register", methods=["POST"])
def register_user():
    if db is None: return jsonify({"message": "Database connection failed"}), 500
    if rate_limited(f"register:{client_ip()}", 10, 3600):
        return too_many_requests()
    data = json_body()
    first_name = clean_str(data.get("first_name"), 60)
    last_name = clean_str(data.get("last_name"), 60)
    username = clean_str(data.get("username"), 254)
    password = data.get("password") if isinstance(data.get("password"), str) else None
    user_type = (clean_str(data.get("user_type"), 20) or "child").lower()
    if not all([first_name, last_name, username, password]):
        return jsonify({"message": "All fields are required"}), 400
    username = username.lower()
    if user_type not in ("child", "teacher"):
        return jsonify({"message": "Account type must be child or teacher"}), 400
    if len(password) < 6 or len(password) > 128:
        return jsonify({"message": "Password must be 6 to 128 characters"}), 400
    if not email(username):
        return jsonify({"message": "Invalid email format"}), 400
    if db.users.find_one({"username": username}):
        return jsonify({"message": "Email already registered"}), 409
    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")
    user = {
        "first_name": first_name, "last_name": last_name, "username": username,
        "password": hashed_password, "user_type": user_type, "created_at": datetime.utcnow()
    }
    pending_teacher = user_type == "teacher" and TEACHER_APPROVAL_REQUIRED
    if pending_teacher:
        user["restricted"] = True
        user["pending_approval"] = True
    try:
        result = db.users.insert_one(user)
        user_id = str(result.inserted_id)
    except Exception as e:
        print(f"MongoDB insert error: {e}")
        return jsonify({"message": "Database write error during registration"}), 500

    if user_type == "child":
        initial_progress = {
            "_id": result.inserted_id,
            "child_name": f"{first_name} {last_name}",
            "completed_items": {
                "abc": [], "numbers": [], "shapes": [],
                "colors": [], "poems": [], "fruits": [], "flags": []
            },
            "total_score": 0, "last_activity": None
        }
        try:
            db.progress.insert_one(initial_progress)
        except Exception as e:
            print(f"Warning: Failed to initialize progress doc: {e}")
    if pending_teacher:
        return jsonify({
            "message": "Account created! An administrator will approve your teacher account, then you can log in.",
            "pending_approval": True,
        }), 202
    token = issue_token(user_id, user_type)
    return jsonify({
        "message": "User registered successfully",
        "user_id": user_id,
        "user_type": user_type,
        "first_name": first_name,
        "last_name": last_name,
        "token": token,
    }), 201


@app.route("/login", methods=["POST"])
@app.route("/api/login", methods=["POST"])
def login_user():
    if db is None:
        return jsonify({"message": "Database connection failed"}), 500

    data = json_body()
    username = clean_str(data.get("username"), 254)
    password = data.get("password") if isinstance(data.get("password"), str) else None

    if not username or not password or len(password) > 128:
        return jsonify({"message": "Username and password are required"}), 400

    # Slow down password guessing: per visitor and per account.
    if rate_limited(f"login-ip:{client_ip()}", 30, 900) or rate_limited(f"login-user:{username.lower()}", 10, 900):
        return too_many_requests()

    # ====================================================
    # 🔐 1. PREDEFINED ADMIN LOGIN (FROM .env)
    # ====================================================
    ADMIN_EMAIL = os.getenv("ADMIN_EMAIL") or ""
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD") or ""

    if (ADMIN_EMAIL and ADMIN_PASSWORD
            and hmac.compare_digest(username.lower().encode(), ADMIN_EMAIL.strip().lower().encode())
            and hmac.compare_digest(password.encode(), ADMIN_PASSWORD.encode())):
        token = issue_token("admin_static_id", "admin")
        return jsonify({
            "message": "Admin login successful",
            "user_id": "admin_static_id",
            "user_type": "admin",
            "first_name": "System",
            "last_name": "Administrator",
            "token": token,
        }), 200

    # ====================================================
    # 👤 2. NORMAL USER LOGIN (MongoDB)
    # ====================================================
    user = db.users.find_one({"username": {"$in": list({username, username.lower()})}})

    if not user:
        return jsonify({"message": "Invalid email or password"}), 401

    try:
        password_ok = bcrypt.check_password_hash(user["password"], password)
    except (ValueError, TypeError):
        password_ok = False
    if not password_ok:
        return jsonify({"message": "Invalid email or password"}), 401

    # 🚫 Restriction check
    if user.get("restricted", False):
        if user.get("pending_approval"):
            return jsonify({
                "message": "Your teacher account is waiting for administrator approval."
            }), 403
        return jsonify({
            "message": "Your account has been restricted by the administrator"
        }), 403

    user_type = user.get("user_type", "child").lower()
    token = issue_token(str(user["_id"]), user_type)
    return jsonify({
        "message": "Login successful",
        "user_id": str(user["_id"]),
        "user_type": user_type,
        "first_name": user.get("first_name", ""),
        "last_name": user.get("last_name", ""),
        "token": token,
    }), 200



@app.route("/api/logout", methods=["POST"])
def logout_user():
    token = _bearer_token()
    if db is not None and token:
        db.sessions.delete_one({"token": token})
    return jsonify({"message": "Logged out"}), 200


def _progress_payload(progress_data):
    progress_data["_id"] = str(progress_data["_id"])
    if "completed_items" not in progress_data:
        progress_data["completed_items"] = {}
    return progress_data

def _load_progress(user_id):
    if not ObjectId.is_valid(str(user_id)):
        return None
    progress_data = db.progress.find_one({"_id": ObjectId(str(user_id))})
    if not progress_data:
        return None
    return _progress_payload(progress_data)

@app.route("/api/progress/me", methods=["GET"])
def get_my_progress():
    session = current_session()
    if not session or session.get("user_type") not in ("child", "teacher", "admin"):
        return jsonify({"message": "Unauthorized"}), 401
    if db is None:
        return jsonify({"message": "Database connection failed"}), 500
    try:
        progress_data = _load_progress(session.get("user_id"))
        if not progress_data:
            return jsonify({"message": "Child progress not found"}), 404
        return jsonify(progress_data), 200
    except Exception as e:
        print(f"Error fetching own progress: {e}")
        return jsonify({"error": "Failed to fetch progress"}), 500

@app.route("/api/progress/summary/<user_id>", methods=["GET"])
def get_child_progress(user_id):
    session = current_session()
    if not session or session.get("user_type") not in ("child", "teacher", "admin"):
        return jsonify({"message": "Unauthorized"}), 401
    if session.get("user_type") == "child" and session.get("user_id") != str(user_id):
        return jsonify({"message": "You can only view your own progress"}), 403
    if db is None: return jsonify({"message": "Database connection failed"}), 500
    try:
        progress_data = _load_progress(user_id)
        if not progress_data: return jsonify({"message": "Child progress not found"}), 404
        return jsonify(progress_data), 200
    except Exception as e:
        print(f"Error fetching progress: {e}")
        return jsonify({"error": "Failed to fetch progress"}), 500

@app.route("/api/progress/all_children", methods=["GET"])
def get_all_child_progress():
    denied = reject_unless("teacher", "admin")
    if denied:
        return denied
    if db is None: return jsonify({"message": "Database connection failed"}), 500
    try:
        all_progress = list(db.progress.find({}))
        for progress in all_progress:
            progress["_id"] = str(progress["_id"])
            if "completed_items" not in progress:
                progress["completed_items"] = {}
        return jsonify(all_progress), 200
    except Exception as e:
        print(f"Error fetching all progress: {e}")
        return jsonify({"error": "Failed to fetch all progress"}), 500

@app.route("/api/progress/mark_item_complete", methods=["PUT"])
def mark_item_complete():
    if db is None: return jsonify({"message": "Database connection failed"}), 500
    session = current_session()
    if not session or session.get("user_type") not in ("child", "teacher", "admin"):
        return jsonify({"message": "Unauthorized"}), 401
    data = json_body()
    user_id = clean_str(data.get("user_id"), 24)
    if session.get("user_type") == "child" and session.get("user_id") != str(user_id):
        return jsonify({"message": "You can only update your own progress"}), 403
    category = clean_str(data.get("category"), 20)
    item = clean_str(data.get("item"), 120)
    if not all([user_id, category, item]):
        return jsonify({"message": "Missing user_id, category, or item"}), 400
    if not ObjectId.is_valid(user_id):
        return jsonify({"message": "Invalid user ID"}), 400

    valid_categories = ["abc", "numbers", "shapes", "colors", "poems", "fruits", "flags"]
    if category not in valid_categories:
        print(f"Invalid category received: {category}")
        return jsonify({"message": f"Invalid category: {category}"}), 400

    try:
        progress_doc = db.progress.find_one({
            "_id": ObjectId(user_id),
            f"completed_items.{category}": item
        })
        if progress_doc:
            db.progress.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"last_activity": datetime.utcnow().isoformat()}}
            )
            return jsonify({"message": "Item already completed"}), 200

        update_result = db.progress.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$addToSet": { f"completed_items.{category}": item },
                "$set": { "last_activity": datetime.utcnow().isoformat() },
                "$inc": { "total_score": 1 }
            },
            upsert=False
        )
        if update_result.matched_count == 0:
              return jsonify({"message": "Progress update failed. User profile missing."}), 404
        return jsonify({"message": "Progress updated successfully"}), 200
    except Exception as e:
        print(f"Error updating progress: {e}")
        return jsonify({"error": "Failed to update progress"}), 500

# -----------------------------------------------------
# --- 3D AVATAR API (UNCHANGED) ---
# -----------------------------------------------------
# -----------------------------------------------------
# --- UPDATED: /api/ai — Uses Hugging Face Phi-2 Model ---
# -----------------------------------------------------

HUGGINGFACE_API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN")
HF_MODEL_URL = "https://router.huggingface.co/hf-inference/models/Hashir124/phi-2"

from flask import Flask, request, jsonify

REPLICATE_MODEL_ID = "hashirds1/ashir:6b0013266a78c6c8890f033dbce522a9e6477cc8eb5af4ca2e2fb4b5d638be06"
_groq_key = os.environ.get("GROQ_API_KEY")
if _groq_key:
    from groq import Groq
    groq_client = Groq(api_key=_groq_key)

# --- HELPER: Clean Repetitive Text ---
def clean_tutor_response(text):
    cut_off_phrases = [
        "Perfect work!", "Fantastic!", "You're a superstar!", 
        "Incredible job!", "You're amazing!", "Bravo!", "Lesson completed"
    ]
    for phrase in cut_off_phrases:
        if phrase in text:
            text = text.split(phrase)[0]
    return text.strip()

# --- NEW: HELPER: Check if Response is Valid ---
def is_response_valid(user_prompt, response_text):
    """
    Returns False if the model gave a lazy or bad answer.
    """
    response_lower = response_text.lower()
    
    # 1. Check for "Lazy" completion phrases
    bad_phrases = ["completed", "lesson done", "task finished", "end of lesson"]
    for phrase in bad_phrases:
        if phrase in response_lower and len(response_text.split()) < 10:
            return False # Reject "12 months completed"

    # 2. Check Length vs Prompt Complexity
    # If user asks for a list (e.g., "12 months", "3 letters"), answer shouldn't be tiny.
    if "12" in user_prompt or "list" in user_prompt:
        if len(response_text.split()) < 5:
            return False # Answer is suspiciously short

    # 3. Check for Empty/Gibberish
    if not response_text or len(response_text) < 3:
        return False

    return True

@app.route('/api/ai', methods=['GET'])
def ask_ai():
    question = request.args.get('question', '').strip()[:500]
    if not question:
        return jsonify({"error": "Missing 'question' parameter"}), 400
    # Open to visitors for the free classroom demo, so cap how often one visitor can call the AI.
    if rate_limited(f"ai:{client_ip()}", 40, 600):
        return too_many_requests()

    # ---------------------------------------------------------
    # SYSTEM PROMPT (Shared by both models for consistency)
    # ---------------------------------------------------------
    system_instruction_text = """
    You are an expert Kindergarten Teacher (Ages 3-6).
    
    RULES:
    1. Answer the question DIRECTLY.
    2. If asked for a list (like months or ABCs), LIST THEM ALL.
    3. Keep it simple and fun using Emojis 🌟.
    4. Do not just say "Task completed". Actually teach the topic.
    
    Example:
    User: "Teach me 12 months"
    Teacher: "Here they are! January, February, March, April, May, June, July, August, September, October, November, December! 📅"
    """

    # ---------------------------------------------------------
    # 1. TRY REPLICATE (Custom Model)
    # ---------------------------------------------------------
    try:
        print("🧠 Sending question to Replicate (hashirds/ashir)...")
        import replicate as replicate_client
        output = replicate_client.run(
            REPLICATE_MODEL_ID,
            input={
                "prompt": f"{system_instruction_text}\nUser: {question}\nTeacher:",
                "max_new_tokens": 150,      
                "temperature": 0.5,         
                "top_p": 0.9,
                "repetition_penalty": 1.2,
                "stop_sequences": ["User:", "\n\n", "Teacher:"] 
            }
        )

        generated_text = "".join(output)

        # Cleanup
        if "Teacher:" in generated_text:
            generated_text = generated_text.split("Teacher:")[-1].strip()
        
        generated_text = clean_tutor_response(generated_text)

        # --- VALIDATION STEP ---
        # If the answer is lazy (e.g. "12 months completed"), this returns False
        if not is_response_valid(question, generated_text):
            print(f"⚠️ Invalid Replicate Response detected: '{generated_text}'")
            raise ValueError("Response failed validation check")
        
        return jsonify({"text": generated_text, "source": "replicate_custom"})

    except Exception as e:
        print(f" ")

   
    try:
        if 'groq_client' not in globals() or not groq_client:
            raise ValueError("Groq client not initialized")

        print("phi-2")
        
        completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_instruction_text},
                {"role": "user", "content": question}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.6,
            max_tokens=300, 
            top_p=1.0
        )

        fallback_text = completion.choices[0].message.content.strip()
        
        # Apply the same cleaning to Llama 3 just in case
        fallback_text = clean_tutor_response(fallback_text)
        
        print(f"✅ : {fallback_text[:50]}...")
        return jsonify({"text": fallback_text, "source": "groq_llama3"})

    except Exception as e:
        print(f"❌ CRITICAL: Both models failed. {e}")
        return jsonify({
            "text": "A is for Apple 🍎. B is for Ball 🏀. Let's try again later!", 
            "source": "error_fallback"
        })


# -----------------------------------------------------
# --- /api/tts Route (Azure TTS with SSML for speed) ---
# -----------------------------------------------------
@app.route('/api/tts', methods=['GET'])
def get_tts():
    if not SPEECH_KEY or not SPEECH_REGION:
        return Response("TTS keys are not configured on the server.", status=500)

    text = (request.args.get("text") or "").strip()[:1200]
    if not text:
        return Response("Missing text parameter for TTS.", status=400)
    if rate_limited(f"tts:{client_ip()}", 60, 600):
        return Response("Too many requests. Please wait a few minutes.", status=429)
    # Escape the text so it cannot inject extra SSML tags.
    text = xml_escape(text)

    # ✅ NEW: read teacher (DEFAULT female)
    teacher = request.args.get("teacher", "female")

    # ✅ NEW: map teacher → Azure voice
    if teacher == "male":
        voice_name = "en-US-GuyNeural"
    else:
        voice_name = "en-US-JennyNeural"

    # Without the Azure Speech SDK (kept out of the Vercel bundle for size),
    # use the Azure TTS REST API: same voices, but no lip-sync visemes.
    if speechsdk is None:
        ssml = (
            '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">'
            f'<voice name="{voice_name}"><prosody rate="-20.0%">{text}</prosody></voice></speak>'
        )
        try:
            tts_res = requests.post(
                f"https://{SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1",
                headers={
                    "Ocp-Apim-Subscription-Key": SPEECH_KEY,
                    "Content-Type": "application/ssml+xml",
                    "X-Microsoft-OutputFormat": "audio-16khz-32kbitrate-mono-mp3",
                    "User-Agent": "ai-tutor",
                },
                data=ssml.encode("utf-8"),
                timeout=20,
            )
            if tts_res.status_code != 200:
                print(f"Azure TTS REST error {tts_res.status_code}: {tts_res.text[:200]}")
                return Response("Speech is not available right now.", status=502)
            return Response(
                tts_res.content,
                mimetype="audio/mpeg",
                headers={"Visemes": "[]", "Content-Disposition": "inline; filename=tts.mp3"},
            )
        except Exception as e:
            print(f"Azure TTS REST failed: {e}")
            return Response("Speech is not available right now.", status=502)

    try:
        # 1. Speech Configuration (UNCHANGED except voice)
        speech_config = speechsdk.SpeechConfig(
            subscription=SPEECH_KEY,
            region=SPEECH_REGION
        )
        speech_config.speech_synthesis_voice_name = voice_name  # ✅ UPDATED
        speech_config.set_speech_synthesis_output_format(
            speechsdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3
        )

        # 2. Create synthesizer (UNCHANGED)
        synthesizer = speechsdk.SpeechSynthesizer(
            speech_config=speech_config,
            audio_config=None
        )

        # 3. Viseme collection (UNCHANGED)
        visemes = []

        def viseme_received_handler(evt):
            offset_ms = evt.audio_offset / 10000
            visemes.append([offset_ms, evt.viseme_id])

        synthesizer.viseme_received.connect(viseme_received_handler)

        # 4. SSML (ONLY voice name updated)
        ssml_string = f"""
        <speak version="1.0"
               xmlns="http://www.w3.org/2001/10/synthesis"
               xml:lang="en-US">
            <voice name="{voice_name}">
                <prosody rate="-20.0%">
                    {text}
                </prosody>
            </voice>
        </speak>
        """

        print(f"Starting TTS synthesis (with SSML) for text: {text[:50]}...")

        # 5. speak_ssml_async (UNCHANGED)
        result = synthesizer.speak_ssml_async(ssml_string).get()

        # 6. Result handling (UNCHANGED)
        if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
            audio_data = result.audio_data

            response = Response(
                audio_data,
                mimetype="audio/mpeg",
                headers={
                    "Visemes": json.dumps(visemes),
                    "Content-Disposition": "inline; filename=tts.mp3",
                    "Access-Control-Expose-Headers": "Visemes"
                }
            )
            return response

        elif result.reason == speechsdk.ResultReason.Canceled:
            cancellation = result.cancellation_details
            print(f"Speech synthesis canceled: {cancellation.reason} {cancellation.error_details}")
            return Response("Speech is not available right now.", status=500)

        else:
            print(f"Unexpected TTS result reason: {result.reason}")
            return Response("Speech is not available right now.", status=500)

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return Response("Speech is not available right now.", status=500)

    

# --- SPEECH ANALYSIS ROUTE ---
@app.route("/analyze_speech", methods=["POST"])
def analyze_speech():
    """
    Analyze child's pronunciation using Deepgram STT
    Clean, stable & no ffmpeg needed
    """

    temp_path = None

    session = current_session()
    if not session or session.get("user_type") not in ("child", "teacher", "admin"):
        return jsonify({"success": False, "error": "Unauthorized", "reward": "Please log in again.", "points_added": 0}), 401
    if rate_limited(f"speech:{session.get('user_id')}", 60, 600):
        return too_many_requests()

    try:
        if not DEEPGRAM_API_KEY:
            return jsonify({"error": "Deepgram API key missing"}), 500

        # ----------------------------
        # 1. Read Inputs
        # ----------------------------
        expected_text = request.form.get("expected_text", "").strip()[:100]
        audio_file = request.files.get("audio")
        # Points always go to the logged-in child; the user_id field sent by the browser is ignored.
        user_id = session.get("user_id") if session.get("user_type") == "child" else None
        lesson_type = request.form.get("lesson_type", "colors")
        if lesson_type not in ("abc", "numbers", "shapes", "colors", "fruits", "poems", "flags", "drawing"):
            lesson_type = "other"

        # Validate
        if not audio_file:
            return jsonify({
                "success": False,
                "error": "No audio received",
                "reward": "🎤 No audio detected! Try again!",
                "points_added": 0
            }), 400

        if expected_text == "":
            return jsonify({
                "success": False,
                "error": "Expected text missing",
                "reward": "⚠ Something went wrong!",
                "points_added": 0
            }), 400

        # ----------------------------
        # 2. Save .webm file temporarily
        # ----------------------------
        temp_filename = f"recording_{secrets.token_hex(8)}.webm"
        temp_path = os.path.join(tempfile.gettempdir(), temp_filename)
        audio_file.save(temp_path)

        file_size = os.path.getsize(temp_path)
        print("📦 Audio file size:", file_size)

        if file_size < 800:  # <0.8 KB = empty
            os.remove(temp_path)
            return jsonify({
                "success": False,
                "error": "Audio too small",
                "reward": "🎤 No sound detected! Speak louder.",
                "points_added": 0
            }), 400

        # ----------------------------
        # 3. Deepgram Speech-To-Text
        # ----------------------------
        print(f"🎤 Transcribing with Deepgram for expected: {expected_text}")

        import requests
        url = "https://api.deepgram.com/v1/listen?model=nova-2&language=en&punctuate=false&smart_format=false"

        headers = {
            "Authorization": f"Token {DEEPGRAM_API_KEY}",
            "Content-Type": "audio/webm"
        }

        with open(temp_path, "rb") as f:
            response = requests.post(url, headers=headers, data=f)

        dg_data = response.json()
        print("🧾 Deepgram raw:", dg_data)

        try:
            recognized_text = dg_data["results"]["channels"][0]["alternatives"][0]["transcript"].strip()
        except:
            recognized_text = ""

        print(f"🗣️ Recognized: '{recognized_text}'")

        if recognized_text == "":
            os.remove(temp_path)
            return jsonify({
                "success": False,
                "error": "No speech detected",
                "reward": "🎤 I didn’t hear anything! Try again!",
                "expected_text": expected_text,
                "recognized_text": "Silent",
                "accuracy": 0,
                "stars": 0,
                "points_added": 0,
            }), 200

        # ----------------------------
        # 4. Score pronunciation
        # ----------------------------
        accuracy, match_type = check_pronunciation_match(expected_text, recognized_text)
        print(f"📊 Accuracy: {accuracy}% ({match_type})")

        # Rewards logic
        if accuracy >= 90:
            reward = "🏆 Excellent! Perfect pronunciation!"
            points = 5
            stars = 3
        elif accuracy >= 70:
            reward = "🎉 Great job! You said it well!"
            points = 4
            stars = 2
        elif accuracy >= 50:
            reward = "🙂 Good try! You're getting closer!"
            points = 3
            stars = 1
        else:
            reward = "🔁 Let's try again! Listen carefully!"
            points = 0
            stars = 0

        # ----------------------------
        # 5. Save progress in DB
        # ----------------------------
        if user_id and db is not None and ObjectId.is_valid(str(user_id)):
            try:
                db.progress.update_one(
                    {"_id": ObjectId(user_id)},
                    {
                        "$inc": {"total_score": points},
                        "$set": {"last_activity": datetime.utcnow().isoformat()},
                        "$push": {
                            "speech_history": {
                                "lesson_type": lesson_type,
                                "expected": expected_text,
                                "recognized": recognized_text,
                                "accuracy": accuracy,
                                "points": points,
                                "timestamp": datetime.utcnow().isoformat()
                            }
                        }
                    },
                    upsert=True
                )
                print(f"⭐ Score update OK for user {user_id}")
            except Exception as e:
                print("⚠️ DB update failed:", e)

        # ----------------------------
        # 6. TTS Reward (Using Free gTTS)
        # ----------------------------
        reward_audio = None
        use_browser_tts = True 
        
        # Determine what to say
        tts_text = reward if accuracy >= 90 else f"{reward} Listen: {expected_text}. Now you try!"

        try:
            # Import strictly needed for this block
            from gtts import gTTS
            import io
            import base64

            # Generate audio in memory (no file saved)
            tts = gTTS(text=tts_text, lang='en', slow=False)
            mp3_fp = io.BytesIO()
            tts.write_to_fp(mp3_fp)
            mp3_fp.seek(0)

            # Convert to Base64 to send to frontend
            reward_audio = base64.b64encode(mp3_fp.read()).decode('utf-8')
            
            # Since we generated audio successfully, tell frontend NOT to use browser voice
            use_browser_tts = False 
            print("✅ gTTS Audio generated for reward")

        except Exception as e:
            print(f"⚠️ gTTS failed ({e}), falling back to browser TTS")
            reward_audio = None
            use_browser_tts = True
        
        # Delete temp recording file
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

        # ----------------------------
        # 7. Return final result
        # ----------------------------
        return jsonify({
            "success": True,
            "expected_text": expected_text,
            "recognized_text": recognized_text,
            "accuracy": accuracy,
            "match_type": match_type,
            "reward": reward,
            "stars": stars,
            "reward_audio": reward_audio,
            "use_browser_tts": use_browser_tts,
            "tts_text": tts_text,
            "points_added": points,
            "lesson_type": lesson_type
        }), 200

    except Exception as e:
        print("❌ Error in /analyze_speech:", e)
        import traceback
        traceback.print_exc()

        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

        return jsonify({
            "success": False,
            "error": "Speech analysis failed",
            "reward": "⚠ Something went wrong!",
            "points_added": 0
        }), 500


# --- (Existing Poem & Audio Endpoints - UNCHANGED) ---




# ✅ NEW: Free & Stable Audio Generator using gTTS
@app.route('/generate-audio', methods=['POST'])
def generate_audio():
    denied = reject_unless("child", "teacher", "admin")
    if denied:
        return denied
    try:
        data = json_body()
        text = clean_str(data.get('text'), 1500)
        if not text:
            return jsonify({"error": "No text provided"}), 400
        if rate_limited(f"audio:{client_ip()}", 60, 600):
            return too_many_requests()

        from gtts import gTTS as GoogleTTS
        tts = GoogleTTS(text=text, lang='en', slow=False)
        
        # Save to memory buffer
        mp3_fp = io.BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)
        
        # Encode to base64 to send to frontend
        audio_base64 = base64.b64encode(mp3_fp.read()).decode('utf-8')
        
        return jsonify({
            "audio_data": audio_base64,
            "mime_type": "audio/mpeg",
            "source": "gtts_free"
        })
        
    except Exception as e:
        print(f"Audio generation error: {e}")
        return jsonify({"error": "Audio generation failed"}), 500

# ---------------- POEM GENERATION (LLAMA-3 via GROQ) ----------------

from flask import request, jsonify

if GROQ_API_KEY and groq_client is None:
    from groq import Groq
    groq_client = Groq(api_key=GROQ_API_KEY)

@app.route('/generate-poem', methods=['POST'])
def generate_poem():
    denied = reject_unless("child", "teacher", "admin")
    if denied:
        return denied
    try:
        data = json_body()
        topic = clean_str(data.get('topic'), 100)

        if not topic:
            return jsonify({"error": "No topic provided"}), 400
        if rate_limited(f"poem:{client_ip()}", 30, 600):
            return too_many_requests()

        # 🎯 SYSTEM PROMPT (Kid-safe, viva-ready)
        system_prompt = """
You are a kindergarten teacher for children aged 2–6.

RULES:
- Write a SHORT poem (4–6 lines only)
- Use VERY simple English words
- Make it rhyme
- Friendly, fun, educational
- NO emojis
- NO explanations
- ONLY the poem text
"""

        user_prompt = f"Write a poem about: {topic}"

        # 🧠 Call LLaMA-3 via Groq
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.6,
            max_tokens=120,
            top_p=1.0
        )

        poem_text = completion.choices[0].message.content.strip()

        if not poem_text:
            return jsonify({"error": "No poem generated"}), 500

        return jsonify({
            "poem": poem_text,
            "source": "llama3_groq"
        }), 200

    except Exception as e:
        print("Poem generation error:", e)
        return jsonify({
            "error": "Poem generation failed. Please try again."
        }), 500


@app.route('/api/status', methods=['GET'])
def api_status():
    status = {"gemini_tts": bool(GEMINI_API_KEY), "elevenlabs_tts": bool(ELEVENLABS_API_KEY), "browser_tts": True, "custom_model": False}
    return jsonify(status)

@app.route('/api/model-status', methods=['GET'])
def model_status():
    try:
        status = {
            "poem_generation": {"gemini_api": bool(GEMINI_API_KEY), "custom_model": False, "recommendation": "gemini_api"},
            "audio_generation": {"gemini_tts": bool(GEMINI_API_KEY), "elevenlabs_tts": bool(ELEVENLABS_API_KEY), "browser_tts": True, "recommendation": "elevenlabs_tts" if ELEVENLABS_API_KEY else "browser_tts"},
            "custom_model": {"custom_model_loaded": False, "model_path": None, "fallback_enabled": True}
        }
        return jsonify(status), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/speech-analytics/<user_id>", methods=["GET"])
def get_speech_analytics(user_id):
    denied = reject_unless("teacher", "admin")
    if denied:
        return denied
    try:
        progress = db.progress.find_one({"_id": ObjectId(user_id)})
        if not progress or "speech_history" not in progress or not progress["speech_history"]:
            return jsonify({"error": "No speech data available for this student yet"}), 200
        
        speech_data = progress["speech_history"]
        
        # Calculate statistics
        total_attempts = len(speech_data)
        avg_accuracy = sum(item['accuracy'] for item in speech_data) / total_attempts if total_attempts > 0 else 0
        total_points = sum(item['points'] for item in speech_data)
        
        # Group by lesson type
        lesson_stats = {}
        for item in speech_data:
            lesson_type = item['lesson_type']
            if lesson_type not in lesson_stats:
                lesson_stats[lesson_type] = {
                    'attempts': 0,
                    'total_accuracy': 0,
                    'best_accuracy': 0,
                    'words_practiced': set()
                }
            
            lesson_stats[lesson_type]['attempts'] += 1
            lesson_stats[lesson_type]['total_accuracy'] += item['accuracy']
            lesson_stats[lesson_type]['best_accuracy'] = max(lesson_stats[lesson_type]['best_accuracy'], item['accuracy'])
            lesson_stats[lesson_type]['words_practiced'].add(item['expected'])
        
        # Calculate averages and format for frontend
        formatted_lesson_stats = {}
        for lesson_type, stats in lesson_stats.items():
            formatted_lesson_stats[lesson_type] = {
                'attempts': stats['attempts'],
                'avg_accuracy': round(stats['total_accuracy'] / stats['attempts'], 2),
                'words_count': len(stats['words_practiced']),
                'best_accuracy': stats['best_accuracy']
            }
        
        response_data = {
            "total_attempts": total_attempts,
            "average_accuracy": round(avg_accuracy, 2),
            "total_points_earned": total_points,
            "lesson_statistics": formatted_lesson_stats,
            "recent_attempts": speech_data[-5:],  # Last 5 attempts for the table
            "speech_history": speech_data  # All history for charts
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Error fetching speech analytics: {e}")
        return jsonify({"error": "Failed to fetch speech analytics"}), 500

# -----------------------------------------------------
# --- NEW CHATBOT ENDPOINT FOR LEARNING ASSISTANT ---
# -----------------------------------------------------

@app.route('/api/chat', methods=['POST'])
def chat_assistant():
    """
    Smart Learning System Chatbot - Powered by Llama 3 (via Groq)
    Fallback: Gemini Flash -> Rule Based
    """
    denied = reject_unless("child", "teacher", "admin")
    if denied:
        return denied
    try:
        data = json_body()
        user_message = (clean_str(data.get('message'), 500) or '')
        context = data.get('context') if isinstance(data.get('context'), dict) else {}

        if not user_message:
            return jsonify({"error": "No message provided"}), 400
        if rate_limited(f"chat:{client_ip()}", 40, 600):
            return too_many_requests()

        # Get context
        current_page = clean_str(context.get('current_page'), 40) or 'Home'
        
        # --- 1. DEFINE THE PERSONA (SYSTEM PROMPT) ---
        system_prompt = f"""
        You are "Learning Buddy", a cheerful and friendly AI assistant for children (ages 3-6) using the "Smart Learning System".
        
        **YOUR SYSTEM KNOWLEDGE (Use this to answer):**
        1. **3D AI Teacher:** An animated character that talks and teaches lessons visually.
        2. **Voice Practice:** Kids can speak into the microphone to practice pronunciation (uses Azure/Deepgram).
        3. **Drawing Board:** A digital canvas for creativity, shapes, and colors.
        4. **Games:** Interactive ABC, Number, and Color games.
        
        **CURRENT USER CONTEXT:**
        - User is looking at: {current_page} page.
        
        **RULES FOR ANSWERING:**
        - Keep answers SHORT (maximum 2 sentences).
        - Use simple words a 5-year-old understands.
        - Be super enthusiastic! Use emojis like 🌟, 🎨, 🚀, 🤖.
        - If asked about features, explain them simply.
        - If asked a general question (e.g., "What is A?"), give an educational answer ("A is for Apple! 🍎").
        """

        # --- 2. PRIMARY: TRY GROQ (LLAMA 3) ---
        # This is the fastest and best model for chat
        groq_api_key = os.getenv("GROQ_API_KEY")
        if groq_api_key:
            try:
                from groq import Groq
                client = Groq(api_key=groq_api_key)
                completion = client.chat.completions.create(
                    model="llama3-8b-8192",  # Fast and smart
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message}
                    ],
                    temperature=0.7,
                    max_tokens=150,
                )
                bot_response = completion.choices[0].message.content
                print(f"🚀 Groq Response: {bot_response}")
                return jsonify({
                    "reply": bot_response,
                    "source": "llama-3",
                    "type": "ai"
                })
            except Exception as e:
                print(f"⚠️ Groq failed, switching to backup: {e}")

        # --- 3. BACKUP: TRY GEMINI (FLASH) ---
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if gemini_api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=gemini_api_key)
                model = genai.GenerativeModel('gemini-1.5-flash') # Use 1.5 Flash (faster/stable)
                response = model.generate_content(
                    f"{system_prompt}\n\nUSER QUESTION: {user_message}"
                )
                bot_response = response.text.strip()
                print(f"🤖 Gemini Response: {bot_response}")
                return jsonify({
                    "reply": bot_response,
                    "source": "gemini",
                    "type": "ai"
                })
            except Exception as e:
                print(f"⚠️ Gemini failed: {e}")

        # --- 4. ULTIMATE FALLBACK: RULE BASED ---
        # If both AIs fail, use pre-written answers so the user never gets an error.
        user_lower = user_message.lower()
        
        fallback_map = {
            "teacher": "Our 3D Teacher is super smart! 🤖 She can talk to you and teach you fun lessons!",
            "voice": "I love listening to you! 🎤 Click the microphone button to practice speaking!",
            "draw": "Time to be an artist! 🎨 Go to the Drawing Board to paint shapes and colors.",
            "game": "We have so many games! 🎮 You can play with Numbers, ABCs, and Colors.",
            "hello": "Hi there, little friend! 👋 I'm ready to learn with you!",
            "hi": "Hello! 🌟 What do you want to learn today?"
        }

        for key, reply in fallback_map.items():
            if key in user_lower:
                return jsonify({"reply": reply, "source": "offline_rules", "type": "system"})

        return jsonify({
            "reply": "I am ready to learn! 🌟 Ask me about the 3D Teacher, Drawing, or Games!",
            "source": "default",
            "type": "system"
        })

    except Exception as e:
        print(f"❌ Critical Chat Error: {e}")
        return jsonify({"reply": "I'm having a little nap... 😴 Try again in a minute!", "source": "error"}), 500
  # =============================================================
# --- START: NEW QUIZ SYSTEM ENDPOINTS (Teacher & Student) ---
# =============================================================


@app.route('/api/assessments/submit', methods=['POST'])
def submit_assessment():
    session = current_session()
    if not session or session.get("user_type") not in ("child", "teacher", "admin"):
        return jsonify({"message": "Unauthorized"}), 401
    """
    Save quiz/assessment results to student's profile
    Similar to speech analytics storage
    """
    if db is None:
        return jsonify({"message": "Database connection failed"}), 500
    
    data = request.get_json()
    user_id = session.get("user_id") if session.get("user_type") == "child" else data.get('user_id')
    category = data.get('category')
    questions = data.get('questions')
    score = data.get('score')
    total_questions = data.get('total_questions')
    percentage = data.get('percentage')
    time_elapsed = data.get('timeElapsed')
    completed_at = data.get('completedAt')

    if not all([user_id, category, questions, score is not None, total_questions]):
        return jsonify({"message": "Missing required fields"}), 400

    try:
        if not ObjectId.is_valid(user_id):
            return jsonify({"message": "Invalid user ID format"}), 400

        if session.get("user_type") == "child":
            recommended = _recommend_quiz(str(user_id))
            teacher_quiz = _open_teacher_quiz(str(user_id))
            matches_recommendation = recommended and recommended.get("category") == category and recommended.get("can_start")
            matches_teacher = teacher_quiz and str(teacher_quiz.get("category")) == str(category) and teacher_quiz.get("can_start")
            if not matches_recommendation and not matches_teacher:
                return jsonify({"message": "Your tutor picks the quiz from lessons you already finished. This topic is not the one for you right now."}), 403

        # Create assessment record
        assessment_record = {
            "user_id": ObjectId(user_id),
            "category": category,
            "questions": questions,
            "score": score,
            "total_questions": total_questions,
            "percentage": percentage,
            "time_elapsed": time_elapsed,
            "completed_at": completed_at or datetime.utcnow().isoformat(),
            "timestamp": datetime.utcnow()
        }

        # Insert into assessments collection
        result = db.assessments.insert_one(assessment_record)

        # Also update user's quiz_history in their profile (similar to speech_history)
        db.users.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$push": {
                    "quiz_history": {
                        "assessment_id": result.inserted_id,
                        "category": category,
                        "score": score,
                        "total_questions": total_questions,
                        "percentage": percentage,
                        "time_elapsed": time_elapsed,
                        "completed_at": completed_at or datetime.utcnow().isoformat()
                    }
                },
                "$inc": {"total_quizzes": 1}
            },
            upsert=True
        )

        if session.get("user_type") == "child":
            db.quiz_assignments.update_one(
                {"user_id": str(user_id), "category": category, "status": "assigned"},
                {"$set": {
                    "status": "completed",
                    "score": score,
                    "total_questions": total_questions,
                    "completed_at": completed_at or datetime.utcnow().isoformat(),
                }},
            )

        return jsonify({
            "success": True,
            "message": "Assessment saved successfully",
            "assessment_id": str(result.inserted_id)
        }), 201

    except Exception as e:
        print(f"Error saving assessment: {e}")
        return jsonify({"message": "Server error while saving assessment"}), 500




QUIZ_CATEGORIES = ["abc", "numbers", "shapes", "colors", "fruits", "flags"]

def _lesson_count(user_id, category):
    if not ObjectId.is_valid(str(user_id)):
        return 0
    progress = db.progress.find_one({"_id": ObjectId(str(user_id))}) or {}
    items = progress.get("completed_items", {}).get(category, [])
    return len(items) if isinstance(items, list) else 0

def _assignment_payload(doc, lesson_count):
    return {
        "_id": str(doc["_id"]),
        "user_id": doc.get("user_id"),
        "category": doc.get("category"),
        "status": doc.get("status", "assigned"),
        "assigned_at": doc.get("assigned_at"),
        "completed_at": doc.get("completed_at"),
        "score": doc.get("score"),
        "total_questions": doc.get("total_questions"),
        "lesson_count": lesson_count,
        "source": doc.get("source") or "manual",
        "title": doc.get("title") or doc.get("category"),
        "seen": bool(doc.get("seen")),
        "question_count": len(doc.get("questions") or []),
        "can_start": doc.get("status") == "assigned" and lesson_count > 0,
    }

def _open_teacher_quiz(user_id):
    doc = db.quiz_assignments.find_one(
        {"user_id": str(user_id), "status": "assigned"},
        sort=[("assigned_at", -1)],
    )
    if not doc:
        return None
    category = doc.get("category")
    if category in QUIZ_CATEGORIES:
        lesson_count = _lesson_count(user_id, category)
    else:
        lesson_count = sum(_lesson_count(user_id, item) for item in QUIZ_CATEGORIES)
    payload = _assignment_payload(doc, lesson_count)
    payload["questions"] = doc.get("questions") or []
    payload["can_start"] = lesson_count > 0 and (bool(payload["questions"]) or category in QUIZ_CATEGORIES)
    return payload

@app.route("/api/teacher/assign-quiz", methods=["POST"])
def assign_quiz():
    denied = reject_unless("teacher", "admin")
    if denied:
        return denied
    if db is None:
        return jsonify({"message": "Database connection failed"}), 500
    data = request.get_json() or {}
    user_id = str(data.get("user_id") or "")
    category = str(data.get("category") or "").lower().strip()
    source = str(data.get("source") or "manual").lower()
    if source not in ("manual", "ai", "recommendation"):
        source = "manual"
    raw_questions = data.get("questions") or []
    questions = []
    for item in raw_questions[:15]:
        if not isinstance(item, dict) or not item.get("question"):
            continue
        answer = item.get("answer") or item.get("correct")
        if not answer:
            continue
        options = item.get("options") if isinstance(item.get("options"), list) else []
        questions.append({
            "question": str(item.get("question"))[:240],
            "options": [str(option)[:80] for option in options[:6]],
            "answer": str(answer)[:80],
            "image": str(item.get("image") or "")[:8],
        })
    if not ObjectId.is_valid(user_id) or not category or len(category) > 40:
        return jsonify({"message": "Choose a student and a lesson quiz."}), 400
    student = db.users.find_one({"_id": ObjectId(user_id), "user_type": "child"})
    if not student:
        return jsonify({"message": "Student not found."}), 404
    lesson_count = _lesson_count(user_id, category) if category in QUIZ_CATEGORIES else sum(_lesson_count(user_id, item) for item in QUIZ_CATEGORIES)
    if lesson_count < 1:
        return jsonify({"message": "This student has not finished a lesson yet, so the quiz cannot be assigned."}), 400
    if category in QUIZ_CATEGORIES and not questions and _lesson_count(user_id, category) < 1:
        return jsonify({"message": "This student has not finished that lesson yet, so the quiz cannot be assigned."}), 400
    existing = db.quiz_assignments.find_one({"user_id": user_id, "category": category, "status": "assigned"})
    if existing:
        return jsonify({"message": "This quiz is already assigned."}), 409
    record = {
        "user_id": user_id,
        "category": category,
        "source": source,
        "title": str(data.get("title") or category)[:80],
        "questions": questions,
        "status": "assigned",
        "seen": False,
        "assigned_at": datetime.utcnow().isoformat(),
        "completed_at": None,
        "score": None,
        "total_questions": len(questions) or None,
    }
    result = db.quiz_assignments.insert_one(record)
    record["_id"] = result.inserted_id
    return jsonify(_assignment_payload(record, lesson_count)), 201

@app.route("/api/teacher/quiz-assignments/<user_id>", methods=["GET"])
def teacher_quiz_assignments(user_id):
    denied = reject_unless("teacher", "admin")
    if denied:
        return denied
    if db is None:
        return jsonify({"message": "Database connection failed"}), 500
    docs = list(db.quiz_assignments.find({"user_id": str(user_id)}).sort("assigned_at", -1))
    open_categories = {doc.get("category") for doc in docs if doc.get("status") == "assigned"}
    suggestions = [
        category for category in QUIZ_CATEGORIES
        if _lesson_count(user_id, category) > 0 and category not in open_categories
    ]
    return jsonify({
        "assignments": [_assignment_payload(doc, _lesson_count(user_id, doc.get("category"))) for doc in docs],
        "suggestions": suggestions,
    }), 200

def _category_performance(user_id):
    user = db.users.find_one({"_id": ObjectId(str(user_id))}) or {}
    progress = db.progress.find_one({"_id": ObjectId(str(user_id))}) or {}
    history = user.get("quiz_history") or []
    speech = progress.get("speech_history") or []
    rows = []
    for category in QUIZ_CATEGORIES:
        quizzes = [item for item in history if str(item.get("category", "")).lower() == category]
        speeches = [item for item in speech if str(item.get("lesson_type", "")).lower() == category]
        last = quizzes[-1] if quizzes else None
        speech_avg = None
        if speeches:
            speech_avg = round(sum(float(item.get("accuracy") or 0) for item in speeches) / len(speeches), 1)
        last_pct = None
        if last:
            if last.get("percentage") is not None:
                last_pct = last.get("percentage")
            elif last.get("total_questions"):
                last_pct = round((last.get("score") or 0) / last["total_questions"] * 100)
        rows.append({
            "category": category,
            "lesson_count": _lesson_count(user_id, category),
            "quiz_attempts": len(quizzes),
            "last_score": last.get("score") if last else None,
            "last_total": last.get("total_questions") if last else None,
            "last_percentage": last_pct,
            "last_at": last.get("completed_at") if last else None,
            "speech_attempts": len(speeches),
            "speech_accuracy": speech_avg,
        })
    return rows

def _recommend_quiz(user_id):
    rows = {row["category"]: row for row in _category_performance(user_id)}

    def urgency(row):
        if row["quiz_attempts"] == 0:
            score = -1
        else:
            score = row["last_percentage"] if row["last_percentage"] is not None else 0
        speech = row["speech_accuracy"] if row["speech_accuracy"] is not None else 100
        return (score, speech, QUIZ_CATEGORIES.index(row["category"]))

    learned = [row for row in rows.values() if row["lesson_count"] > 0]
    if not learned:
        return None
    row = sorted(learned, key=urgency)[0]
    if row["quiz_attempts"] == 0:
        reason = f"You already learned {row['lesson_count']} {row['category']} items, and you have not taken this quiz yet."
    elif (row["last_percentage"] or 0) < 80:
        reason = f"Your last {row['category']} score was {row['last_score']}/{row['last_total']}. This quiz practices that again."
    else:
        reason = f"You are doing well in {row['category']}. This short quiz checks that it stuck."
    return {
        "category": row["category"],
        "status": "recommended",
        "source": "recommendation",
        "can_start": True,
        "lesson_count": row["lesson_count"],
        "reason": reason,
        "last_score": row["last_score"],
        "last_total": row["last_total"],
        "last_at": row["last_at"],
    }

@app.route("/api/quizzes/mine", methods=["GET"])
def my_quizzes():
    session = current_session()
    if not session or session.get("user_type") != "child":
        return jsonify({"message": "Unauthorized"}), 401
    if db is None:
        return jsonify({"message": "Database connection failed"}), 500
    user_id = str(session.get("user_id"))
    learned = _category_performance(user_id)
    user = db.users.find_one({"_id": ObjectId(user_id)}) or {}
    history = []
    for item in (user.get("quiz_history") or [])[-8:]:
        history.append({
            "category": item.get("category"),
            "score": item.get("score"),
            "total_questions": item.get("total_questions"),
            "percentage": item.get("percentage"),
            "completed_at": item.get("completed_at"),
        })
    teacher_quiz = _open_teacher_quiz(user_id)
    notice = None
    if teacher_quiz and not teacher_quiz.get("seen"):
        notice = f"Your teacher sent you {teacher_quiz.get('title')}."
    return jsonify({
        "learned": learned,
        "history": list(reversed(history)),
        "recommendation": _recommend_quiz(user_id),
        "teacher_quiz": teacher_quiz,
        "notice": notice,
    }), 200

@app.route("/api/quizzes/seen", methods=["POST"])
def mark_quiz_seen():
    session = current_session()
    if not session or session.get("user_type") != "child":
        return jsonify({"message": "Unauthorized"}), 401
    db.quiz_assignments.update_many(
        {"user_id": str(session.get("user_id")), "status": "assigned"},
        {"$set": {"seen": True}},
    )
    return jsonify({"ok": True}), 200

# ====================================================================
# 1. ENDPOINT: GET STUDENTS (Dropdown List)
#    (Keep this! The app needs it to list names.)
# ====================================================================
@app.route('/api/students', methods=['GET'])
def get_students():
    denied = reject_unless("teacher", "admin")
    if denied:
        return denied
    if db is None:
        return jsonify({"message": "Database connection failed"}), 500
    
    try:
        # Get all users marked as 'child'
        students_cursor = db.users.find(
            {"user_type": "child"},
            {"_id": 1, "first_name": 1, "last_name": 1, "age": 1, "grade": 1}
        )
        
        students_list = []
        for student in students_cursor:
            full_name = f"{student.get('first_name', '')} {student.get('last_name', '')}".strip()
            students_list.append({
                "_id": str(student['_id']),
                "child_name": full_name if full_name else "Unknown Student",
                "age": student.get('age', ''),
                "grade": student.get('grade', '')
            })
        
        return jsonify({"students": students_list}), 200
    
    except Exception as e:
        print(f"Error fetching students: {e}")
        return jsonify({"message": "Server error"}), 500

# ====================================================================
# 2. HELPER: ADAPTIVE QUESTION SELECTOR (THE AI BRAIN)
#    (Logic V3: "Basics First" Protocol)
# ====================================================================
from datetime import datetime

def get_adaptive_questions(user_id):
    try:
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user: return []
       
        history = user.get('quiz_history', [])
       
        all_categories = ['abc', 'numbers', 'colors', 'shapes', 'fruits', 'flags', 'veg', 'animals', 'body', 'days']

        # ⭐ DEFINE MANDATORY BASICS ⭐
        core_topics = ['abc', 'numbers']

        stats = {cat: {'attempts': 0, 'score_sum': 0, 'total_possible': 0} for cat in all_categories}
       
        for attempt in history:
            cat = attempt.get('category', '').lower()
            if cat in ["ai smart quiz", "mixed quiz", "mixed"]: continue
            if cat in stats:
                stats[cat]['attempts'] += 1
                stats[cat]['score_sum'] += attempt.get('score', 0)
                stats[cat]['total_possible'] += attempt.get('total_questions', 5)

        category_weights = {}
        for cat in all_categories:
            attempts = stats[cat]['attempts']
           
            # Calculate Accuracy
            if attempts > 0:
                total_possible = stats[cat]['total_possible']
                accuracy = stats[cat]['score_sum'] / total_possible if total_possible > 0 else 0
            else:
                accuracy = 0.0

            # --- 🚨 THE NEW "BASICS FIRST" LOGIC 🚨 ---
            if cat in core_topics:
                if attempts == 0:
                    category_weights[cat] = 50.0 # CRITICAL: Student hasn't touched Basics!
                elif accuracy < 0.7:
                    category_weights[cat] = 25.0 # CRITICAL: Student is failing Basics!
                else:
                    category_weights[cat] = 0.5  # Basics Mastered. Low priority.
            else:
                # Standard Logic for other topics
                if attempts == 0: category_weights[cat] = 5.0
                elif accuracy < 0.5: category_weights[cat] = 4.0
                else: category_weights[cat] = 1.0

        chosen_categories = random.choices(
            population=list(category_weights.keys()),
            weights=list(category_weights.values()),
            k=10
        )
        return chosen_categories

    except Exception as e:
        print(f"AI Logic Error: {e}")
        return ['abc', 'numbers'] * 5

# ====================================================================
# 3. ENDPOINT: GET RECOMMENDATIONS (Sparkles Button)
# ====================================================================
@app.route('/api/recommendation/<user_id>', methods=['GET'])
def recommend_quiz(user_id):
    denied = reject_unless("teacher", "admin")
    if denied:
        return denied
    try:
        if not ObjectId.is_valid(user_id):
            return jsonify({"message": "Invalid ID"}), 400

        recommended_topics = get_adaptive_questions(user_id)
       
        return jsonify({
            "message": "AI Recommendations Generated",
            "focus_areas": recommended_topics
        }), 200
    except Exception as e:
        print(f"Recommendation error: {e}")
        return jsonify({"error": "Could not build recommendations"}), 500


# ====================================================================
# 4. ENDPOINT: GET ANALYTICS (Dashboard Chart)
# ====================================================================
@app.route('/api/quiz-analytics/<user_id>', methods=['GET'])
def get_quiz_analytics(user_id):
    denied = reject_unless("teacher", "admin")
    if denied:
        return denied
    if db is None: return jsonify({"message": "DB Error"}), 500
    if not ObjectId.is_valid(user_id): return jsonify({"message": "Invalid ID"}), 400

    try:
        # 1. Fetch User (For Quiz History)
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user: return jsonify({"message": "User not found"}), 404

        # 2. Fetch Progress (For Prerequisite Check) - NEW!
        # We need this to know if they actually finished ABCs
        progress = db.progress.find_one({"_id": ObjectId(user_id)})
        completed_items = progress.get("completed_items", {}) if progress else {}

        # --- EXISTING ANALYTICS LOGIC (Unchanged) ---
        raw_history = user.get('quiz_history', [])
        
        clean_history = []
        for quiz in raw_history:
            q_copy = quiz.copy()
            if 'assessment_id' in q_copy: q_copy['assessment_id'] = str(q_copy['assessment_id'])
            if '_id' in q_copy: q_copy['_id'] = str(q_copy['_id'])
            clean_history.append(q_copy)
        
        all_categories = ['abc', 'numbers', 'colors', 'shapes', 'fruits', 'flags', 'veg', 'animals', 'body', 'days']
        category_stats = {cat: {'attempts': 0, 'total_score': 0, 'total_percentage': 0, 'avg_score': 0, 'avg_percentage': 0} for cat in all_categories}

        for quiz in clean_history:
            cat = quiz.get('category', '').lower()
            if cat in category_stats:
                category_stats[cat]['attempts'] += 1
                category_stats[cat]['total_score'] += quiz.get('score', 0)
                category_stats[cat]['total_percentage'] += quiz.get('percentage', 0)

        for cat, stats in category_stats.items():
            if stats['attempts'] > 0:
                stats['avg_score'] = round(stats['total_score'] / stats['attempts'], 2)
                stats['avg_percentage'] = round(stats['total_percentage'] / stats['attempts'], 2)

        total_quizzes = len(clean_history)
        avg_perc = round(sum(q.get('percentage', 0) for q in clean_history) / total_quizzes, 2) if total_quizzes > 0 else 0

        # --- 🌟 NEW: PREREQUISITE RECOMMENDATION FOR DASHBOARD 🌟 ---
        recommendation = {
            "topic": "abc",
            "message": "Let's start your journey with ABCs!",
            "status": "locked" 
        }

        # Logic: Check what they have completed in 'db.progress'
        has_abc = len(completed_items.get('abc', [])) > 0
        has_numbers = len(completed_items.get('numbers', [])) > 0
        has_colors = len(completed_items.get('colors', [])) > 0
        
        if not has_abc:
            # If they haven't done ABC, FORCE them to go back
            recommendation = {
                "topic": "abc",
                "message": "⚠️ You missed a step! Please complete ABC lessons first.",
                "status": "priority"
            }
        elif not has_numbers:
            recommendation = {
                "topic": "numbers",
                "message": "Great job on ABCs! ✅ Now let's learn Numbers.",
                "status": "next_step"
            }
        elif not has_colors:
            recommendation = {
                "topic": "colors",
                "message": "You know ABCs and Numbers! 🌈 Time for Colors!",
                "status": "next_step"
            }
        else:
             recommendation = {
                "topic": "shapes",
                "message": "You are doing great! Let's explore Shapes or Fruits.",
                "status": "open"
            }

        return jsonify({
            "total_quizzes": total_quizzes,
            "average_percentage": avg_perc,
            "quiz_history": clean_history[-20:], 
            "category_statistics": category_stats,
            "dashboard_recommendation": recommendation # <--- SEND THIS TO FRONTEND
        }), 200

    except Exception as e:
        print(f"Analytics Error: {e}")
        return jsonify({"message": "Could not load quiz analytics"}), 500

# ========================================================
# 🛡️ SECURITY: FLASK-BCRYPT FIXED
# ========================================================
@app.route('/api/verify-student-access', methods=['POST'])
def verify_student_access():
    try:
        denied = reject_unless("teacher", "admin")
        if denied:
            return denied
        data = json_body()
        user_id = clean_str(data.get('user_id'), 24)
        input_password = str(data.get('password'))[:128].strip()
        if not user_id or not ObjectId.is_valid(user_id):
            return jsonify({"success": False, "message": "User not found"}), 404
        # Stop guessing a student's password from a teacher account.
        if rate_limited(f"verify:{user_id}", 10, 900):
            return too_many_requests()

        # FETCH USER
        user = db.users.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        stored_pass = user.get('password')
        is_valid = False

        if stored_pass:
            # --- CASE A: BCRYPT HASH ($2b$...) ---
            if stored_pass.startswith('$2b$'):
                # ⭐ FIX: Use the Flask-Bcrypt method, not the raw library method
                # This handles the byte encoding automatically
                is_valid = bcrypt.check_password_hash(stored_pass, input_password)
            
            # --- CASE B: FLASK DEFAULT HASH (pbkdf2...) ---
            elif stored_pass.startswith(('pbkdf2:', 'scrypt:')):
                from werkzeug.security import check_password_hash
                is_valid = check_password_hash(stored_pass, input_password)
            
            # --- CASE C: PLAINTEXT (For manual testing) ---
            else:
                is_valid = (str(stored_pass).strip() == input_password)

        if is_valid:
            return jsonify({"success": True}), 200
        else:
            return jsonify({"success": False, "message": "Incorrect Password"}), 401

    except Exception as e:
        print(f"Auth Error: {e}")
        return jsonify({"success": False, "message": "Server Error"}), 500

# ====================================================================
# HELPER: GENERATE AI QUIZ (LLAMA 3 ON GROQ)
# ====================================================================
def generate_ai_quiz(topic, difficulty):
    """
    Uses Llama 3 (Groq) to generate a unique quiz in strictly valid JSON.
    """
    try:
        print(f"🤖 AI Generating Quiz for: {topic}...")

        # 1. Strict Prompt for JSON
        system_prompt = f"""
        You are a Kindergarten Teacher API. 
        Create 5 multiple-choice questions for a child about: {topic}.
        Difficulty: {difficulty}.
        
        CRITICAL RULES:
        1. Output ONLY a valid JSON array. No text before or after.
        2. Use simple English suitable for a 5-year-old.
        3. Use Emojis in every question (e.g. "Count the stars ⭐").
        4. "answer" must be EXACTLY one of the "options".
        
        REQUIRED JSON STRUCTURE:
        [
            {{
                "question": "What color is the sun? ☀️",
                "options": ["Blue", "Yellow", "Red", "Green"],
                "answer": "Yellow",
                "skill": "Recognition"
            }}
        ]
        """

        # 2. Call Llama 3 via Groq (Super Fast)
        completion = groq_client.chat.completions.create(
            messages=[{"role": "system", "content": system_prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.5, # Balance between creative and correct
            max_tokens=1024,
            response_format={"type": "json_object"} # Force JSON
        )

        # 3. Clean and Parse Response
        content = completion.choices[0].message.content
        
        # Sometimes models wrap JSON in a key like {"questions": [...]}, handle both
        data = json.loads(content)
        
        if isinstance(data, list):
            return data
        elif isinstance(data, dict):
            # Try to find the list inside the dict
            for key in data:
                if isinstance(data[key], list):
                    return data[key]
            
        # If structure is weird, return None to trigger fallback
        print("⚠️ AI JSON Structure Invalid")
        return None

    except Exception as e:
        print(f"⚠️ AI Generation Failed: {e}")
        return None # Return None -> Backend will switch to Static Quiz

# ====================================================================
# NEW ENDPOINT: GENERATE AI QUIZ (Frontend Button Click)
# ====================================================================
@app.route('/api/generate-ai-quiz', methods=['POST'])
def generate_custom_ai_quiz():
    denied = reject_unless("teacher", "admin")
    if denied:
        return denied
    try:
        data = json_body()
        topic = clean_str(data.get('topic'), 80) or 'mixed'
        difficulty = clean_str(data.get('difficulty'), 20) or 'Easy'
        if rate_limited(f"quizgen:{client_ip()}", 30, 600):
            return too_many_requests()

        # 1. Try AI Generation
        generated_questions = generate_ai_quiz(topic, difficulty)
        return jsonify({
            "message": "Quiz Generated",
            "questions": generated_questions,
            "topic": topic
        }), 200

    except Exception as e:
        print(f"Endpoint Error: {e}")
        return jsonify({"error": "Quiz generation failed"}), 500
# ==========================================================
# ADMIN DASHBOARD: OVERVIEW STATS
# ==========================================================

@app.route("/api/admin/stats", methods=["GET"])
def admin_stats():
    denied = reject_unless("admin")
    if denied:
        return denied
    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    try:
        total_users = db.users.count_documents({})
        total_children = db.users.count_documents({"user_type": "child"})
        total_teachers = db.users.count_documents({"user_type": "teacher"})
        total_admins = db.users.count_documents({"user_type": {"$in": ["admin", "sub_admin"]}})

        return jsonify({
            "total_users": total_users,
            "children": total_children,
            "teachers": total_teachers,
            "admins": total_admins
        }), 200

    except Exception as e:
        print("Admin stats error:", e)
        return jsonify({"error": "Failed to load admin stats"}), 500

# ==========================================================
# ADMIN: GET ALL USERS
# ==========================================================
@app.route("/api/admin/users", methods=["GET"])
def admin_get_users():
    denied = reject_unless("admin")
    if denied:
        return denied
    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    try:
        users_cursor = db.users.find({}, {
            "first_name": 1,
            "last_name": 1,
            "username": 1,
            "user_type": 1,
            "restricted": 1
        })

        users = []
        for user in users_cursor:
            users.append({
                "_id": str(user["_id"]),
                "name": f"{user.get('first_name','')} {user.get('last_name','')}".strip(),
                "email": user.get("username"),
                "role": user.get("user_type"),
                "restricted": user.get("restricted", False)
            })

        return jsonify(users), 200

    except Exception as e:
        print("Admin users error:", e)
        return jsonify({"error": "Failed to fetch users"}), 500
# ==========================================================
# ADMIN: DELETE USER
# ==========================================================
@app.route("/api/admin/delete-user/<user_id>", methods=["DELETE"])
def admin_delete_user(user_id):
    try:
        denied = reject_unless("admin")
        if denied:
            return denied
        if not ObjectId.is_valid(user_id):
            return jsonify({"error": "Invalid user ID"}), 400

        db.users.delete_one({"_id": ObjectId(user_id)})
        db.progress.delete_one({"_id": ObjectId(user_id)})
        db.sessions.delete_many({"user_id": str(user_id)})

        return jsonify({"message": "User deleted successfully"}), 200

    except Exception as e:
        print("Delete user error:", e)
        return jsonify({"error": "Failed to delete user"}), 500
# ==========================================================
# ADMIN: RESTRICT / UNRESTRICT USER
# ==========================================================
@app.route("/api/admin/toggle-restrict/<user_id>", methods=["PUT"])
def admin_toggle_restrict(user_id):
    try:
        denied = reject_unless("admin")
        if denied:
            return denied
        if not ObjectId.is_valid(user_id):
            return jsonify({"error": "Invalid user ID"}), 400

        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return jsonify({"error": "User not found"}), 404

        new_status = not user.get("restricted", False)

        update = {"$set": {"restricted": new_status}}
        if not new_status:
            # Unrestricting a new teacher also approves the account.
            update["$unset"] = {"pending_approval": ""}
        db.users.update_one({"_id": ObjectId(user_id)}, update)
        if new_status:
            # Sign the user out everywhere straight away.
            db.sessions.delete_many({"user_id": str(user_id)})

        return jsonify({
            "message": "User restriction updated",
            "restricted": new_status
        }), 200

    except Exception as e:
        print("Restrict user error:", e)
        return jsonify({"error": "Failed to update restriction"}), 500
@app.route("/api/user/lesson-access/<user_id>", methods=["GET"])
def get_lesson_access(user_id):
    session = current_session()
    if not session:
        return jsonify({"message": "Unauthorized"}), 401
    if session.get("user_type") == "child" and session.get("user_id") != str(user_id):
        return jsonify({"message": "Forbidden"}), 403
    try:
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return jsonify({"restricted_lessons": []})

        user_restricted = user.get("restricted_lessons", [])

        global_rule = db.system.find_one({"_id": "global"})
        global_restricted = global_rule.get("restricted_lessons", []) if global_rule else []

        # 🔗 Merge (no duplicates)
        final_restricted = list(set(user_restricted + global_restricted))

        return jsonify({
            "restricted_lessons": final_restricted
        })
    except:
        return jsonify({"restricted_lessons": []})


@app.route("/api/admin/update-lesson-restrictions", methods=["PUT"])
def update_lesson_restrictions():
    denied = reject_unless("admin")
    if denied:
        return denied
    data = json_body()
    raw_lessons = data.get("restricted_lessons", [])
    if not isinstance(raw_lessons, list):
        return jsonify({"message": "restricted_lessons must be a list"}), 400
    restricted_lessons = [str(item)[:30] for item in raw_lessons[:30] if isinstance(item, str)]
    user_id = data.get("user_id")

    # ✅ PER USER
    if user_id:
        if not isinstance(user_id, str) or not ObjectId.is_valid(user_id):
            return jsonify({"message": "Invalid user ID"}), 400
        result = db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"restricted_lessons": restricted_lessons}},
        )
        if result.matched_count == 0:
            return jsonify({"message": "User not found"}), 404
        return jsonify({"message": "User lesson access updated"})

    # ✅ GLOBAL (ALL CHILDREN)
    db.system.update_one(
        {"_id": "global"},
        {"$set": {"restricted_lessons": restricted_lessons}},
        upsert=True
    )
    return jsonify({"message": "Global lesson access updated"})

@app.route("/api/admin/get-lesson-restrictions/<user_id>", methods=["GET"])
def get_lesson_restrictions(user_id):
    denied = reject_unless("admin")
    if denied:
        return denied
    try:
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return jsonify({"restricted_lessons": []}), 200

        return jsonify({
            "restricted_lessons": user.get("restricted_lessons", [])
        }), 200

    except Exception as e:
        print("Error loading restrictions:", e)
        return jsonify({"restricted_lessons": []}), 500

@app.route("/api/admin/get-global-lesson-restrictions", methods=["GET"])
def get_global_lesson_restrictions():
    denied = reject_unless("admin")
    if denied:
        return denied
    try:
        rule = db.system.find_one({"_id": "global"}) if db is not None else None
        lessons = rule.get("restricted_lessons", []) if rule else []
        return jsonify({"restricted_lessons": lessons}), 200
    except Exception as e:
        print("Error loading global restrictions:", e)
        return jsonify({"restricted_lessons": []}), 500

# --- (Application Run - UNCHANGED) ---
if __name__ == "__main__":
    print("🎵 Smart Tutor Backend Starting...")
    print(f"Gemini API: {'✅ Available' if GEMINI_API_KEY else '❌ Not configured'}")
    print(f"Azure TTS: {'✅ Available' if SPEECH_KEY and SPEECH_REGION else '❌ Not configured'}")
    print(f"ElevenLabs TTS: {'✅ Available' if ELEVENLABS_API_KEY else '❌ Not configured'}")
    print("Browser TTS: ✅ Always available")
    print(f"Groq Speech API: {'✅ Available' if groq_client else '❌ Not configured'}")
    print(f"Phi-2 model: Available")
    # The debug console allows running code, so it is only on when FLASK_DEBUG=1.
    app.run(host="127.0.0.1", port=5000, debug=os.getenv("FLASK_DEBUG") == "1")

