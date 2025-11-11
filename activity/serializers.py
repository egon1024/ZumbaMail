from rest_framework import serializers
from .models import Organization, Contact
from .models import Student, Activity, Enrollment, Meeting, AttendanceRecord, ClassCancellation


class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = ['id', 'type', 'session', 'day_of_week', 'time', 'location', 'closed']

class StudentDetailSerializer(serializers.ModelSerializer):

    current_classes = serializers.SerializerMethodField()
    waitlist_classes = serializers.SerializerMethodField()
    display_name = serializers.CharField(read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'first_name', 'last_name', 'email', 'phone', 'rochester', 'active',
            'emergency_contact_name', 'emergency_contact_phone', 'facebook_profile', 'notes',
            'current_classes', 'waitlist_classes', 'display_name'
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
        fields = ['id', 'name', 'office_phone', 'cell_phone', 'email', 'role', 'organization', 'organization_name', 'organization_id']

class OrganizationSerializer(serializers.ModelSerializer):
    contacts = ContactSerializer(many=True, read_only=True)
    contact_count = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = ['id', 'name', 'contacts', 'contact_count']

    def get_contact_count(self, obj):
        return obj.contacts.count()

class ActivityListSerializer(serializers.ModelSerializer):
    students = serializers.SerializerMethodField()
    waitlist = serializers.SerializerMethodField()
    session_name = serializers.CharField(source='session.name', read_only=True)
    session_id = serializers.IntegerField(source='session.id', read_only=True)
    organization_name = serializers.CharField(source='session.organization.name', read_only=True)
    organization_id = serializers.IntegerField(source='session.organization.id', read_only=True)
    students_count = serializers.SerializerMethodField()
    waitlist_count = serializers.SerializerMethodField()

    class Meta:
        model = Activity
        fields = [
            'id', 'type', 'day_of_week', 'time', 'location', 'closed',
            'session_name', 'session_id', 'organization_name', 'organization_id',
            'students_count', 'waitlist_count',
            'students', 'waitlist',
        ]

    def get_students_count(self, obj):
        return obj.enrollments.filter(status='active').count()

    def get_waitlist_count(self, obj):
        return obj.enrollments.filter(status='waiting').count()

    def get_students(self, obj):
        students = obj.enrollments.filter(status='active').select_related('student')
        return [
            {
                'id': e.student.id,
                'full_name': getattr(e.student, 'full_name', None) or f"{e.student.first_name} {e.student.last_name}",
                'display_name': getattr(e.student, 'display_name', None) or f"{e.student.last_name}, {e.student.first_name}",
                'email': e.student.email,
            }
            for e in students
        ]

    def get_waitlist(self, obj):
        waitlist = obj.enrollments.filter(status='waiting').select_related('student')
        return [
            {
                'id': e.student.id,
                'full_name': getattr(e.student, 'full_name', None) or f"{e.student.first_name} {e.student.last_name}",
                'display_name': getattr(e.student, 'display_name', None) or f"{e.student.last_name}, {e.student.first_name}",
                'email': e.student.email,
            }
            for e in waitlist
        ]

class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.display_name', read_only=True)
    student_first_name = serializers.CharField(source='student.first_name', read_only=True)
    student_last_name = serializers.CharField(source='student.last_name', read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = ['id', 'student', 'student_name', 'student_first_name', 'student_last_name', 'status', 'note']

class MeetingSerializer(serializers.ModelSerializer):
    activity_type = serializers.CharField(source='activity.type', read_only=True)
    activity_time = serializers.TimeField(source='activity.time', read_only=True)
    activity_location = serializers.CharField(source='activity.location', read_only=True)
    session_name = serializers.CharField(source='activity.session.name', read_only=True)
    organization_name = serializers.CharField(source='activity.session.organization.name', read_only=True)
    attendance_records = AttendanceRecordSerializer(many=True, read_only=True)

    class Meta:
        model = Meeting
        fields = [
            'id', 'activity', 'date',
            'activity_type', 'activity_time', 'activity_location',
            'session_name', 'organization_name',
            'attendance_records'
        ]

class StudentBasicSerializer(serializers.ModelSerializer):
    """Lightweight serializer for student search and quick create"""
    class Meta:
        model = Student
        fields = ['id', 'first_name', 'last_name', 'email', 'display_name']
        read_only_fields = ['display_name']

class ClassCancellationSerializer(serializers.ModelSerializer):
    """Serializer for class cancellations"""
    activity_type = serializers.CharField(source='activity.type', read_only=True)
    activity_day = serializers.CharField(source='activity.day_of_week', read_only=True)
    activity_time = serializers.TimeField(source='activity.time', read_only=True)
    activity_location = serializers.CharField(source='activity.location', read_only=True)
    session_name = serializers.CharField(source='activity.session.name', read_only=True)
    organization_name = serializers.CharField(source='activity.session.organization.name', read_only=True)
    organization_id = serializers.IntegerField(source='activity.session.organization.id', read_only=True)

    class Meta:
        model = ClassCancellation
        fields = [
            'id', 'activity', 'date', 'reason', 'created_at',
            'activity_type', 'activity_day', 'activity_time', 'activity_location',
            'session_name', 'organization_name', 'organization_id'
        ]
        read_only_fields = ['created_at']
