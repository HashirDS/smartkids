# AI Tutor – Product Plan (Early Years)

AI Tutor is a product of XactGen and Datix AI. This plan turns the current app into a
school-ready product for **preschool, nursery, prep and KG1 (ages about 3–6)**.
It is the single place to track what is planned, being built and done.

Status key: ⬜ planned · 🟨 in progress · ✅ done · ⏸ deferred

---

## 1. What we heard from each group (planning sessions)

| Who | What they need | What it means for the product |
|---|---|---|
| **Admin (XactGen / Datix AI)** | Add and manage schools; see everything; approve teachers; restrict lessons | Admin console: Schools, Principals, Users, Lesson access, Reports |
| **Principal (school account)** | Run their own school: create classes, add teachers, add students, see school progress | New *principal* role and dashboard, limited to their school |
| **Teacher** | See only *their* class, assign quizzes, track each child, talk to parents | Teacher data is scoped to assigned classes (today teachers see every child) |
| **Parent** | Simple view of their own child, weekly email, easy sign-up with a class code | New *parent* role, parent dashboard, weekly progress email |
| **Child (3–6)** | Big, bright, spoken, never stuck on reading; rewards | Voice-first lessons in English, Urdu, Arabic; stickers, badges, streaks |
| **Developers** | Safe releases, no surprises | Automated tests, CI on every push, staging with its own database, error monitoring |

Guiding rules agreed:
- No child ever creates an account alone. A **staff member** or a **parent** does.
- Everything a child does is linked to one school → class → teacher, and to one or more parents.
- Every new lesson plugs into the same places: student home tiles, Lessons menu, voice
  commands, progress saving, teacher charts, quizzes, admin/principal lesson restrictions.
- Everything matches the landing-page theme (bright colors, Fredoka headings, AI Tutor logo).

---

## 2. Roles and how they connect

```
Admin ──adds──▶ School ──has──▶ Principal
                   │
                   ├──has──▶ Classes ──have──▶ Teachers (one or more)
                   │                      └──▶ Students ──linked to──▶ Parents
```

| Role | Created by | Can see | Can do |
|---|---|---|---|
| Admin | Server settings (single admin for now) | Everything | Add/edit schools and principals, everything a principal can, approve teachers, restrict lessons |
| Principal | Admin | Own school only | Add classes, teachers, students; move students; see school reports; restrict lessons for the school |
| Teacher | Principal or Admin (or self sign-up → approval) | Own classes only | Add students to own class, assign quizzes, view progress, see parent contact |
| Parent | Self sign-up with class code, or created when staff add a student | Own children only | View progress, receive weekly email, add a sibling with a class code |
| Student | Staff (class) or Parent (class code) | Own lessons | Learn, practise speaking, take quizzes, collect stickers |

**Enrollment – both ways (decided):**
1. *Staff way*: principal/teacher opens a class → **Add student** → child's name, age/level,
   parent name, email, phone → child login is created and shown once to share with the parent.
2. *Parent way*: parent signs up at `/join` with the **class code** (e.g. `KG1-A7F3`) → adds child →
   child joins that class; the teacher sees the new child immediately.

---

## 3. Modules (build order)

Each module is built, tested (automated + clicked through), then pushed to the
`landing-page-redesign` branch before the next starts.

### M0 – Foundations: tests, CI and staging ✅
- Backend test suite (pytest + in-memory MongoDB) covering login, roles, scoping, progress.
- Frontend checks: lint + production build.
- GitHub Actions: run all checks on every push and pull request.
- Staging: the branch deploy on Vercel is staging, using its **own database**
  (`MONGO_DB_NAME=smart_tutor_staging`) so testing never touches real children's data.
- `/api/health` endpoint for uptime checks.

### M1 – Schools, classes, principals, teachers ✅
- Data: `schools`, `classes` (name, level: Preschool/Nursery/Prep/KG1, code, teacher_ids, school_id);
  users get `school_id` and `class_ids`.
- Admin console: Schools list → Add school (name, city, country) + principal account.
- Principal dashboard: Classes, Teachers, Students, School progress, Lesson access.
- Teacher dashboard shows only their classes and students (class switcher).
- **Every teacher/principal API is scoped** to their school/classes (security).
- Existing users are kept: current students/teachers go into a "Default school" until moved.

