from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from activity.models import Enrollment, Student
from rest_framework.permissions import IsAuthenticated

# Custom API endpoint for updating enrollments and waitlist
class ActivityEnrollmentUpdateView(APIView):
    def post(self, request, pk):
        """
        Accepts JSON: {"enrolled": [student_id, ...], "waitlist": [student_id, ...]}
        Updates enrollments for the given activity.
        """
        try:
            activity = Activity.objects.get(pk=pk)
        except Activity.DoesNotExist:
            return Response({"detail": "Activity not found."}, status=status.HTTP_404_NOT_FOUND)

        enrolled_ids = set(request.data.get("enrolled", []))
        waitlist_ids = set(request.data.get("waitlist", []))

        # Remove all enrollments for this activity not in either list
        Enrollment.objects.filter(activity=activity).exclude(student_id__in=enrolled_ids | waitlist_ids).delete()

        # Set or create enrollments for enrolled students
        for sid in enrolled_ids:
            Enrollment.objects.update_or_create(
                activity=activity, student_id=sid,
                defaults={"status": "active"}
            )

        # Set or create enrollments for waitlist students
        for sid in waitlist_ids:
            Enrollment.objects.update_or_create(
                activity=activity, student_id=sid,
                defaults={"status": "waiting"}
            )

        return Response({"success": True})

from rest_framework import generics
from activity.models import Activity
from activity.serializers import ActivityListSerializer, ActivitySerializer

class ActivityListView(generics.ListAPIView):
    serializer_class = ActivityListSerializer

    def get_queryset(self):
        include_inactive = self.request.query_params.get('include_inactive') == 'true'
        if include_inactive:
            return Activity.objects.all()
        return Activity.objects.filter(session__closed=False, closed=False)

# Create view for Activity
from rest_framework import permissions
class ActivityCreateView(generics.CreateAPIView):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer
    permission_classes = [permissions.IsAuthenticated]

# Update view for Activity
from rest_framework import permissions
class ActivityUpdateView(generics.RetrieveUpdateAPIView):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer
    permission_classes = [permissions.IsAuthenticated]

# Detail view for Activity
class ActivityDetailView(generics.RetrieveAPIView):
    queryset = Activity.objects.all()
    serializer_class = ActivityListSerializer

class ActivityTypeChoicesView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        from activity.models import Activity
        choices = [
            {"value": value, "label": label}
            for value, label in Activity.TYPE_CHOICES
        ]
        choices.sort(key=lambda c: c["label"].lower())
        return Response({"choices": choices})

class ActivityLocationChoicesView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        from activity.models import Activity
        locations = Activity.objects.values_list('location', flat=True).distinct()
        # Remove blanks and sort
        locations = sorted(set([loc for loc in locations if loc and loc.strip()]))
        return Response({"locations": locations})
