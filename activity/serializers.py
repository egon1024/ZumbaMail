from rest_framework import serializers
from .models import Organization, Contact


class ContactSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    class Meta:
        model = Contact
        fields = ['id', 'name', 'phone', 'email', 'role', 'organization_name']

class OrganizationSerializer(serializers.ModelSerializer):
    contacts = ContactSerializer(many=True, read_only=True)
    contact_count = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = ['id', 'name', 'contacts', 'contact_count']

    def get_contact_count(self, obj):
        return obj.contacts.count()
