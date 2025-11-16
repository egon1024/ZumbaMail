from rest_framework import serializers
from .models import Organization, Contact, Location
from .models import Student, Activity, Enrollment, Meeting, AttendanceRecord, ClassCancellation


class ActivitySerializer(serializers.ModelSerializer):
    attendance_stats = serializers.SerializerMethodField()
    session_name = serializers.CharField(source='session.name', read_only=True)

    class Meta:
        model = Activity
        fields = ['id', 'type', 'session', 'session_name', 'day_of_week', 'time', 'location', 'closed', 'attendance_stats']

    def get_attendance_stats(self, obj):
        # Get student_id from context if available (for student detail view)
        student_id = self.context.get('student_id')
        if not student_id:
            return None

        # Count attendance records for this student in this activity
        meetings = Meeting.objects.filter(activity=obj)
        attendance_records = AttendanceRecord.objects.filter(
            meeting__in=meetings,
            student_id=student_id
        )

        present_count = attendance_records.filter(status='present').count()
        unexpected_absent_count = attendance_records.filter(status='unexpected_absence').count()
        expected_absent_count = attendance_records.filter(status='expected_absence').count()

        return {
            'present': present_count,
            'unexpected_absent': unexpected_absent_count,
            'expected_absent': expected_absent_count
        }

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
        # Pass student_id in context for attendance stats
        return ActivitySerializer(activities, many=True, context={'student_id': obj.id}).data

    def get_waitlist_classes(self, obj):
        include_closed = self.context.get('include_closed', False)
        enrollments = obj.enrollments.filter(status='waiting')
        activities = [e.activity for e in enrollments if include_closed or not e.activity.closed]
        # Pass student_id in context for attendance stats
        return ActivitySerializer(activities, many=True, context={'student_id': obj.id}).data

class ContactSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    organization_id = serializers.IntegerField(source='organization.id', read_only=True)
    class Meta:
        model = Contact
        fields = ['id', 'name', 'office_phone', 'cell_phone', 'email', 'role', 'organization', 'organization_name', 'organization_id']

class LocationSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    organization_id = serializers.IntegerField(source='organization.id', read_only=True)

    class Meta:
        model = Location
        fields = ['id', 'name', 'address', 'description', 'organization', 'organization_name', 'organization_id']

class OrganizationSerializer(serializers.ModelSerializer):
    contacts = ContactSerializer(many=True, read_only=True)
    contact_count = serializers.SerializerMethodField()
    num_locations = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = ['id', 'name', 'contacts', 'contact_count', 'num_locations']

    def get_contact_count(self, obj):
        return obj.contacts.count()

    def get_num_locations(self, obj):
        return obj.locations.count()

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
