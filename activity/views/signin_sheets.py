"""
Views for generating sign-in sheets
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from datetime import datetime
from activity.models import Activity
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

        try:
            num_weeks = int(num_weeks)
            if num_weeks < 1 or num_weeks > 52:
                raise ValueError()
        except (ValueError, TypeError):
            return Response(
                {'error': 'num_weeks must be between 1 and 52'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get activity
        try:
            activity = Activity.objects.get(pk=activity_id)
        except Activity.DoesNotExist:
            return Response(
                {'error': 'Activity not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get enrolled and waitlist students
        enrolled_enrollments = activity.enrollments.filter(status='active').select_related('student').order_by('student__last_name', 'student__first_name')
        waitlist_enrollments = activity.enrollments.filter(status='waiting').select_related('student').order_by('student__last_name', 'student__first_name')

        enrolled_students = [e.student for e in enrolled_enrollments]
        waitlist_students = [e.student for e in waitlist_enrollments]

        # Generate the sheet
        try:
            sheet_url = create_signin_sheet(
                activity=activity,
                start_date=start_date,
                num_weeks=num_weeks,
                enrolled_students=enrolled_students,
                waitlist_students=waitlist_students
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
