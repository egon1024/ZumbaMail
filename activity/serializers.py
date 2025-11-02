from rest_framework import serializers
from .models import Organization, Contact
from .models import Student, Activity, Enrollment


class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = ['id', 'type', 'day_of_week', 'time', 'location']

class StudentDetailSerializer(serializers.ModelSerializer):
    current_classes = serializers.SerializerMethodField()
    waitlist_classes = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            'id', 'first_name', 'last_name', 'email', 'phone', 'rochester', 'active',
            'current_classes', 'waitlist_classes'
        ]

    def get_current_classes(self, obj):
        enrollments = obj.enrollments.filter(status='active')
        activities = [e.activity for e in enrollments]
        return ActivitySerializer(activities, many=True).data

    def get_waitlist_classes(self, obj):
        enrollments = obj.enrollments.filter(status='waiting')
        activities = [e.activity for e in enrollments]
        return ActivitySerializer(activities, many=True).data

class ContactSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    organization_id = serializers.IntegerField(source='organization.id', read_only=True)
    class Meta:
        model = Contact
        fields = ['id', 'name', 'phone', 'email', 'role', 'organization', 'organization_name', 'organization_id']

class OrganizationSerializer(serializers.ModelSerializer):
    contacts = ContactSerializer(many=True, read_only=True)
    contact_count = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = ['id', 'name', 'contacts', 'contact_count']

    def get_contact_count(self, obj):
        return obj.contacts.count()
