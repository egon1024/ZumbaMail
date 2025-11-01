from django.shortcuts import render
from rest_framework import generics, permissions
from .models import Organization, Contact
from .serializers import OrganizationSerializer, ContactSerializer

# Create your views here.

class OrganizationListView(generics.ListAPIView):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]

class ContactListView(generics.ListAPIView):
    queryset = Contact.objects.select_related('organization').all()
    serializer_class = ContactSerializer
    permission_classes = [permissions.IsAuthenticated]
