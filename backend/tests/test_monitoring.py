import sentry_sdk
from conftest import auth

import monitoring


def test_health_reports_database_and_version(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    body = r.get_json()
    assert body["status"] == "ok" and body["database"] is True
    assert body["version"] and body["time"].endswith("Z")
    assert client.head("/api/health").status_code == 200


def test_system_status_is_admin_only_and_has_no_secrets(client, admin_token, make_user, monkeypatch):
    monkeypatch.setenv("SENTRY_DSN", "https://secret-key@o1.ingest.sentry.io/1")
    monkeypatch.delenv("RESEND_API_KEY", raising=False)
    kid = make_user("kid@test.local")
    assert client.get("/api/admin/system-status", headers=auth(kid["token"])).status_code == 401
    r = client.get("/api/admin/system-status", headers=auth(admin_token))
    assert r.status_code == 200
    body = r.get_json()
    assert body["error_monitoring"] is True and body["weekly_email"] is False and body["database"] is True
    assert "secret-key" not in r.get_data(as_text=True)


def test_sentry_stays_off_without_dsn(monkeypatch):
    monkeypatch.delenv("SENTRY_DSN", raising=False)
    assert monitoring.init_sentry() is False


def test_sentry_starts_with_privacy_settings(monkeypatch):
    seen = {}
    monkeypatch.setenv("SENTRY_DSN", "https://key@o1.ingest.sentry.io/1")
    monkeypatch.setattr(sentry_sdk, "init", lambda **kw: seen.update(kw))
    assert monitoring.init_sentry() is True
    assert seen["send_default_pii"] is False and seen["include_local_variables"] is False
    assert seen["traces_sample_rate"] == 0 and seen["before_send"] is monitoring.scrub_event


def test_scrubber_removes_children_data():
    event = {
        "user": {"id": "abc", "email": "kid@x.com"},
        "request": {"url": "https://site/api/join?code=KG1-AAAA", "data": {"password": "p"},
                    "cookies": {"a": "b"}, "headers": {"Authorization": "Bearer t"}, "query_string": "code=1"},
        "exception": {"values": [{"stacktrace": {"frames": [{"function": "login", "vars": {"password": "p"}}]}}]},
        "breadcrumbs": {"values": [{"message": "login for kid@x.com with token abc", "data": {"x": 1}},
                                   {"message": "clicked tile"}]},
    }
    out = monitoring.scrub_event(event)
    assert "user" not in out
    assert out["request"] == {"url": "https://site/api/join"}
    assert "vars" not in out["exception"]["values"][0]["stacktrace"]["frames"][0]
    assert out["breadcrumbs"]["values"][0]["message"] == "[removed]"
    assert out["breadcrumbs"]["values"][1]["message"] == "clicked tile"
