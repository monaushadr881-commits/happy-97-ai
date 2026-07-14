# Phase 9 — HAPPY AI Education Operating System (Education OS)

The world's first **AI-native Education Operating System**. Students learn
only from HAPPY. There is no teacher role, no teacher entity, no teacher
table anywhere in the platform. "Teacher / Professor / Mentor / Tutor /
Coach / Coding / Language / Business / Culture" are **modes of HAPPY**
routed through the Lovable AI Gateway.

## 1 · Architecture

```text
Student  ──►  /education (route layout, EducationProvider)
Creator  ──►  /education/creator (Content Creator studio)
              │
              ▼
       education-v1.functions.ts  (createServerFn + requireSupabaseAuth)
              │
              ▼
       Supabase (RLS: courses / lessons / enrollments / lesson_progress
                       / quizzes / quiz_attempts / certificates
                       / study_notes / study_bookmarks / study_flashcards
                       / study_plans / study_sessions / content_uploads
                       / ai_tutor_sessions)
              │
              ▼
    Lovable AI Gateway  (aiTutorAsk — mode-conditioned system prompts)
```

Rules:

- UI never touches the database directly; every read/write goes through
  `education-v1.functions.ts`.
- Every server function is authenticated via `requireSupabaseAuth` and
  Zod-validated.
- RLS scopes rows per user or per company (`is_company_member`,
  `is_company_admin`).
- No teacher entity exists anywhere — the row schema, service layer, UI,
  and navigation are all teacher-free.

## 2 · Navigation tree

```text
/education
  ├─ /              Student dashboard (streak, minutes, due reviews, plans)
  ├─ /library       Course library (search, level filter, enroll)
  ├─ /my            My enrollments
  ├─ /tutor         HAPPY AI Teacher (nine modes × six variants)
  ├─ /notes         Personal study notes
  ├─ /flashcards    SM-2 spaced repetition
  ├─ /exams         Attempts, average, pass rate
  ├─ /plans         Personal study plans
  ├─ /certificates  Earned certificates
  ├─ /creator       Content Creator studio (courses + uploads)
  ├─ /analytics     Learning analytics (minutes, modes, retention)
  └─ /search        Universal Education search
```

## 3 · Module inventory

| Module | Route | Purpose |
| --- | --- | --- |
| Dashboard | `/education` | Cockpit; streaks, due reviews, active plans, series chart |
| Library | `/education/library` | Public + company courses; search, filter, enroll |
| My Learning | `/education/my` | Enrollments + progress |
| AI Teacher | `/education/tutor` | HAPPY in nine teaching modes with adaptive variants |
| Notes | `/education/notes` | Personal notes CRUD |
| Flashcards | `/education/flashcards` | SM-2 review + create |
| Exams | `/education/exams` | Quiz attempts + pass rate |
| Study Plans | `/education/plans` | Personal AI plans |
| Certificates | `/education/certificates` | Earned certificates |
| Creator | `/education/creator` | Content Creator studio |
| Analytics | `/education/analytics` | Time, mode mix, retention |
| Search | `/education/search` | Universal search across every entity |

## 4 · HAPPY AI Teacher — teaching modes

Nine modes, all backed by a single `aiTutorAsk` server function:

`teacher`, `professor`, `mentor`, `tutor`, `coach`, `coding`, `language`,
`business`, `culture`.

Six adaptive **variants** per session:

`explain`, `simpler`, `advanced`, `practice`, `flashcards`, `summary`.

Sessions persist in `ai_tutor_sessions` with the last 100 turns per user.

## 5 · Learning engine

- **SM-2 spaced repetition** for flashcards (`eduReviewFlashcard`):
  quality 0..5 with ease clamped ≥ 1.3.
- **Streak** derived from `study_sessions` (consecutive days ending today,
  90-day window).
- **Adaptive quiz scoring** (`eduSubmitQuiz`) with server-side answer
  correctness — the client never sees the correct answers.
- **Teach-Back / Teach-Until-Mastered** — modelled as `tutor` mode +
  `simpler` variant (server system prompt).
- **Personalised study plans** (`study_plans.plan jsonb`) — schema-free
  for future engines.

## 6 · API inventory (server functions)

