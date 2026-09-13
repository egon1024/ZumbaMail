from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from rest_framework.permissions import IsAuthenticated

from activity.models import Activity, Enrollment
from activity.serializers import ActivityListSerializer, ActivitySerializer
from activity.utils.waitlist_order import (
    WaitlistRankConflict,
    set_waitlist_rank,
    student_payload_from_enrollment,
)

_RANK_ERROR = "Rank must be an integer greater than or equal to 1."


def _parse_waitlist_rank(raw_rank):
    """Parse rank from request data. None/empty clears; otherwise int >= 1."""
    if raw_rank is None:
        return None
    if isinstance(raw_rank, bool):
        raise ValueError(_RANK_ERROR)
    if isinstance(raw_rank, str):
        raw_rank = raw_rank.strip()
        if raw_rank == '':
            return None
        if not raw_rank.isdigit() or int(raw_rank) < 1:
            raise ValueError(_RANK_ERROR)
        return int(raw_rank)
    if isinstance(raw_rank, float):
        if not raw_rank.is_integer():
            raise ValueError(_RANK_ERROR)
        rank = int(raw_rank)
    elif isinstance(raw_rank, int):
        rank = raw_rank
    else:
        raise ValueError(_RANK_ERROR)
    if rank < 1:
        raise ValueError(_RANK_ERROR)
    return rank


class ActivityEnrollmentUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        """
        Accepts JSON: {"enrolled": [student_id, ...], "waitlist": [student_id, ...]}
        Updates enrollments for the given activity.
        Clears waitlist_rank when a student becomes active; delete removes waitlist rows.
        """
        try:
            activity = Activity.objects.get(pk=pk)
        except Activity.DoesNotExist:
            return Response({"detail": "Activity not found."}, status=status.HTTP_404_NOT_FOUND)

        enrolled_ids = set(request.data.get("enrolled", []))
        waitlist_ids = set(request.data.get("waitlist", []))

        # Remove all enrollments for this activity not in either list
        Enrollment.objects.filter(activity=activity).exclude(student_id__in=enrolled_ids | waitlist_ids).delete()

        # Set or create enrollments for enrolled students (clear any prior waitlist rank)
        for sid in enrolled_ids:
            Enrollment.objects.update_or_create(
                activity=activity, student_id=sid,
                defaults={"status": "active", "waitlist_rank": None},
            )

        # Set or create enrollments for waitlist students (preserve existing rank when staying waiting)
        for sid in waitlist_ids:
            Enrollment.objects.update_or_create(
                activity=activity, student_id=sid,
                defaults={"status": "waiting"},
            )

        return Response({"success": True})


class ActivityWaitlistRankView(APIView):
    """
    Set or clear waitlist rank for one student on an activity.

    POST body: { "student_id": int, "rank": int|null, "force": bool (optional) }
    Empty/null rank clears. Without force, occupied rank returns 409.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            activity = Activity.objects.get(pk=pk)
        except Activity.DoesNotExist:
            return Response({"detail": "Activity not found."}, status=status.HTTP_404_NOT_FOUND)

        student_id = request.data.get("student_id")
        if student_id is None:
            return Response({"detail": "student_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        raw_rank = request.data.get("rank", None)
        force = bool(request.data.get("force", False))

        try:
            rank = _parse_waitlist_rank(raw_rank)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        try:
            enrollment = Enrollment.objects.select_related('student').get(
                activity=activity, student_id=student_id, status='waiting'
            )
        except Enrollment.DoesNotExist:
            return Response(
                {"detail": "Student is not on the waitlist for this class."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            updated = set_waitlist_rank(enrollment, rank, force=force)
        except WaitlistRankConflict as conflict:
            return Response(
                {
                    "detail": str(conflict),
                    "conflict": True,
                    "occupant_name": conflict.occupant_name,
                    "occupant_student_id": conflict.occupant_student_id,
                    "rank": conflict.occupant_rank,
                },
                status=status.HTTP_409_CONFLICT,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "success": True,
            "student": student_payload_from_enrollment(updated),
        })


class ActivityListView(generics.ListAPIView):
    serializer_class = ActivityListSerializer

    def get_queryset(self):
        include_inactive = self.request.query_params.get('include_inactive') == 'true'
        if include_inactive:
            return Activity.objects.all()
        return Activity.objects.filter(session__closed=False, closed=False)


class ActivityCreateView(generics.CreateAPIView):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer
    permission_classes = [permissions.IsAuthenticated]


class ActivityUpdateView(generics.RetrieveUpdateAPIView):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer
    permission_classes = [permissions.IsAuthenticated]


class ActivityDetailView(generics.RetrieveAPIView):
    queryset = Activity.objects.all()
    serializer_class = ActivityListSerializer


class ActivityTypeChoicesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        choices = [
            {"value": value, "label": label}
            for value, label in Activity.TYPE_CHOICES
        ]
        choices.sort(key=lambda c: c["label"].lower())
        return Response({"choices": choices})


class ActivityLocationChoicesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        locations = Activity.objects.values_list('location', flat=True).distinct()
        # Remove blanks and sort
        locations = sorted(set([loc for loc in locations if loc and loc.strip()]))
        return Response({"locations": locations})
