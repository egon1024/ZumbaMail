from activity.models import Activity, Session
from rest_framework import permissions, serializers
from rest_framework.generics import ListAPIView, RetrieveAPIView
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
            class Meta:
                model = Activity
                fields = ['id', 'type', 'day_of_week', 'time', 'location']
        class SessionSerializer(serializers.ModelSerializer):
            class Meta:
                model = session.__class__
                fields = ['id', 'name', 'start_date', 'end_date', 'closed']
        return Response({
            'session': SessionSerializer(session).data,
            'organization': OrgSerializer(organization).data,
            'classes': ClassSerializer(classes, many=True).data
        })
