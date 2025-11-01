from rest_framework.generics import CreateAPIView, RetrieveUpdateAPIView, ListAPIView
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
        return Contact.objects.select_related('organization').filter(organization__is_deleted=False)
