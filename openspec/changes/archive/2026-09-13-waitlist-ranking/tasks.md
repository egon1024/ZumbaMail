## 1. Data model

- [x] 1.1 Add nullable `waitlist_rank` field on `Enrollment` (integer ≥ 1 when set)
- [x] 1.2 Add partial uniqueness for non-null `waitlist_rank` among waiting enrollments per activity
- [x] 1.3 Create and verify migration; ensure existing rows remain null (unranked)

## 2. Shared backend ordering and cascade

- [x] 2.1 Add backend waitlist order helper (ranked ascending, then unranked by last/first name)
- [x] 2.2 Implement set/clear rank + contiguous cascade logic in a transaction (vacate mover’s old rank first)
- [x] 2.3 Clear `waitlist_rank` when enrollment leaves waiting (active update or delete) in `ActivityEnrollmentUpdateView`
- [x] 2.4 Optionally clear rank on model/admin save when status is not `waiting`

## 3. API

- [x] 3.1 Enrich activity waitlist (and students if needed) payloads with `waitlist_rank`, `last_name`, `first_name`; return waitlist in shared order
- [x] 3.2 Add dedicated waitlist-rank endpoint (set/clear, validation ≥ 1 integer, conflict without force, cascade with force)
- [x] 3.3 Wire route; use shared order helper in attendance meeting waitlist payload

## 4. Sign-in sheets

- [x] 4.1 Order waitlist/drop-ins section as ranked waitlist then alphabetical unranked waitlist + drop-ins (Option B)
- [x] 4.2 Add narrow Rank column beside names; blank when unranked/drop-in; keep name column aligned

## 5. Frontend shared helpers

- [x] 5.1 Add frontend waitlist sort helper matching backend order
- [x] 5.2 Add reusable rank + name display pattern (aligned rank, names unshifted)

## 6. Enrollment page UI

- [x] 6.1 Add per-waitlist-row rank input (empty when unranked); Enter submits that row only (no Rank button); align names and inputs; wrap names / stack columns on narrow viewports
- [x] 6.2 Call rank API for set/clear; handle validation errors
- [x] 6.3 Add Apply anyway? modal (**Yes** then **No**); No aborts; Yes retries with force and refreshes local waitlist order
- [x] 6.4 Sort waitlist via shared helper; ensure moves to enrolled/remove still auto-save and ranks clear via backend

## 7. Other UI surfaces

- [x] 7.1 Update `ClassDetail` waitlist to shared order + aligned rank display
- [x] 7.2 Update `UpdateAttendance` waitlist section to shared order + aligned rank display
- [x] 7.3 Update `AttendanceDetail` waitlist section to shared order + aligned rank display

## 8. Verification

- [x] 8.1 Manually verify cascade examples (insert at 1 with gap at 10; move existing ranked student; clear rank; free-rank move)
- [x] 8.2 Manually verify enrollment, class detail, attendance update/detail, and sign-in sheet order/rank column consistency
- [x] 8.3 Run `make test-syntax` (or backend/frontend syntax targets) and fix any issues
