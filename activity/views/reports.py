from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.shortcuts import get_object_or_404
from datetime import datetime, timedelta
from activity.models import Organization, Activity, Meeting, AttendanceRecord


class WeeklyReportView(APIView):
    """
    Generate weekly attendance report for a specific organization and week.
    Week runs from Sunday through Saturday.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Get query parameters
        organization_id = request.query_params.get('organization_id')
        week_start = request.query_params.get('week_start')  # Expected format: YYYY-MM-DD (Sunday)

        if not organization_id or not week_start:
            return Response(
                {"error": "organization_id and week_start are required"},
                status=400
            )

        organization = get_object_or_404(Organization, pk=organization_id)

        # Parse the week_start date
        try:
            start_date = datetime.strptime(week_start, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {"error": "week_start must be in format YYYY-MM-DD"},
                status=400
            )

        # Calculate week end (Saturday)
        end_date = start_date + timedelta(days=6)

        # Get all activities for this organization
        activities = Activity.objects.filter(
            session__organization=organization,
            closed=False
        ).select_related('session').order_by('day_of_week', 'time')

        # Build report data
        report_data = []

        for activity in activities:
            # Get meetings for this activity in the date range
            meetings = Meeting.objects.filter(
                activity=activity,
                date__gte=start_date,
                date__lte=end_date
            ).prefetch_related('attendance_records__student')

            for meeting in meetings:
                # Get attendance records
                attendance_records = meeting.attendance_records.all()

                # Count present students
                present_count = attendance_records.filter(status='present').count()

                # Get unexpected absences
                unexpected_absences = attendance_records.filter(
                    status='unexpected_absence'
                ).select_related('student').order_by('student__last_name', 'student__first_name')

                # Get expected absences
                expected_absences = attendance_records.filter(
                    status='expected_absence'
                ).select_related('student').order_by('student__last_name', 'student__first_name')

                report_data.append({
                    'date': meeting.date,
                    'day_of_week': activity.day_of_week,
                    'class_type': activity.get_type_display(),
                    'location': activity.location,
                    'time': activity.time.strftime('%H:%M'),
                    'present_count': present_count,
                    'unexpected_absences': [
                        {
                            'id': record.student.id,
                            'name': f"{record.student.last_name}, {record.student.first_name}",
                            'first_name': record.student.first_name,
                            'last_name': record.student.last_name,
                        }
                        for record in unexpected_absences
                    ],
                    'expected_absences': [
                        {
                            'id': record.student.id,
                            'name': f"{record.student.last_name}, {record.student.first_name}",
                            'first_name': record.student.first_name,
                            'last_name': record.student.last_name,
                        }
                        for record in expected_absences
                    ],
                })

        # Sort by date, then time
        report_data.sort(key=lambda x: (x['date'], x['time']))

        return Response({
            'organization_name': organization.name,
            'week_start': start_date,
            'week_end': end_date,
            'meetings': report_data
        })


class ResidencyReportView(APIView):
    """
    Generate residency report for a specific session.
    Shows counts of Rochester residents vs non-residents for each class in the session.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Get query parameters
        organization_id = request.query_params.get('organization_id')
        session_id = request.query_params.get('session_id')

        if not organization_id or not session_id:
            return Response(
                {"error": "organization_id and session_id are required"},
                status=400
            )

        try:
            organization = Organization.objects.get(pk=organization_id)
        except Organization.DoesNotExist:
            return Response(
                {"error": "Organization not found"},
                status=404
            )

        from activity.models import Session
        try:
            # Get session and verify it belongs to the organization in one query
            session = Session.objects.get(pk=session_id, organization=organization)
        except Session.DoesNotExist:
            return Response(
                {"error": f"Session not found or does not belong to organization '{organization.name}'"},
                status=404
            )

        # Get all activities for this session
        activities = Activity.objects.filter(
            session=session
        ).select_related('session').order_by('day_of_week', 'time')

        # Build report data - aggregate across all meetings for each activity
        report_data = []

        for activity in activities:
            # Get all meetings for this activity
            meetings = Meeting.objects.filter(
                activity=activity
            ).prefetch_related('attendance_records__student')

            # Aggregate counts across all meetings for this activity
            total_rochester = 0
            total_non_rochester = 0

            for meeting in meetings:
                # Get all present students for this meeting
                present_records = meeting.attendance_records.filter(
                    status='present'
                ).select_related('student')

                # Count Rochester residents vs non-residents
                for record in present_records:
                    if record.student.rochester:
                        total_rochester += 1
                    else:
                        total_non_rochester += 1

            report_data.append({
                'day_of_week': activity.day_of_week,
                'class_type': activity.get_type_display(),
                'location': activity.location,
                'time': activity.time.strftime('%H:%M'),
                'rochester_count': total_rochester,
                'non_rochester_count': total_non_rochester,
            })

        # Sort by day of week, then time
        day_order = {'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7}
        report_data.sort(key=lambda x: (day_order.get(x['day_of_week'], 8), x['time']))

        return Response({
            'organization_name': organization.name,
            'session_name': session.name,
            'activities': report_data
        })
