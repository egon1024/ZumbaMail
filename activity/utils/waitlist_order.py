"""
Shared waitlist ordering and rank cascade helpers.

Order: ranked ascending, then unranked by last name then first name.
"""
from django.db import transaction
from django.db.models import Case, IntegerField, Value, When


class WaitlistRankConflict(Exception):
    """Raised when assigning a rank that is already in use and force is False."""

    def __init__(self, occupant):
        self.occupant = occupant
        student = occupant.student
        name = getattr(student, 'display_name', None) or f"{student.last_name}, {student.first_name}"
        super().__init__(f"Rank {occupant.waitlist_rank} is already used by {name}")
        self.occupant_name = name
        self.occupant_rank = occupant.waitlist_rank
        self.occupant_student_id = student.id


def waitlist_order_by():
    """
    Django order_by args for Enrollment querysets (status=waiting, select_related student).

    Ranked (non-null) first by ascending rank, then unranked by last/first name.
    """
    return (
        Case(
            When(waitlist_rank__isnull=True, then=Value(1)),
            default=Value(0),
            output_field=IntegerField(),
        ),
        'waitlist_rank',
        'student__last_name',
        'student__first_name',
    )


def ordered_waitlist_enrollments(activity):
    """Return waiting enrollments for activity in shared waitlist order."""
    return (
        activity.enrollments.filter(status='waiting')
        .select_related('student')
        .order_by(*waitlist_order_by())
    )


def enrollment_sort_key(enrollment):
    """Python sort key matching waitlist_order_by for Enrollment instances."""
    student = enrollment.student
    rank = enrollment.waitlist_rank
    return (
        rank is None,
        rank if rank is not None else 0,
        student.last_name or '',
        student.first_name or '',
    )


def student_payload_from_enrollment(enrollment):
    """Standard waitlist/student dict for API payloads."""
    student = enrollment.student
    return {
        'id': student.id,
        'full_name': getattr(student, 'full_name', None) or f"{student.first_name} {student.last_name}",
        'display_name': getattr(student, 'display_name', None) or f"{student.last_name}, {student.first_name}",
        'first_name': student.first_name,
        'last_name': student.last_name,
        'email': student.email,
        'waitlist_rank': enrollment.waitlist_rank,
    }


def set_waitlist_rank(enrollment, rank, force=False):
    """
    Set or clear waitlist_rank for a waiting enrollment inside a transaction.

    Args:
        enrollment: Enrollment with status='waiting'
        rank: int >= 1 to set, or None to clear
        force: if True, cascade contiguous occupied ranks to free `rank`

    Returns:
        Updated enrollment

    Raises:
        ValueError: invalid rank or enrollment not waiting
        WaitlistRankConflict: target occupied and force is False
    """
    if enrollment.status != 'waiting':
        raise ValueError('Only waiting enrollments can have a waitlist rank.')

    if rank is not None:
        if not isinstance(rank, int) or isinstance(rank, bool) or rank < 1:
            raise ValueError('Rank must be an integer greater than or equal to 1.')

    with transaction.atomic():
        # Lock waiting enrollments for this activity to serialize concurrent edits
        locked = list(
            enrollment.activity.enrollments.select_for_update()
            .filter(status='waiting')
            .select_related('student')
        )
        current = next((e for e in locked if e.pk == enrollment.pk), None)
        if current is None:
            raise ValueError('Enrollment is not on the waitlist.')

        if rank is None:
            current.waitlist_rank = None
            current.save(update_fields=['waitlist_rank'])
            return current

        # Vacate mover's old rank first so they do not bump themselves
        if current.waitlist_rank is not None:
            current.waitlist_rank = None
            current.save(update_fields=['waitlist_rank'])

        # Refresh occupancy map after vacating
        rank_map = {
            e.waitlist_rank: e
            for e in enrollment.activity.enrollments.filter(
                status='waiting', waitlist_rank__isnull=False
            ).exclude(pk=current.pk).select_related('student')
        }

        if rank in rank_map and not force:
            raise WaitlistRankConflict(rank_map[rank])

        if rank in rank_map and force:
            # Collect contiguous occupied run starting at target
            chain = []
            r = rank
            while r in rank_map:
                chain.append(rank_map[r])
                r += 1
            # Bump from the end of the chain so unique constraint is never violated
            for e in reversed(chain):
                e.waitlist_rank = e.waitlist_rank + 1
                e.save(update_fields=['waitlist_rank'])

        current.waitlist_rank = rank
        current.save(update_fields=['waitlist_rank'])
        return current
