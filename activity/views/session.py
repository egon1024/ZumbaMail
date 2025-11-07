from activity.models import Activity, Session
from rest_framework import permissions, serializers
from rest_framework.generics import ListAPIView, RetrieveAPIView, UpdateAPIView, CreateAPIView, GenericAPIView
from rest_framework import status
from rest_framework.views import APIView
# Create session
class SessionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ['id', 'name', 'start_date', 'end_date', 'closed', 'organization']

class SessionCreateView(CreateAPIView):
    queryset = Session.objects.all()
    serializer_class = SessionCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

# Copy activities from another session
class SessionCopyActivitiesView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request, pk):
        from_session_id = request.data.get('from_session_id')
        try:
            target_session = Session.objects.get(pk=pk)
            source_session = Session.objects.get(pk=from_session_id)
        except Session.DoesNotExist:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)
        copied = 0
        for activity in source_session.activities.all():
            # Copy all fields except PK and session
            new_activity = Activity.objects.create(
                type=activity.type,
                day_of_week=activity.day_of_week,
                time=activity.time,
                location=activity.location,
                session=target_session,
                closed=False
            )
            copied += 1
        return Response({'copied': copied}, status=status.HTTP_201_CREATED)

# Serializer for update (shared with list/detail for now)
from rest_framework import serializers
from activity.models import Session

class SessionUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ['id', 'name', 'start_date', 'end_date', 'closed', 'organization']

class SessionUpdateView(UpdateAPIView):
    queryset = Session.objects.all()
    serializer_class = SessionUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
from rest_framework.response import Response

class SessionListView(ListAPIView):
    queryset = Session.objects.select_related('organization').all()
    permission_classes = [permissions.IsAuthenticated]
    def get_serializer_class(self):
        class SessionSerializer(serializers.ModelSerializer):
            organization_name = serializers.CharField(source='organization.name', read_only=True)
            activity_count = serializers.SerializerMethodField()

            class Meta:
                model = Session
                fields = ['id', 'name', 'start_date', 'end_date', 'closed', 'organization', 'organization_name', 'activity_count']

            def get_activity_count(self, obj):
                return obj.activities.count()
        return SessionSerializer

class SessionDetailView(RetrieveAPIView):
    queryset = Session.objects.select_related('organization').all()
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        session = self.get_object()
        organization = session.organization
        classes = Activity.objects.filter(session=session)
        # Serializers
        class OrgSerializer(serializers.ModelSerializer):
            class Meta:
                model = organization.__class__
                fields = ['id', 'name', 'is_deleted']
        class ClassSerializer(serializers.ModelSerializer):
            num_students = serializers.SerializerMethodField()
            num_waitlist = serializers.SerializerMethodField()
            class Meta:
                model = Activity
                fields = ['id', 'type', 'day_of_week', 'time', 'location', 'num_students', 'num_waitlist']

            def get_num_students(self, obj):
                return obj.enrollments.filter(status='active').count()

            def get_num_waitlist(self, obj):
                return obj.enrollments.filter(status='waiting').count()
        class SessionSerializer(serializers.ModelSerializer):
            class Meta:
                model = session.__class__
                fields = ['id', 'name', 'start_date', 'end_date', 'closed']
        return Response({
            'session': SessionSerializer(session).data,
            'organization': OrgSerializer(organization).data,
            'classes': ClassSerializer(classes, many=True).data
        })
