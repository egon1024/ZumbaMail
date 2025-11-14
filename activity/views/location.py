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
        return Location.objects.select_related('organization').filter(organization__is_deleted=False)

class LocationDeleteView(DestroyAPIView):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [permissions.IsAuthenticated]
