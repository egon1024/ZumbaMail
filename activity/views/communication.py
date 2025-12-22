import hashlib
import json
from datetime import timedelta

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.shortcuts import get_object_or_404
from django.conf import settings
from collections import defaultdict
from activity.models import Organization, Session, Activity, Enrollment, Student, AttendanceRecord
from activity.models import Meeting


class EmailBlastView(APIView):
    """
    Get email recipients for an email blast based on filters.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        session_id = request.query_params.get('session_id')
        organization_id = request.query_params.get('organization_id')
        active_status = request.query_params.get('active_status', 'active') # active, inactive, both
        # inclusion_criteria is expected to be a list, passed as e.g. inclusion_criteria=enrolled&inclusion_criteria=waitlisted
        inclusion_criteria = request.query_params.getlist('inclusion_criteria')

        # Default to all if not provided (though frontend should provide defaults)
        if not inclusion_criteria:
            inclusion_criteria = ['enrolled', 'waitlisted', 'walkin']

        # Determine the scope of activities
        if session_id:
            try:
                session = Session.objects.get(pk=session_id)
                activities = Activity.objects.filter(session=session)
            except Session.DoesNotExist:
                return Response({"error": "Session not found"}, status=404)
        elif organization_id:
            # If no session but org is selected, get all activities for that org
            activities = Activity.objects.filter(session__organization_id=organization_id)
        else:
            # Global blast - all activities
            activities = Activity.objects.all()

        # Base student queryset
        student_qs = Student.objects.all()

        # Filter by Active Status
        if active_status == 'active':
            student_qs = student_qs.filter(active=True)
        elif active_status == 'inactive':
            student_qs = student_qs.filter(active=False)
        # 'both' implies no filter on active status

        # Define Sets of Student IDs within the defined scope (activities)
        
        # 1. Enrolled (in the scoped activities)
        enrolled_ids = set(Enrollment.objects.filter(
            activity__in=activities,
            status='active'
        ).values_list('student_id', flat=True))

        # 2. Waitlisted (in the scoped activities)
        waitlisted_ids = set(Enrollment.objects.filter(
            activity__in=activities,
            status='waiting'
        ).values_list('student_id', flat=True))

        # 3. Walk-in Only (Has attendance record in scope, but NOT valid enrollment in scope)
        attendee_ids = set(AttendanceRecord.objects.filter(
            meeting__activity__in=activities
        ).values_list('student_id', flat=True))
        
        # Students who have SOME enrollment (active or waiting) in this scope
        any_enrollment_ids = enrolled_ids.union(waitlisted_ids)
        
        # Walk-in ONLY = Attendees who are NOT in the enrolled/waitlisted set
        walkin_only_ids = attendee_ids - any_enrollment_ids

        # Combine based on criteria
        final_ids = set()
        
        if 'enrolled' in inclusion_criteria:
            final_ids.update(enrolled_ids)
        
        if 'waitlisted' in inclusion_criteria:
            final_ids.update(waitlisted_ids)
            
        if 'walkin' in inclusion_criteria:
            final_ids.update(walkin_only_ids)

        # Apply final student filters (active status, and email existence)
        recipients = student_qs.filter(
            id__in=final_ids
        ).exclude(email='').exclude(email__isnull=True).order_by('last_name', 'first_name')
        
        # Build BCC List
        bcc_list = [s.email for s in recipients]

        return Response({
            'to_email': settings.DEFAULT_EMAIL_TO_ADDRESS,
            'bcc_emails': ", ".join(bcc_list),
            'subject': "",
            'body': "",
            'student_count': len(bcc_list)
        })


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
        activities = Activity.objects.select_related('location').filter(
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
                    'location_name': act.location.name if act.location else None
                })

            waitlisted_activities = []
            for act_id in sorted(data['waitlisted']):
                act = activity_map[act_id]
                waitlisted_activities.append({
                    'id': act.id,
                    'day_of_week': act.day_of_week,
                    'type': act.get_type_display(),
                    'time': act.time.strftime('%I:%M %p'),
                    'location_name': act.location.name if act.location else None
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

    def _format_time_for_email(self, time_obj):
        # Format as h:mm AM/PM (e.g., 7:00AM, 11:30PM)
        formatted = time_obj.strftime('%-I:%M%p')
        # Remove :00 if present
        formatted = formatted.replace(':00', '')
        # Convert AM/PM to lowercase
        formatted = formatted.lower()
        return formatted

    def _get_time_range(self, time_obj):
        start_time_formatted = self._format_time_for_email(time_obj)
        end_time_obj = time_obj.replace(hour=(time_obj.hour + 1) % 24) # Assuming 1-hour classes
        end_time_formatted = self._format_time_for_email(end_time_obj)
        return f"{start_time_formatted} - {end_time_formatted}"

    def _build_subject(self, activities, organization):
        """Builds the email subject line."""
        if not activities:
            return f"{organization.name} Class Information"

        class_descs = [f"{act.get_type_display()} {act.day_of_week}" for act in activities]
        
        subject = " and ".join(class_descs)
        subject += f" {organization.name} Classes With Alyssa"
        return subject

    def _build_body(self, enrolled_activities, waitlisted_activities, session):
        """Builds the email body."""
        body_lines = ["Hello-", "You are currently signed up for:", ""]

        # --- Enrolled Classes ---
        for i, act in enumerate(enrolled_activities):
            # Class name, day, and time
            time_range = self._get_time_range(act.time)
            body_lines.append(f"{act.get_type_display()} {act.day_of_week} {time_range}")

            # Class dates
            possible_dates = act.get_possible_dates()
            cancelled_dates_objs = act.get_cancelled_dates()
            
            display_meeting_dates = [d for d in possible_dates if d not in cancelled_dates_objs]

            date_str = ", ".join([d.strftime('%-m/%-d') for d in display_meeting_dates])
            day_abbr = act.day_of_week[:4] if act.day_of_week == "Thursday" else act.day_of_week[:3]
            body_lines.append(f"  {act.get_type_display()} {day_abbr} dates: {date_str}")

            if cancelled_dates_objs:
                cancelled_dates_str = ", ".join([d.strftime('%-m/%-d') for d in sorted(cancelled_dates_objs)])
                body_lines.append(f"  Cancelled dates: {cancelled_dates_str}")
            
            if i < len(enrolled_activities) - 1 or waitlisted_activities:
                body_lines.append("")
                body_lines.append("and")
                body_lines.append("")

        # --- Waitlisted Classes ---
        for i, act in enumerate(waitlisted_activities):
            # Class name, day, and time (consistent format)
            time_range = self._get_time_range(act.time)
            body_lines.append(f"Waitlist: {act.get_type_display()} {act.day_of_week} {time_range}")

            # Class dates (including cancellations)
            possible_dates = act.get_possible_dates()
            cancelled_dates_objs = act.get_cancelled_dates()
            
            display_meeting_dates = [d for d in possible_dates if d not in cancelled_dates_objs]

            date_str = ", ".join([d.strftime('%-m/%-d') for d in display_meeting_dates])
            day_abbr = act.day_of_week[:4] if act.day_of_week == "Thursday" else act.day_of_week[:3]
            body_lines.append(f"  {act.get_type_display()} {day_abbr} dates: {date_str}")

            if cancelled_dates_objs:
                cancelled_dates_str = ", ".join([d.strftime('%-m/%-d') for d in sorted(cancelled_dates_objs)])
                body_lines.append(f"  Cancelled dates: {cancelled_dates_str}")
            
            if i < len(waitlisted_activities) - 1: # Add separator between waitlisted classes
                body_lines.append("")
                body_lines.append("and")
                body_lines.append("")
        
        if waitlisted_activities and enrolled_activities: # Add separator if both enrolled and waitlisted exist
            body_lines.append("")

        # --- Location Information ---
        unique_locations = set()
        # Consider both enrolled and waitlisted activities for location info
        for act in enrolled_activities + waitlisted_activities:
            try:
                # This works for valid FKs
                if act.location:
                    unique_locations.add(act.location)
            except AttributeError:
                # This handles the case where act.location is a string
                pass

        if len(unique_locations) == 1:
            location = unique_locations.pop()
            location_line = f"Class takes place at the {location.name}"
            if location.address:
                location_line += f", located at {location.address}."
            else:
                location_line += "." # Add a period if no address
            body_lines.append(location_line)

            if location.description:
                body_lines.append(location.description)
            body_lines.append("")

        # --- Closing Paragraph ---
        is_full = any(
            act.max_capacity and act.enrollments.filter(status='active').count() >= act.max_capacity
            for act in enrolled_activities
        )
        # Check if any class (enrolled or waitlisted) has students on its waitlist
        has_waitlisted_students_in_any_class = any(
            act.enrollments.filter(status='waiting').exists()
            for act in (enrolled_activities + waitlisted_activities)
        )
        has_enrolled_activities = bool(enrolled_activities)

        if is_full:
            body_lines.append("This class is currently full, and there is a wait list. Please let me know any dates that you will not be able to attend class.")
            body_lines.append("If you have any questions, please don't hesitate to ask.")
        elif has_enrolled_activities and has_waitlisted_students_in_any_class:
            body_lines.append("As a reminder, if you are aware that you will be away for certain days, please let me know which classes you will miss so I can open those spots to people on the waiting list. Please be sure to include your name and the dates you will be absent.")
        else: # This covers solely waitlisted, or enrolled with no waitlist
            body_lines.append("Thank you so much for being such a loving supporter of my classes!")
            body_lines.append("If you have any questions, please don't hesitate to ask.")
        
        # Only include "I look forward to seeing you in class soon!" if there are enrolled activities
        # or if it's not solely waitlisted (i.e., there are no waitlisted activities either)
        if bool(enrolled_activities) or not bool(waitlisted_activities):
            body_lines.append("I look forward to seeing you in class soon!")
        
        body_lines.append("~ Alyssa")

        return "\n".join(body_lines)

    def get(self, request, combination_id):
        session_id = request.query_params.get('session_id')
        if not session_id:
            return Response({"error": "session_id is required"}, status=400)

        try:
            session = Session.objects.select_related('organization').get(pk=session_id)
        except Session.DoesNotExist:
            return Response({"error": "Session not found"}, status=404)

        activities = Activity.objects.filter(session=session).prefetch_related(
            'meetings',
            'enrollments__student',
            'cancellations' # Corrected related_name
        ).order_by('day_of_week', 'time')

        student_classes = defaultdict(lambda: {'enrolled': set(), 'waitlisted': set(), 'student': None})
        for activity in activities:
            for enrollment in activity.enrollments.all():
                if enrollment.status == 'active':
                    student_classes[enrollment.student.id]['enrolled'].add(activity.id)
                elif enrollment.status == 'waiting':
                    student_classes[enrollment.student.id]['waitlisted'].add(activity.id)
                student_classes[enrollment.student.id]['student'] = enrollment.student

        activity_map = {act.id: act for act in activities}
        target_students = []
        target_enrolled_ids = set()
        target_waitlisted_ids = set()

        for student_id, classes in student_classes.items():
            combo_string = json.dumps({
                'enrolled': sorted(list(classes['enrolled'])),
                'waitlisted': sorted(list(classes['waitlisted']))
            }, sort_keys=True)
            combo_id = hashlib.md5(combo_string.encode()).hexdigest()

            if combo_id == combination_id:
                target_students.append(classes['student'])
                if not target_enrolled_ids:
                    target_enrolled_ids = classes['enrolled']
                    target_waitlisted_ids = classes['waitlisted']
        
        if not target_students:
            return Response({"error": "Combination not found"}, status=404)

        target_students.sort(key=lambda s: (s.last_name, s.first_name))
        bcc_list = [s.email for s in target_students if s.email]

        enrolled_activities = sorted([activity_map[id] for id in target_enrolled_ids], key=lambda x: (x.day_of_week, x.time))
        waitlisted_activities = sorted([activity_map[id] for id in target_waitlisted_ids], key=lambda x: (x.day_of_week, x.time))

        subject = self._build_subject(enrolled_activities, session.organization)
        body = self._build_body(enrolled_activities, waitlisted_activities, session)

        # For the frontend summary
        enrolled_activities_summary = []
        for act in enrolled_activities:
            location_name = "N/A"
            try:
                if act.location:
                    location_name = act.location.name
            except AttributeError:
                location_name = act.location # old string value
            enrolled_activities_summary.append({
                'day_of_week': act.day_of_week,
                'type': act.get_type_display(),
                'time': self._format_time_for_email(act.time),
                'location': location_name
            })

        waitlisted_activities_summary = []
        for act in waitlisted_activities:
            location_name = "N/A"
            try:
                if act.location:
                    location_name = act.location.name
            except AttributeError:
                location_name = act.location # old string value
            waitlisted_activities_summary.append({
                'day_of_week': act.day_of_week,
                'type': act.get_type_display(),
                'time': self._format_time_for_email(act.time),
                'location': location_name
            })

        return Response({
            'to_email': settings.DEFAULT_EMAIL_TO_ADDRESS,
            'bcc_emails': ", ".join(bcc_list),
            'subject': subject,
            'body': body,
            'student_count': len(target_students),
            'enrolled_classes': enrolled_activities_summary,
            'waitlisted_classes': waitlisted_activities_summary,
            'organization_name': session.organization.name,
            'session_name': session.name,
        })
