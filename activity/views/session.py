from activity.models import Activity, Session
from rest_framework import permissions, serializers
from rest_framework.generics import ListAPIView, RetrieveAPIView, UpdateAPIView

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
            class Meta:
                model = Session
                fields = ['id', 'name', 'start_date', 'end_date', 'closed', 'organization', 'organization_name']
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
