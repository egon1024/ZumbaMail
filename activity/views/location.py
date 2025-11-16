from rest_framework.generics import CreateAPIView, RetrieveUpdateAPIView, ListAPIView, DestroyAPIView
from rest_framework import permissions
from activity.models import Location
from activity.serializers import LocationSerializer

class LocationCreateView(CreateAPIView):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [permissions.IsAuthenticated]

class LocationDetailView(RetrieveUpdateAPIView):
    queryset = Location.objects.select_related('organization').all()
    serializer_class = LocationSerializer
    permission_classes = [permissions.IsAuthenticated]

class LocationListView(ListAPIView):
    serializer_class = LocationSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        queryset = Location.objects.select_related('organization').filter(organization__is_deleted=False)
        organization_id = self.request.query_params.get('organization')
        if organization_id:
            queryset = queryset.filter(organization_id=organization_id)
        return queryset

class LocationDeleteView(DestroyAPIView):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [permissions.IsAuthenticated]
