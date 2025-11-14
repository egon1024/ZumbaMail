from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.shortcuts import get_object_or_404
from django.conf import settings
from activity.models import Organization, Session, Activity, Enrollment, Student
from collections import defaultdict
import hashlib
import json


class SessionEnrollmentCombinationsView(APIView):
    """
    Get all unique combinations of class enrollments for a given session.
    Returns a list of combinations with student counts and a unique identifier.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        session_id = request.query_params.get('session_id')

        if not session_id:
            return Response(
                {"error": "session_id is required"},
                status=400
            )

        try:
            session = Session.objects.get(pk=session_id)
        except Session.DoesNotExist:
            return Response(
                {"error": "Session not found"},
                status=404
            )

        # Get all activities for this session
        activities = Activity.objects.filter(
            session=session
        ).order_by('day_of_week', 'time')

        # Build a mapping of students to their enrolled and waitlisted classes
        student_classes = defaultdict(lambda: {'enrolled': set(), 'waitlisted': set()})

        for activity in activities:
            # Get enrolled students
            enrolled = Enrollment.objects.filter(
                activity=activity,
                status='active'
            ).select_related('student')

            for enrollment in enrolled:
                student_classes[enrollment.student.id]['enrolled'].add(activity.id)

            # Get waitlisted students
            waitlisted = Enrollment.objects.filter(
                activity=activity,
                status='waiting'
            ).select_related('student')

            for enrollment in waitlisted:
                student_classes[enrollment.student.id]['waitlisted'].add(activity.id)

        # Group students by their unique combination of classes
        combinations = defaultdict(lambda: {'students': [], 'enrolled': set(), 'waitlisted': set()})

        for student_id, classes in student_classes.items():
            # Create a unique key for this combination
            enrolled_tuple = tuple(sorted(classes['enrolled']))
            waitlisted_tuple = tuple(sorted(classes['waitlisted']))
            combo_key = (enrolled_tuple, waitlisted_tuple)

            combinations[combo_key]['students'].append(student_id)
            combinations[combo_key]['enrolled'] = classes['enrolled']
            combinations[combo_key]['waitlisted'] = classes['waitlisted']

        # Convert combinations to a list with details
        result = []
        activity_map = {act.id: act for act in activities}

        for (enrolled_ids, waitlisted_ids), data in combinations.items():
            # Create a unique combination ID
            combo_string = json.dumps({
                'enrolled': sorted(enrolled_ids),
                'waitlisted': sorted(waitlisted_ids)
            }, sort_keys=True)
            combo_id = hashlib.md5(combo_string.encode()).hexdigest()

            # Get activity details
            enrolled_activities = []
            for act_id in sorted(data['enrolled']):
                act = activity_map[act_id]
                enrolled_activities.append({
                    'id': act.id,
                    'day_of_week': act.day_of_week,
                    'type': act.get_type_display(),
                    'time': act.time.strftime('%I:%M %p'),
                    'location': act.location
                })

            waitlisted_activities = []
            for act_id in sorted(data['waitlisted']):
                act = activity_map[act_id]
                waitlisted_activities.append({
                    'id': act.id,
                    'day_of_week': act.day_of_week,
                    'type': act.get_type_display(),
                    'time': act.time.strftime('%I:%M %p'),
                    'location': act.location
                })

            result.append({
                'combination_id': combo_id,
                'student_count': len(data['students']),
                'enrolled_classes': enrolled_activities,
                'waitlisted_classes': waitlisted_activities,
                'student_ids': data['students']
            })

        # Sort by number of students (descending) for easier viewing
        result.sort(key=lambda x: x['student_count'], reverse=True)

        return Response({
            'session_id': session.id,
            'session_name': session.name,
            'organization_name': session.organization.name,
            'combinations': result
        })


class EmailDetailsView(APIView):
    """
    Get email composition details for a specific enrollment combination.
    Returns the BCC list, subject, and body text for the email.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, combination_id):
        session_id = request.query_params.get('session_id')

        if not session_id:
            return Response(
                {"error": "session_id is required"},
                status=400
            )

        try:
            session = Session.objects.get(pk=session_id)
        except Session.DoesNotExist:
            return Response(
                {"error": "Session not found"},
                status=404
            )

        # Re-generate combinations to find the one matching this ID
        # (In a production app, we might cache this data)
        activities = Activity.objects.filter(
            session=session
        ).order_by('day_of_week', 'time')

        student_classes = defaultdict(lambda: {'enrolled': set(), 'waitlisted': set(), 'student': None})

        for activity in activities:
            # Get enrolled students
            enrolled = Enrollment.objects.filter(
                activity=activity,
                status='active'
            ).select_related('student')

            for enrollment in enrolled:
                student_classes[enrollment.student.id]['enrolled'].add(activity.id)
                student_classes[enrollment.student.id]['student'] = enrollment.student

            # Get waitlisted students
            waitlisted = Enrollment.objects.filter(
                activity=activity,
                status='waiting'
            ).select_related('student')

            for enrollment in waitlisted:
                student_classes[enrollment.student.id]['waitlisted'].add(activity.id)
                student_classes[enrollment.student.id]['student'] = enrollment.student

        # Find the combination matching the provided ID
        activity_map = {act.id: act for act in activities}
        target_students = []
        enrolled_activities = []
        waitlisted_activities = []

        for student_id, classes in student_classes.items():
            enrolled_tuple = tuple(sorted(classes['enrolled']))
            waitlisted_tuple = tuple(sorted(classes['waitlisted']))

            combo_string = json.dumps({
                'enrolled': sorted(classes['enrolled']),
                'waitlisted': sorted(classes['waitlisted'])
            }, sort_keys=True)
            combo_id = hashlib.md5(combo_string.encode()).hexdigest()

            if combo_id == combination_id:
                target_students.append(classes['student'])

                # Build activity lists (only once)
                if not enrolled_activities:
                    for act_id in sorted(classes['enrolled']):
                        act = activity_map[act_id]
                        enrolled_activities.append({
                            'day_of_week': act.day_of_week,
                            'type': act.get_type_display(),
                            'time': act.time.strftime('%I:%M %p'),
                            'location': act.location
                        })

                if not waitlisted_activities:
                    for act_id in sorted(classes['waitlisted']):
                        act = activity_map[act_id]
                        waitlisted_activities.append({
                            'day_of_week': act.day_of_week,
                            'type': act.get_type_display(),
                            'time': act.time.strftime('%I:%M %p'),
                            'location': act.location
                        })

        if not target_students:
            return Response(
                {"error": "Combination not found"},
                status=404
            )

        # Sort students by last name, first name
        target_students.sort(key=lambda s: (s.last_name, s.first_name))

        # Build BCC list (comma-separated emails)
        bcc_list = []
        for student in target_students:
            if student.email:
                bcc_list.append(student.email)

        # Build email subject
        subject = f'{session.organization.name}: "{session.name}" session Class Registration'

        # Build email body
        body_lines = [
            f"Hello!",
            "",
            f'Thank you for enrolling in classes for the "{session.name}" session with {session.organization.name}.',
            "",
        ]

        if enrolled_activities:
            body_lines.append("You are enrolled in the following classes:")
            body_lines.append("")
            for act in enrolled_activities:
                body_lines.append(f"  {act['day_of_week']} {act['type']}")
                body_lines.append(f"  Time: {act['time']}")
                body_lines.append(f"  Location: {act['location']}")
                body_lines.append("")

        if waitlisted_activities:
            body_lines.append("You are on the waitlist for the following classes:")
            body_lines.append("")
            for act in waitlisted_activities:
                body_lines.append(f"  {act['day_of_week']} {act['type']}")
                body_lines.append(f"  Time: {act['time']}")
                body_lines.append(f"  Location: {act['location']}")
                body_lines.append("")

        body_lines.extend([
            "We look forward to seeing you!",
            "",
            f"Best regards,",
            f"{session.organization.name}"
        ])

        body = "\n".join(body_lines)

        # Build a readable combination name for breadcrumb
        class_names = []
        if enrolled_activities:
            class_names.extend([f"{act['day_of_week']} {act['type']}" for act in enrolled_activities])
        if waitlisted_activities:
            class_names.extend([f"{act['day_of_week']} {act['type']} (Waitlist)" for act in waitlisted_activities])

        combination_name = " + ".join(class_names) if class_names else "No Classes"

        return Response({
            'to_email': settings.DEFAULT_EMAIL_TO_ADDRESS,
            'bcc_emails': ", ".join(bcc_list),
            'subject': subject,
            'body': body,
            'student_count': len(target_students),
            'enrolled_classes': enrolled_activities,
            'waitlisted_classes': waitlisted_activities,
            'organization_name': session.organization.name,
            'session_name': session.name,
            'combination_name': combination_name
        })
