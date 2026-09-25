"""Error monitoring (Sentry) and the system status shown to the admin.

Sentry starts only when SENTRY_DSN is set. Events are scrubbed before they leave the server:
no request bodies, cookies, headers, query strings or user details, so children's data never
reaches Sentry.
"""
import os

SECRET_WORDS = ("token", "password", "authorization", "cookie", "email", "username", "first_name", "last_name")


def scrub_event(event, hint=None):
    event.pop("user", None)
    request = event.get("request")
    if isinstance(request, dict):
        for key in ("data", "cookies", "headers", "query_string", "env"):
            request.pop(key, None)
        if isinstance(request.get("url"), str):
            request["url"] = request["url"].split("?")[0]
    # Local variables in stack frames can hold passwords or tokens.
    for exc in (event.get("exception") or {}).get("values") or []:
        for frame in (exc.get("stacktrace") or {}).get("frames") or []:
            frame.pop("vars", None)
    for crumb in (event.get("breadcrumbs") or {}).get("values") or []:
        message = str(crumb.get("message") or "")
        if any(word in message.lower() for word in SECRET_WORDS):
            crumb["message"] = "[removed]"
        crumb.pop("data", None)
    return event


def init_sentry():
    dsn = os.getenv("SENTRY_DSN")
    if not dsn:
        return False
    try:
        import sentry_sdk
        sentry_sdk.init(
            dsn=dsn,
            environment=os.getenv("VERCEL_ENV") or os.getenv("FLASK_ENV") or "development",
            release=(os.getenv("VERCEL_GIT_COMMIT_SHA") or "")[:12] or None,
            send_default_pii=False,
            include_local_variables=False,
            traces_sample_rate=0,
            before_send=scrub_event,
        )
        return True
    except Exception as e:  # monitoring must never stop the app
        print(f"Sentry could not start: {e}")
        return False


def system_status():
    """What is switched on (no secret values, only yes/no)."""
    return {
        "error_monitoring": bool(os.getenv("SENTRY_DSN")),
        "error_monitoring_frontend": bool(os.getenv("VITE_SENTRY_DSN")),
        "weekly_email": bool(os.getenv("RESEND_API_KEY")),
        "weekly_email_schedule": bool(os.getenv("CRON_SECRET")),
        "azure_voice": bool(os.getenv("SPEECH_KEY") and os.getenv("SPEECH_REGION")),
        "environment": os.getenv("VERCEL_ENV") or "local",
        "database_name": os.getenv("MONGO_DB_NAME", "smart_tutor"),
        "version": (os.getenv("VERCEL_GIT_COMMIT_SHA") or "")[:7] or "local",
    }
