from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from django.db.models import Q
from activity.models import Activity, Meeting, AttendanceRecord, Student, ClassCancellation
from activity.serializers import MeetingSerializer, StudentBasicSerializer


class MeetingGetOrCreateView(APIView):
    """
    Get or create a meeting for a specific activity and date.
    Auto-populates attendance records with enrolled students if creating new meeting.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        activity_id = request.data.get('activity_id')
        date = request.data.get('date')

        if not activity_id or not date:
            return Response(
                {"error": "activity_id and date are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        activity = get_object_or_404(Activity, pk=activity_id)

        # Get or create the meeting
        meeting, created = Meeting.objects.get_or_create(
            activity=activity,
            date=date
        )

        if created:
            # Auto-populate with enrolled students (status='active')
            active_enrollments = activity.enrollments.filter(status='active').select_related('student')
            for enrollment in active_enrollments:
                AttendanceRecord.objects.create(
                    student=enrollment.student,
                    meeting=meeting,
                    status='scheduled'
                )

        # Return meeting with full details and attendance records
        serializer = MeetingSerializer(meeting)

        # Also include enrolled and waitlist students for the UI
        enrolled_students = activity.enrollments.filter(status='active').select_related('student')
        waitlist_students = activity.enrollments.filter(status='waiting').select_related('student')

        response_data = serializer.data
        response_data['enrolled_students'] = [
            {
                'id': e.student.id,
                'display_name': e.student.display_name,
                'email': e.student.email,
            }
            for e in enrolled_students
        ]
        response_data['waitlist_students'] = [
            {
                'id': e.student.id,
                'display_name': e.student.display_name,
                'email': e.student.email,
            }
            for e in waitlist_students
        ]

        return Response(response_data)


class AttendanceUpdateView(APIView):
    """
    Update attendance records for a specific meeting.
    Accepts list of {student_id, status, note} objects.
    Creates or updates attendance records as needed.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, meeting_id):
        meeting = get_object_or_404(Meeting, pk=meeting_id)
        attendance_data = request.data.get('attendance', [])

        if not isinstance(attendance_data, list):
            return Response(
                {"error": "attendance must be a list"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update or create attendance records
        for record in attendance_data:
            student_id = record.get('student_id')
            record_status = record.get('status')
            note = record.get('note', '')

            if not student_id or not record_status:
                continue  # Skip invalid records

            AttendanceRecord.objects.update_or_create(
                meeting=meeting,
                student_id=student_id,
                defaults={
                    'status': record_status,
                    'note': note
                }
            )

        return Response({"success": True, "message": "Attendance updated successfully"})


class StudentSearchView(APIView):
    """
    Search for students by name or email.
    Used for adding walk-in students to attendance.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '').strip()

        if len(query) < 2:
            return Response(
                {"error": "Search query must be at least 2 characters"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Search by first name, last name, or email
        students = Student.objects.filter(
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(email__icontains=query)
        ).order_by('last_name', 'first_name')[:20]  # Limit to 20 results

        serializer = StudentBasicSerializer(students, many=True)
        return Response(serializer.data)


class StudentQuickCreateView(APIView):
    """
    Quickly create a new student with minimal information.
    Used for walk-in students during attendance.
    Additional details can be filled in later.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = StudentBasicSerializer(data=request.data)

        if serializer.is_valid():
            student = serializer.save()
            return Response(
                StudentBasicSerializer(student).data,
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AttendanceStatsView(APIView):
    """
    Get attendance statistics for activities on a specific date.
    Returns list of activities with enrollment counts and attendance stats.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        date = request.query_params.get('date')
        organization_id = request.query_params.get('organization_id')

        if not date:
            return Response(
                {"error": "date parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Parse the date and get the day of week
        from datetime import datetime
        date_obj = datetime.strptime(date, '%Y-%m-%d').date()
        day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        day_of_week = day_names[date_obj.weekday()]

        # Get activities, filtered by day of week and session date range
        activities = Activity.objects.select_related('session__organization').prefetch_related('enrollments', 'meetings')
        activities = activities.filter(
            day_of_week=day_of_week,
            session__start_date__lte=date_obj,
            session__end_date__gte=date_obj
        )

        if organization_id:
            activities = activities.filter(session__organization_id=organization_id)

        # Get all cancellations for this date (more efficient than checking per activity)
        cancellations = ClassCancellation.objects.filter(date=date).values_list('activity_id', 'reason')
        cancellation_dict = dict(cancellations)

        results = []
        for activity in activities:
            # Check if this activity is cancelled
            is_cancelled = activity.id in cancellation_dict
            cancellation_reason = cancellation_dict.get(activity.id, None)

            # Get meeting for this activity and date (if it exists)
            meeting = activity.meetings.filter(date=date).first()

            # Count enrollments
            enrolled_count = activity.enrollments.filter(status='active').count()
            waitlist_count = activity.enrollments.filter(status='waiting').count()

            # Count attendance if meeting exists
            stats = {
                'id': activity.id,
                'type': activity.type,
                'day_of_week': activity.day_of_week,
                'time': activity.time.strftime('%H:%M') if activity.time else None,
                'location': activity.location,
                'session_name': activity.session.name,
                'organization_name': activity.session.organization.name,
                'organization_id': activity.session.organization.id,
                'enrolled_count': enrolled_count,
                'waitlist_count': waitlist_count,
                'has_meeting': meeting is not None,
                'is_cancelled': is_cancelled,
                'cancellation_reason': cancellation_reason,
            }

            if meeting:
                attendance_records = meeting.attendance_records.all()
                stats['enrolled_present'] = attendance_records.filter(status='present', student__enrollments__activity=activity, student__enrollments__status='active').distinct().count()
                stats['enrolled_unexpected_absent'] = attendance_records.filter(status='unexpected_absence', student__enrollments__activity=activity, student__enrollments__status='active').distinct().count()
                stats['enrolled_expected_absent'] = attendance_records.filter(status='expected_absence', student__enrollments__activity=activity, student__enrollments__status='active').distinct().count()
                stats['waitlist_present'] = attendance_records.filter(status='present', student__enrollments__activity=activity, student__enrollments__status='waiting').distinct().count()
                stats['waitlist_unexpected_absent'] = attendance_records.filter(status='unexpected_absence', student__enrollments__activity=activity, student__enrollments__status='waiting').distinct().count()
                stats['waitlist_expected_absent'] = attendance_records.filter(status='expected_absence', student__enrollments__activity=activity, student__enrollments__status='waiting').distinct().count()
                stats['walkin_count'] = attendance_records.exclude(student__enrollments__activity=activity).distinct().count()
            else:
                stats['enrolled_present'] = 0
                stats['enrolled_unexpected_absent'] = 0
                stats['enrolled_expected_absent'] = 0
                stats['waitlist_present'] = 0
                stats['waitlist_unexpected_absent'] = 0
                stats['waitlist_expected_absent'] = 0
                stats['walkin_count'] = 0

            results.append(stats)

        return Response(results)
