from rest_framework.generics import CreateAPIView, RetrieveUpdateAPIView, ListAPIView, DestroyAPIView
from rest_framework import permissions
from activity.models import Contact
from activity.serializers import ContactSerializer

class ContactCreateView(CreateAPIView):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    permission_classes = [permissions.IsAuthenticated]

class ContactDetailView(RetrieveUpdateAPIView):
    queryset = Contact.objects.select_related('organization').all()
    serializer_class = ContactSerializer
    permission_classes = [permissions.IsAuthenticated]

class ContactListView(ListAPIView):
    serializer_class = ContactSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        queryset = Contact.objects.select_related('organization').filter(organization__is_deleted=False)
        organization_id = self.request.query_params.get('organization')
        if organization_id:
            queryset = queryset.filter(organization_id=organization_id)
        return queryset

class ContactDeleteView(DestroyAPIView):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    permission_classes = [permissions.IsAuthenticated]
