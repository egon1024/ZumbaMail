## Context

Waitlists today are `Enrollment` rows with `status='waiting'`. There is no rank field; the enrollment POST accepts unordered ID sets; UIs and APIs sort alphabetically (and inconsistently). Alyssa needs optional priority ordering per class that stays consistent across enrollment management, class detail, attendance, and Google Sheets sign-in sheets.

End user is non-technical; ranking UI must stay simple (per-row rank input with Enter-to-submit, conflict modal). Primary developer is strong in Python/Django and newer to React — prefer clear shared helpers over duplicated sort logic.

## Goals / Non-Goals

**Goals:**

- Optional integer rank (≥ 1) per waitlisted enrollment, independent per activity.
- Shared order: ranked ascending, then unranked by name.
- Per-student rank set/clear from enrollment page with conflict modal and contiguous cascade.
- Clear rank when leaving waitlist; consistent display on enrollment, class detail, attendance update/detail, and sign-in sheets.
- Sign-in sheet: Option B ordering + narrow Rank column.

**Non-Goals:**

- Compacting ranks to 1..n or auto-renumbering gaps.
- Drag-and-drop reordering.
- Ranking enrolled (active) students.
- Enforcing an upper bound (e.g. 999) beyond UI box width.
- New “contact waitlist” product flow.
- Persisting historical ranks after enroll/remove.

## Decisions

### 1. Store rank on `Enrollment` as nullable field

- **Choice:** `waitlist_rank` — `PositiveIntegerField(null=True, blank=True)` (or equivalent) on `Enrollment`.
- **Rationale:** Rank is a property of student-in-class status, not of the student globally. Nullable = unranked.
- **Alternatives:** Separate `WaitlistPosition` table (overkill for one optional int); ordered array on Activity (fights existing Enrollment model and multi-writer updates).

### 2. Partial uniqueness per activity

- **Choice:** Unique among waiting enrollments with non-null rank for the same activity (DB constraint or equivalent enforced in transaction + migration).
- **Rationale:** Prevents silent duplicate ranks under concurrent edits; cascade runs inside a transaction before commit.
- **Alternatives:** App-only checks (racy); allow duplicates (defeats ranking).

### 3. Dedicated rank API, not bulk enrollment POST

- **Choice:** e.g. `POST /api/activity/<pk>/waitlist-rank/` with `{ student_id, rank }` where `rank` is null/omitted/empty to clear; optional `force: true` for cascade.
  - Without force, occupied target → `409` (or structured conflict response) naming the current occupant.
  - With force, run cascade then succeed.
- **Rationale:** Submit is per-student; conflict UX needs a round-trip; bulk enrollment POST already destroys order via sets and should only clear ranks on status leave.
- **Alternatives:** Extend bulk enrollment payload (poor fit for single-row Rank + modal); client-only conflict detection (racy).

### 4. Cascade algorithm

- **Choice:** Before applying, if the student already has a rank, clear it (within the transaction). Then assign target rank. While target is occupied, increment that occupant’s rank by 1 and repeat for the next integer until a free rank (or end of occupied contiguous run). Leave non-contiguous higher ranks alone.
- **Rationale:** Matches agreed examples (insert at 1 bumps 1..3 but not 10; moving an existing ranked student does not self-bump).
- **Clear:** empty Rank submit → set `waitlist_rank=null`; no backfill.
- **Move to free rank:** update that enrollment only.
- **Alternatives:** Renumber all ranks on every change (rejected — gaps are intentional); shift everyone ≥ target (would bump Dee:10 when inserting at 1 — rejected).

### 5. Shared ordering helpers

- **Backend:** Single utility (e.g. `activity/utils/waitlist_order.py`) used by activity serializer waitlist, attendance waitlist payload, sign-in sheet generation.
  - Key: `(rank is null, rank or 0, last_name, first_name)` with nulls last via boolean/`Case`/`order_by`.
- **Frontend:** Shared sort helper (and small presentational pattern for aligned rank + name) used by ManageEnrollment, ClassDetail, UpdateAttendance, AttendanceDetail.
- **Rationale:** Today alphabetical sorts already diverge (`display_name` vs last/first); encapsulate once.
- **Alternatives:** Ad-hoc sorts per screen (status quo drift).

### 6. Enrollment page UI

- **Choice:** In waitlist column, after name: empty-capable input (~3 digits wide); Enter submits that row only (no Rank button). Names left-aligned and wrap (no ellipsis); inputs vertically aligned (CSS grid). Three columns use `col-xl-4` so they stack below xl like phone. Conflict modal: message naming occupant; **Yes** then **No**.
- **Rationale:** Enter is enough; full names matter more than fitting three columns; stack early rather than truncate.
- **Touch:** Adequately sized rank input for mobile.

### 7. Clear rank on leave-waiting

- **Choice:** In `ActivityEnrollmentUpdateView`, when setting `active` or deleting enrollment, ensure `waitlist_rank` is null (explicit clear on status change; delete removes row).
- **Rationale:** Rank must not linger if status somehow stays or admin paths confuse; delete is sufficient for remove, clear-on-active for enroll.
- **Also:** New waitlistees start with null rank.

### 8. Sign-in sheet layout (Option B)

- **Choice:** After “Wait List/Drop Ins” header: ranked waitlist students (by shared order), then remaining people (unranked waitlist + drop-ins) alphabetically. Narrow Rank column (blank when none) left of name so names stay column-aligned.
- **Alternatives:** Merge all alpha (status quo — rejected); separate drop-in section (more sheet churn than needed).

### 9. Validation

- **Choice:** Accept only integers ≥ 1; reject non-integers and ≤ 0 with a clear error. No maximum.
- **UI:** Input sized for ~3 digits; larger values still allowed if typed.

### 10. API waitlist payload enrichment

- **Choice:** Include `waitlist_rank` (null if none) plus `last_name` / `first_name` (and existing display fields) on waitlist (and ideally students) in activity serializer so client sorts match backend.
- **Rationale:** Fixes existing ManageEnrollment sort gap where API waitlist lacked name parts.

## Risks / Trade-offs

- **[Concurrent rank edits]** Two users force-cascade overlapping ranks → Mitigation: transaction + unique constraint; loser gets integrity/conflict error and can retry.
- **[ManageEnrollment density on mobile]** Rank input per row → Mitigation: compact input, Enter to submit; columns stack below xl; keep checkbox/move UX unchanged.
- **[Sign-in sheet column width]** Extra Rank column → Mitigation: narrow column; names remain primary.
- **[Cascade surprises]** Yes bumps several people → Mitigation: modal names the current occupant; cascade is minimal contiguous run only.
- **[Admin edits]** Django admin can set status without UI → Mitigation: clear rank when status ≠ waiting in `save` or admin form if practical; document in tasks.

## Migration Plan

1. Add nullable `waitlist_rank` + uniqueness constraint for waiting/non-null.
2. Deploy backend (API + clear-on-leave + shared order) before or with frontend.
3. Frontend ships Rank UI and consumers of shared order.
4. Existing waitlists remain all-unranked (alphabetical after empty ranked set) — no data backfill.
5. Rollback: revert frontend first; nullable column can remain unused or be dropped in a follow-up migration.

## Open Questions

- None blocking; product decisions settled in explore. Field name `waitlist_rank` vs `rank` is an implementation detail (prefer `waitlist_rank` for clarity on Enrollment).
