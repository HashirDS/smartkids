# Child-safety readiness checklist (ages 3–6)

Status: ✅ done in the product · 🟡 partly done · 🏢 company/legal action (not code)

This is an engineering readiness list, not legal advice. Before launching in the US, UK or EU,
have a privacy lawyer review it together with the Privacy Policy, Terms and Child Safety page.

## Product safeguards built in

| Safeguard | Where | Status |
|---|---|---|
| Children cannot self-register: parent consent tick required for child sign-up; `/join` requires parent/guardian consent; school-added children marked `consent_source: school` | `backend/app.py` register, `backend/parents.py` join, Terms | ✅ |
| Consent recorded (`consent_at`, `consent_source`) | users collection | ✅ |
| Personal details removed before any AI call (names of the signed-in child, emails, phone numbers, CNIC, links, logins) | `backend/child_safety.py` → `/api/ai`, `/api/chat`, `/generate-poem`, `/api/generate-ai-quiz` | ✅ |
| AI safety rules added to every AI system prompt | same | ✅ |
| AI answers checked before a child sees them: unsafe words → safe reply, links removed, unsafe quiz questions dropped | `filter_ai_response` (after-request) | ✅ |
| Voice recordings deleted after transcription; Deepgram opted out of model training (`mip_opt_out=true`) | `/analyze_speech` | ✅ |
| No child-to-child or stranger communication, no public profiles, no uploads | product design | ✅ |
| No ads, no in-app purchases, no data selling | product design | ✅ |
| Parents: download all child data (JSON) | parent page → `/api/parent/children/<id>/export` | ✅ |
| Parents: delete a child's data completely (account, progress, quizzes, assignments, sessions); anonymous deletion log | parent page → `DELETE /api/parent/children/<id>` | ✅ |
| Parents: delete own account, turn weekly email off | parent page | ✅ |
| Staff see only their own classes/school | `visible_student_filter`, `can_view_student` | ✅ |
| Analytics only after consent, public pages only, never on children's screens; Sentry scrubs personal data | `src/monitoring.js`, `backend/monitoring.py` | ✅ |
| Children log in with generated logins, not personal email | `create_student` | ✅ |
| Islamic content: no depictions of people/prophets; staff warning until reviewed; school can switch it off | `src/data/topics.js` | 🟡 scholar review pending |
| Urdu/Arabic text reviewed by native speakers | `src/i18n/strings.js`, `src/data/urdu.js`, `src/data/arabic.js` | 🟡 review pending |

## US – COPPA (children under 13)

| Requirement | Status |
|---|---|
| Clear privacy notice describing data collected from children, uses, disclosures, parental rights | ✅ Privacy Policy + Child Safety page |
| Direct notice to parents and verifiable parental consent before collecting child data | 🟡 Consent tick + school consent (the "school authorisation" route). For direct-to-parent signups in the US, add a stronger method (e.g. card check or signed form) — 🏢 decide with lawyer |
| Parents can review and delete their child's data and refuse further collection | ✅ export / delete / account delete |
| Collect only what is reasonably necessary | ✅ |
| Reasonable security; service providers bound to protect data | ✅ security · 🏢 sign data-processing agreements (DPAs) with providers |
| Data retention policy; delete when no longer needed | 🟡 deletion on request · 🏢 decide a retention period for inactive accounts (e.g. 24 months) |
| Safe-harbour seal (e.g. kidSAFE, PRIVO) | 🏢 apply when ready |

## UK – Age Appropriate Design Code (15 standards)

| Standard | Status |
|---|---|
| 1 Best interests of the child | ✅ design choices above |
| 2 Data protection impact assessment (DPIA) | 🏢 write and keep a DPIA |
| 3 Age-appropriate application | ✅ built for 3–6 only |
| 4 Transparency (child-friendly info) | 🟡 Child Safety page for parents · 🏢 optional picture version for children |
| 5 Detrimental use of data (no nudges against wellbeing) | ✅ no ads, rewards are stickers only |
| 6 Policies and community standards | ✅ Terms, Privacy, Child Safety |
| 7 Default settings high privacy | ✅ analytics off by default, no public sharing |
| 8 Data minimisation | ✅ |
| 9 Data sharing (none by default) | ✅ providers only |
| 10 Geolocation off | ✅ not collected |
| 11 Parental controls (with child awareness) | ✅ parent page |
| 12 Profiling off by default | ✅ quiz recommendation uses only the child's own lesson progress, no profiling for other purposes |
| 13 Nudge techniques | ✅ none |
| 14 Connected toys/devices | n/a |
| 15 Online tools (rights requests) | ✅ export/delete on parent page, email for others |

## EU/UK GDPR (Art. 8 and general)

| Requirement | Status |
|---|---|
| Parental consent for children under 13–16 (country age) | ✅ consent tick / school consent |
| Lawful basis and transparency | ✅ Privacy Policy |
| Rights: access, portability, erasure, rectification | ✅ export (JSON), delete, school/parent edit |
| Records of processing; DPAs with processors | 🏢 |
| International transfers safeguards (SCCs) | 🏢 via providers' standard contractual clauses |
| Breach procedure (72-hour notice) | 🏢 write a short incident plan; Sentry + UptimeRobot give early warning |

## Pakistan

| Item | Status |
|---|---|
| PECA 2016: secure systems, no unlawful sharing of personal data | ✅ |
| Personal Data Protection Bill (when enacted): consent, rights, data localisation rules | 🏢 track and review |

## Company to-do list (short)

1. Scholar review of Islamic Studies (`src/data/topics.js`), then set `ISLAMIC_REVIEWED = true`.
2. Native-speaker review of Urdu and Arabic text.
3. Sign DPAs with MongoDB, Vercel, Microsoft, Google, Deepgram, Groq, Resend, Sentry.
4. Write a one-page DPIA and an incident plan.
5. Decide a retention period for inactive child accounts (we can add automatic clean-up).
6. For US direct-to-parent sign-ups, choose a verifiable parental consent method with a lawyer.
7. Consider a kidSAFE/PRIVO seal once the above are done.
