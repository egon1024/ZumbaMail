## Purpose

Optional per-enrollment waitlist rank for a class, with shared ordering, set/clear from enrollment, conflict cascade, and consistent display across enrollment, class detail, attendance, and sign-in sheets.

## Requirements

### Requirement: Optional per-class waitlist rank

The system SHALL store an optional integer waitlist rank on each enrollment that is independent per activity. A missing rank SHALL mean the student is unranked for that class. Rank values SHALL be integers greater than or equal to 1. The system MUST reject non-integer and less-than-or-equal-to-zero rank values. Gaps between ranks SHALL be allowed. Rank SHALL apply only while the enrollment status is waiting.

#### Scenario: Rank is per class

- **WHEN** the same student is waitlisted in two different classes
- **THEN** each enrollment MAY have a different rank (or one ranked and one unranked) independently

#### Scenario: Reject invalid ranks

- **WHEN** a client attempts to set a waitlist rank that is not an integer or is less than or equal to zero
- **THEN** the system MUST reject the update and MUST NOT change any enrollment ranks

#### Scenario: Unranked by default

- **WHEN** a student is added to a class waitlist without a rank
- **THEN** that enrollment’s rank SHALL be empty/null

### Requirement: Waitlist display ordering

Wherever waitlisted students for a class are listed for instructor use, the system SHALL order them as: all ranked students by ascending rank, then all unranked students alphabetically by last name then first name. Shared ordering logic SHALL be used so enrollment, class detail, attendance, and sign-in sheet waitlists stay consistent.

#### Scenario: Mixed ranked and unranked

- **WHEN** a class waitlist has students ranked 1, 2, and 5 and two unranked students
- **THEN** display order SHALL be rank 1, rank 2, rank 5, then the two unranked students in alphabetical order

#### Scenario: All unranked

- **WHEN** no waitlisted student has a rank
- **THEN** the waitlist SHALL display in alphabetical order by last name then first name

### Requirement: Set and clear rank from enrollment page

On the class enrollment page waitlist, the system SHALL provide for each waitlisted student a rank input (empty when unranked, wide enough for at least three digits) after the name, with names left-aligned and inputs vertically aligned. Pressing Enter in that student’s input SHALL submit only that student’s rank. There SHALL NOT be a separate Rank button. Submitting an empty input SHALL clear that student’s rank without changing other students’ ranks. Student names SHALL remain fully readable (wrap rather than truncate with ellipsis); the three enrollment columns SHALL stack on narrower viewports the same way they do on a phone.

#### Scenario: Set a free rank

- **WHEN** the instructor enters an unused valid rank for a waitlisted student and presses Enter
- **THEN** only that student’s rank SHALL be updated and the waitlist SHALL re-order accordingly

#### Scenario: Clear a rank

- **WHEN** the instructor clears the rank input for a ranked waitlisted student and presses Enter
- **THEN** that student’s rank SHALL become empty and other students’ ranks SHALL be unchanged (gaps remain)

### Requirement: Conflict modal and cascade

When setting a student’s rank to a value already used by another waitlisted student in the same class, the system SHALL show a modal stating that the rank is already in use and by whom, with label **Apply anyway?** and buttons **Yes** then **No**. Choosing **No** SHALL dismiss the modal and MUST NOT apply the update. Choosing **Yes** SHALL assign the requested rank to the student and increment ranks only along the contiguous occupied run required for uniqueness (leaving non-contiguous higher ranks unchanged). If the student already had a different rank, that prior rank SHALL be vacated before cascade so the student does not bump themselves.

#### Scenario: Decline conflict

- **WHEN** the instructor assigns an in-use rank and chooses No on the Apply anyway modal
- **THEN** no ranks SHALL change

#### Scenario: Cascade only contiguous occupied ranks

- **WHEN** waitlist ranks are A:1, B:2, C:3, D:10 and the instructor force-assigns E to rank 1
- **THEN** resulting ranks SHALL be E:1, A:2, B:3, C:4, D:10

#### Scenario: Move existing ranked student into occupied rank

- **WHEN** waitlist ranks are Ana:1, Bo:2, Cam:3, Dee:10 and the instructor force-assigns Bo to rank 1
- **THEN** resulting ranks SHALL be Bo:1, Ana:2, Cam:3, Dee:10

### Requirement: Rank cleared when leaving waitlist

When a waitlisted student becomes enrolled (active) or is removed from the class (neither enrolled nor waitlisted), the system SHALL clear their waitlist rank. The rank MUST NOT remain associated with that enrollment after leaving waiting status.

#### Scenario: Enroll from waitlist

- **WHEN** a ranked waitlisted student is moved to enrolled
- **THEN** that enrollment SHALL have no waitlist rank

#### Scenario: Remove from waitlist

- **WHEN** a ranked waitlisted student is removed from the class
- **THEN** no enrollment row with that rank SHALL remain for that student in that class

### Requirement: Show rank on class detail and attendance

The class detail enrollment waitlist and the attendance update and attendance detail waitlist sections SHALL use shared waitlist ordering and SHALL show each student’s rank when present. Rank display SHALL be aligned so names remain vertically aligned and do not shift when some rows lack a rank.

#### Scenario: Class detail waitlist shows ranks

- **WHEN** the instructor views `/classes/<id>` and the waitlist has ranked and unranked students
- **THEN** students SHALL appear in shared waitlist order with ranks shown for ranked students only, names aligned

#### Scenario: Attendance waitlist uses same order

- **WHEN** the instructor views waitlist students on attendance update or attendance detail for a class
- **THEN** those students SHALL appear in the same shared waitlist order, with ranks shown when present and names aligned

### Requirement: Sign-in sheet waitlist ranking

Generated sign-in sheets SHALL list the waitlist/drop-ins section as: ranked waitlist students in ascending rank order, then all remaining people in that section (unranked waitlist students and drop-ins) alphabetically by last name then first name. The sheet SHALL include a narrow Rank column beside the name column; unranked and drop-in rows SHALL leave Rank blank so names stay aligned.

#### Scenario: Sign-in sheet Option B order

- **WHEN** a sign-in sheet is generated for a class with ranked waitlist students, unranked waitlist students, and drop-ins
- **THEN** ranked waitlist students SHALL appear first by rank, followed by unranked waitlist and drop-ins in alphabetical order, each with Rank blank when unranked
