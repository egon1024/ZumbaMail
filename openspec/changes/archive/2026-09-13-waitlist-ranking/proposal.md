## Why

Alyssa sometimes needs a deliberate waitlist order for a class (who gets the next open spot), not only alphabetical listing. Today waitlists are unordered sets that every screen re-sorts by name inconsistently, so priority cannot be expressed or shared across enrollment, class detail, attendance, and sign-in sheets.

## What Changes

- Add an optional numeric waitlist rank on each student’s enrollment in a given class (independent per class).
- Ranked waitlist members display before unranked ones; ranked by ascending rank (1 = first); unranked alphabetically after all ranked.
- Rank is optional; empty/null means unranked. Ranks are integers ≥ 1 (no zero/negatives); gaps are allowed; no upper cap and no “compact ranks” feature.
- Enrollment page (`/classes/<id>/enrollment`) gains per-waitlisted-student rank input with Enter-to-submit for that row only (no Rank button).
- Conflict when assigning an in-use rank: modal “Apply anyway?” with **Yes** then **No**; Yes cascades only the contiguous occupied run needed to free the target rank.
- Rank clears when a student leaves waitlist status (enrolled or removed from the class); not persisted afterward.
- Shared waitlist ordering used on enrollment, class detail, sign-in sheets, and attendance update/detail waitlist sections; class detail and sign-in sheet show rank (when present) in an aligned column that does not shift names.
- Sign-in sheet waitlist section: ranked waitlist first, then unranked waitlist + drop-ins alphabetically; narrow Rank column beside names.

## Capabilities

### New Capabilities

- `waitlist-ranking`: Optional per-enrollment waitlist rank, cascade-on-conflict rules, validation, shared waitlist ordering, and display/edit behavior across enrollment, class detail, attendance, and sign-in sheets.

### Modified Capabilities

- (none — no existing main specs)

## Impact

- **Model:** `Enrollment` gains nullable rank field; partial uniqueness for waiting + non-null rank per activity; migration.
- **API:** Waitlist payloads include rank and name fields needed for sorting; dedicated per-student set/clear rank endpoint with conflict + force/cascade; enrollment update clears rank when leaving `waiting`.
- **Backend utils:** Shared waitlist order helper used by serializers, attendance meeting payload, and Google Sheets sign-in generation.
- **Frontend:** `ManageEnrollment` rank UI + conflict modal; shared sort/display helper; `ClassDetail`, `UpdateAttendance`, `AttendanceDetail`, and sign-in sheet generation updated for order and optional rank column.
- **No new external dependencies.**
