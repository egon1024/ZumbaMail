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
            'emergency_contact_name', 'emergency_contact_phone', 'facebook_profile', 'notes',
            'current_classes', 'waitlist_classes'
        ]

    def get_current_classes(self, obj):
        include_closed = self.context.get('include_closed', False)
        enrollments = obj.enrollments.filter(status='active')
        activities = [e.activity for e in enrollments if include_closed or not e.activity.closed]
        return ActivitySerializer(activities, many=True).data

    def get_waitlist_classes(self, obj):
        include_closed = self.context.get('include_closed', False)
        enrollments = obj.enrollments.filter(status='waiting')
        activities = [e.activity for e in enrollments if include_closed or not e.activity.closed]
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

class ActivityListSerializer(serializers.ModelSerializer):
    session_name = serializers.CharField(source='session.name', read_only=True)
    session_id = serializers.IntegerField(source='session.id', read_only=True)
    organization_name = serializers.CharField(source='session.organization.name', read_only=True)
    organization_id = serializers.IntegerField(source='session.organization.id', read_only=True)
    students_count = serializers.SerializerMethodField()
    waitlist_count = serializers.SerializerMethodField()

    class Meta:
        model = Activity
        fields = ['id', 'type', 'day_of_week', 'time', 'location', 'session_name', 'session_id', 'organization_name', 'organization_id', 'students_count', 'waitlist_count']

    def get_students_count(self, obj):
        return obj.enrollments.filter(status='active').count()

    def get_waitlist_count(self, obj):
        return obj.enrollments.filter(status='waiting').count()