### M2 – Parents ⬜
- Parent role, parent dashboard (child progress, badges, recent activity).
- Staff "Add student" collects parent details; parent account created/linked automatically.
- `/join` page: parent sign-up with class code; add another child later.
- Weekly progress email every Sunday (Vercel Cron → `/api/cron/weekly-report`, email via Resend).
- Admin and principal can view and edit parent details on every child.

### M3 – Languages: Urdu and Arabic ⬜
- Language switch (English / اردو / العربية) for child, teacher, parent; right-to-left layout for Urdu and Arabic.
- All app text translated; lessons have English + Urdu + Arabic names/audio where it makes sense.
- Tutor voice speaks the chosen language (Azure voices ur-PK and ar-SA; browser voice as fallback).
- New lessons: **Urdu alphabet (حروفِ تہجی)** and **Arabic Qaida alphabet**.
- Translations reviewed by a native speaker before going live.

### M4 – New content ⬜
- **Islamic studies** (first version, needs a scholar's review): Five Pillars, Wudu steps, names of the
  five prayers; some of Allah's 99 names with meanings; short Prophets' stories for kids.
- **Science** for early years: my body, day and night, weather, plants.
- **Animals**: animal names and sounds, farm/wild/sea.
- Every lesson plugs into tiles, menu, voice commands, progress, quizzes, charts, restrictions.

### M5 – Motivation: stickers, badges, streaks ⬜
- Stickers for each item learned, badges for milestones (e.g. "ABC Star", "10-day streak"),
  daily streak counter; shown on student home, parent dashboard and weekly email.

### M6 – Analytics, error monitoring, uptime ⬜
- Privacy-friendly, cookie-free page analytics (Vercel Web Analytics), only after consent on public pages,
  never on children's lesson screens.
- Error monitoring with Sentry (frontend + backend), no children's personal data sent.
- Uptime alerts (UptimeRobot on `/api/health`).

### M7 – Child-safety compliance (ages 3–6) ⬜
- Parental consent step on every child account; data export/delete on request.
- AI answers filtered for child safety; no free chat for children with strangers.
- Public "Child Safety" page; privacy policy updated for schools/parents/principals.
- Readiness checklist for COPPA, GDPR-K/UK Age-Appropriate Design Code and a kidSAFE-style seal
  (the certification itself is applied for by the company).

### Deferred (by decision) ⏸
Email verification, forgot password, multiple admins · Billing (Stripe, JazzCash, Easypaisa) ·
Mobile PWA/offline (after ~50 customers) · European languages.

---

## 4. Accounts and settings the team needs to create

| For | What to do | Setting to add on Vercel |
|---|---|---|
| Staging database | Same MongoDB cluster, new database name | Preview env: `MONGO_DB_NAME=smart_tutor_staging` (+ `MONGO_URI`) |
| Weekly emails | Create a Resend account, verify the sending domain (e.g. datixai.com) | `RESEND_API_KEY`, `EMAIL_FROM` |
| Cron security | Any long random text | `CRON_SECRET` |
| Error monitoring | Create a Sentry project (React + Flask) | `VITE_SENTRY_DSN`, `SENTRY_DSN` |
| Analytics | Enable Web Analytics in the Vercel project | – |
| Uptime | UptimeRobot monitor on `https://<site>/api/health` | – |
| Urdu/Arabic voices | Existing Azure Speech key works | `SPEECH_KEY`, `SPEECH_REGION` |

Features that need a key stay switched off until the key is added; nothing breaks without them.

---

## 5. Change log

| Date | Module | Notes |
|---|---|---|
| 2026-09-25 | Landing, security, SEO, legal, Flags | Landing redesign, app navbars, Flags lesson, security hardening, SEO, legal pages, welcome popup removed |
| 2026-09-25 | M0 | Backend test suite (pytest + mongomock), GitHub Actions CI (lint, build, tests), MONGO_DB_NAME for a separate staging database, /api/health, fixed conditional React hooks in the teacher dashboard |
| 2026-09-25 | M1 | Schools, classes (Preschool/Nursery/Prep/KG1) with class codes, principal role and dashboard, admin Schools page, teacher My Classes tab, staff add students with parent details (login shown once), move students, reset passwords, school-level lesson access, all teacher/principal APIs scoped to their own classes/school, existing users moved into a Default school |
