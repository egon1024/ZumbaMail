"""
Views for generating sign-in sheets
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from datetime import datetime, timedelta
from activity.models import Activity, Meeting, AttendanceRecord
from activity.utils.google_sheets import create_signin_sheet


class GenerateSignInSheetView(APIView):
    """
    Generate a Google Sheets sign-in sheet for an activity

    POST /api/signin-sheet/generate/
    Body:
    {
        "activity_id": 123,
        "start_date": "2025-01-10",
        "num_weeks": 7
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        activity_id = request.data.get('activity_id')
        start_date_str = request.data.get('start_date')
        num_weeks = request.data.get('num_weeks', 7)

        # Validation
        if not activity_id:
            return Response(
                {'error': 'activity_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not start_date_str:
            return Response(
                {'error': 'start_date is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'start_date must be in YYYY-MM-DD format'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get activity to check day of week
        try:
            activity = Activity.objects.get(pk=activity_id)
        except Activity.DoesNotExist:
            return Response(
                {'error': 'Activity not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Adjust start_date to match the activity's day of week
        day_map = {
            'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3,
            'Friday': 4, 'Saturday': 5, 'Sunday': 6
        }
        activity_day_num = day_map.get(activity.day_of_week)
        if activity_day_num is not None:
            start_day_num = start_date.weekday()
            days_diff = (activity_day_num - start_day_num) % 7
            if days_diff != 0:
                start_date = start_date + timedelta(days=days_diff)

        try:
            num_weeks = int(num_weeks)
            if num_weeks < 1 or num_weeks > 52:
                raise ValueError()
        except (ValueError, TypeError):
            return Response(
                {'error': 'num_weeks must be between 1 and 52'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get enrolled and waitlist students
        enrolled_enrollments = activity.enrollments.filter(status='active').select_related('student').order_by('student__last_name', 'student__first_name')
        waitlist_enrollments = activity.enrollments.filter(status='waiting').select_related('student').order_by('student__last_name', 'student__first_name')

        enrolled_students = [e.student for e in enrolled_enrollments]
        waitlist_students = [e.student for e in waitlist_enrollments]

        # Build attendance data for each date
        # Create a dict: {student_id: {date_str: status}}
        attendance_data = {}

        # Generate list of dates
        dates = []
        current_date = start_date
        for _ in range(num_weeks):
            dates.append(current_date)
            current_date += timedelta(days=7)

        # Query all attendance records for this activity and date range
        all_students = enrolled_students + waitlist_students
        student_ids = [s.id for s in all_students]

        # Get all meetings for these dates
        meetings = Meeting.objects.filter(
            activity=activity,
            date__in=dates
        ).prefetch_related('attendance_records__student')

        # Build attendance lookup and track drop-ins
        for student in all_students:
            attendance_data[student.id] = {}

        # Collect all drop-in students (students with attendance but not enrolled/waitlisted)
        dropin_student_ids = set()

        for meeting in meetings:
            date_str = meeting.date.strftime('%Y-%m-%d')
            for record in meeting.attendance_records.all():
                # Initialize attendance_data for this student if not already present
                if record.student_id not in attendance_data:
                    attendance_data[record.student_id] = {}

                attendance_data[record.student_id][date_str] = record.status

                # Track drop-ins: students with attendance but not in enrolled or waitlist
                if record.student_id not in student_ids:
                    dropin_student_ids.add(record.student_id)

        # Get drop-in student objects and sort by last name, first name
        from activity.models import Student
        dropin_students = list(Student.objects.filter(id__in=dropin_student_ids).order_by('last_name', 'first_name'))

        # Generate the sheet
        try:
            sheet_url = create_signin_sheet(
                activity=activity,
                start_date=start_date,
                num_weeks=num_weeks,
                enrolled_students=enrolled_students,
                waitlist_students=waitlist_students,
                dropin_students=dropin_students,
                attendance_data=attendance_data
            )

            return Response({
                'success': True,
                'sheet_url': sheet_url
            })

        except Exception as e:
            return Response(
                {'error': f'Failed to create sheet: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
