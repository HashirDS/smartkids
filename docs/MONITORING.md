# Monitoring: analytics, error alerts and uptime

Everything here is off until its setting is added, and nothing breaks without it.
The admin dashboard has a **System status** card that shows what is switched on.

## 1. Visitor analytics (Vercel Web Analytics)

- Vercel → project → **Analytics** tab → **Enable**. No setting to add.
- It only runs on the live site, only after a visitor presses **Accept** on the cookie notice,
  and only counts public pages: home, login, join, try-classroom and the legal pages.
  Lessons, dashboards and the parent page are never counted, and `/join?code=…` is counted as `/join`.
- It uses no cookies.

## 2. Error alerts (Sentry)

1. Sign up at sentry.io (the free plan is enough).
2. Create two projects: **React** (website) and **Flask** (server). Each gives you a DSN link.
3. Vercel → Settings → Environment Variables, for **Production** and **Preview**:
   - `VITE_SENTRY_DSN` = the React project's DSN
   - `SENTRY_DSN` = the Flask project's DSN
4. Redeploy. In Sentry → Alerts, turn on email for new issues.

Privacy: only errors are sent, with no performance tracing and no session replay. Before a
report leaves the browser or server, names, emails, logins, tokens, cookies, request bodies,
page queries and stack-frame variables are removed.

## 3. Uptime (UptimeRobot)

1. Sign up at uptimerobot.com (free).
2. **Add New Monitor** → type **Keyword**:
   - URL: `https://<your-site>/api/health`
   - Keyword: `"status":"ok"` → alert when the keyword is **not** found
   - Interval: 5 minutes
3. Add your email (and WhatsApp/SMS if you like) as the alert contact.

`/api/health` returns `200` with `"status":"ok"` when the server and database work, and
`503` with `"status":"degraded"` when the database cannot be reached. It also shows the running
version and environment, but no secrets.