Auth: every function goes through `requireSupabaseAuth`.

**Catalog:** `eduListCourses`, `eduGetCourse`
**Enrollment:** `eduMyEnrollments`, `eduEnroll`, `eduLessonProgress`
**Notes / Bookmarks:** `eduListNotes`, `eduSaveNote`, `eduDeleteNote`, `eduBookmark`
**Flashcards:** `eduListFlashcards`, `eduSaveFlashcard`, `eduReviewFlashcard`
**Quizzes:** `eduGetQuiz`, `eduSubmitQuiz`, `eduMyAttempts`
**Plans / sessions:** `eduListPlans`, `eduSavePlan`, `eduLogSession`
**Dashboard / analytics:** `eduStudentDashboard`, `eduAnalytics`
**Creator:** `eduListUploads`, `eduCreateUpload`, `eduUpdateUploadStatus`, `eduCreateCourse`
**Search:** `eduSearch`
**AI Teacher:** `aiTutorAsk`, `aiTutorSessions`

## 7 · Database extensions (Phase 9 migration)

New public tables — all with `GRANT`s + RLS:

- `study_notes` (owner-only)
- `study_bookmarks` (owner-only)
- `study_flashcards` (owner-only; SM-2 fields)
- `study_plans` (owner-only)
- `study_sessions` (owner-only)
- `content_uploads` (creator-write; company-member read of published; admin moderation)
- `ai_tutor_sessions` (owner-only)

Reuses Phase 4 tables unchanged: `courses`, `course_modules`, `lessons`,
`course_enrollments`, `lesson_progress`, `quizzes`, `quiz_questions`,
`quiz_attempts`, `certificates`, `assignments`, `assignment_submissions`,
`knowledge_categories`.

## 8 · Security summary

- RLS on every new table.
- Owner-only policies for personal data (notes, bookmarks, flashcards,
  plans, sessions, tutor sessions).
- `content_uploads`: creators write their own rows; company admins moderate;
  members read published items in their company; students never see
  pending/rejected uploads unless they authored them.
- Quiz correct answers never leave the server (`eduGetQuiz` returns
  `choices`, not `correct`; scoring is server-side in `eduSubmitQuiz`).
- `aiTutorAsk` reads `LOVABLE_API_KEY` only inside the handler; never
  exposed to the browser.
- Culture / religion mode is instructed to attribute interpretations and
  avoid presenting a single tradition as universal fact.

## 9 · Performance summary

- Head-only count queries on the dashboard for O(1) KPIs.
- Bounded `.limit()` on every list endpoint (max 500).
- 30-day analytics bucketed in-memory from a single date-filtered query.
- Streak computed from a small dictionary (≤ 90 entries).
- Client caches all reads via TanStack Query; invalidation only on writes.
- Zero heavy chart libraries — CSS bars only.

## 10 · Accessibility summary

- Keyboard-first sub-navigation.
- Voice / large text / playback speed / offline mode / dark mode are
  first-class product requirements delivered by the design system tokens
  and lesson player primitives (course viewer is planned in Phase 10;
  Phase 9 ships the operating system).

## 11 · Testing summary

- Every server function returns typed shapes consumed by typed React
  Query hooks — the TypeScript build is the primary correctness gate.
- Every write goes through the same `guard` wrapper that maps errors to
  `AppError`, keeping toast messages consistent.

## 12 · Documentation

- This file (`docs/architecture/phase-9-education-os.md`).
- Prior phases: 2 (foundation), 4 (database), 5 (services), 5.6 (ops),
  6 (founder), 7 (enterprise), 8 (business).

## 13 · Governance rules (permanent)

1. Never introduce a "teacher" entity, role, table, service, dashboard,
   permission, notification or UI. The AI is the teacher.
2. Content Creators may only write their own rows; company admins moderate.
   Students never see unpublished uploads unless they authored them.
3. AI teaching modes MUST route through `aiTutorAsk` and MUST use the
   Lovable AI Gateway. No other model provider integrations.
4. Personal data (notes, flashcards, plans, sessions, tutor transcripts)
   is owner-only. No cross-user reads for any reason.
5. Every new education table follows the CREATE → GRANT → RLS ENABLE →
   POLICY order in the same migration.
