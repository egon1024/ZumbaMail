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
        
        # Build BCC List and Detail List
        bcc_list = [s.email for s in recipients]
        recipient_details = [{'name': f"{s.first_name} {s.last_name}", 'email': s.email} for s in recipients]

        return Response({
            'to_email': settings.DEFAULT_EMAIL_TO_ADDRESS,
            'bcc_emails': ", ".join(bcc_list),
            'recipients': recipient_details,
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

    def _get_activity_location(self, activity):
        try:
            loc = activity.location
        except AttributeError:
            return None
        return loc if loc else None

    def _normalized_address_key(self, location):
        if not location or not location.address:
            return ""
        return location.address.strip()

    def _format_venue_address_line(self, location):
        line = f"Class takes place at the {location.name}"
        addr = location.address.strip() if location.address else ""
        if addr:
            line += f", located at {addr}."
        else:
            line += "."
        return line

    def _location_plan(self, enrolled_activities, waitlisted_activities):
        """
        Returns dict with shared_address_block, representative_location (first activity
        that has a location), or None if no activities have locations.
        """
        ordered = [(act, False) for act in enrolled_activities] + [(act, True) for act in waitlisted_activities]
        located_pairs = [(act, is_wl) for act, is_wl in ordered if self._get_activity_location(act)]
        if not located_pairs:
            return None

        norm_addresses = [
            self._normalized_address_key(self._get_activity_location(act)) for act, _ in located_pairs
        ]
        distinct_addresses = set(norm_addresses)
        location_ids = {self._get_activity_location(act).pk for act, _ in located_pairs}
        shared_address_block = len(distinct_addresses) == 1 and not (
            distinct_addresses == {""} and len(location_ids) > 1
        )
        representative_location = self._get_activity_location(located_pairs[0][0])
        return {
            "shared_address_block": shared_address_block,
            "representative_location": representative_location,
        }

    def _append_meeting_schedule_lines(self, body_lines, act):
        possible_dates = act.get_possible_dates()
        cancelled_dates_objs = act.get_cancelled_dates()
        display_meeting_dates = [d for d in possible_dates if d not in cancelled_dates_objs]
        date_str = ", ".join([d.strftime('%-m/%-d') for d in display_meeting_dates])
        body_lines.append(f"  Dates: {date_str}")
        if cancelled_dates_objs:
            cancelled_dates_str = ", ".join([d.strftime('%-m/%-d') for d in sorted(cancelled_dates_objs)])
            body_lines.append(f"  Cancelled dates: {cancelled_dates_str}")

    def _append_activity_location_paragraph(self, body_lines, act, plan, shared_venue_emitted):
        """
        Venue + description directly under the class schedule. When plan['shared_address_block'],
        the shared 'Class takes place at…' line is emitted only once (first class in roster that
        has a location). Later classes at the same address get only their description lines.
        """
        loc = self._get_activity_location(act)
        if not loc:
            return shared_venue_emitted
        desc = loc.description.strip() if loc.description else ""
        if plan["shared_address_block"]:
            if not shared_venue_emitted:
                body_lines.append(self._format_venue_address_line(plan["representative_location"]))
                shared_venue_emitted = True
            if desc:
                body_lines.append(desc)
        else:
            body_lines.append(self._format_venue_address_line(loc))
            if desc:
                body_lines.append(desc)
        body_lines.append("")
        return shared_venue_emitted

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
        plan = self._location_plan(enrolled_activities, waitlisted_activities)
        shared_venue_emitted = False

        # --- Enrolled Classes ---
        for i, act in enumerate(enrolled_activities):
            time_range = self._get_time_range(act.time)
            body_lines.append(f"{act.get_type_display()} {act.day_of_week} {time_range}")
            self._append_meeting_schedule_lines(body_lines, act)
            if plan:
                shared_venue_emitted = self._append_activity_location_paragraph(
                    body_lines, act, plan, shared_venue_emitted
                )

            if i < len(enrolled_activities) - 1 or waitlisted_activities:
                body_lines.append("")
                body_lines.append("and")
                body_lines.append("")

        # --- Waitlisted Classes ---
        for i, act in enumerate(waitlisted_activities):
            time_range = self._get_time_range(act.time)
            body_lines.append(f"Waitlist: {act.get_type_display()} {act.day_of_week} {time_range}")
            self._append_meeting_schedule_lines(body_lines, act)
            if plan:
                shared_venue_emitted = self._append_activity_location_paragraph(
                    body_lines, act, plan, shared_venue_emitted
                )

            if i < len(waitlisted_activities) - 1:
                body_lines.append("")
                body_lines.append("and")
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

        body_lines.append("")
        body_lines.extend([
            "As a reminder, if you are aware that you will be away for certain days, please let me know which classes you will miss so I can log an excused absence. Per the Rochester Rec policy, any student who misses 2 classes in a row without notification will be removed from the roster. Please be sure to include your name and the dates you will be absent. You can message me at alyssatuininga@yahoo.com or text at 603-834-3262 or you can contact the Rec directly.",
            "",
            "Please be aware that I will be absent for a significant number of days this session. I will be taking a long trip with my youngest son to Costa Rica and attending an annual quilt retreat. Thankfully, we have two amazing subs that will be covering classes.",
            "",
            "Substitute schedule:",
            "May 7th: Cardio Drumming - Nancy",
            "May 8th: Zumba Gold - Nancy",
            "May 28th: Cardio Drumming - Nancy",
            "May 29th: Zumba Gold - Nancy",
            "June 1st: Zumba Gold - Nancy",
            "June 1st: Cardio Drumming - Denise",
            "June 4th: Cardio Drumming - Nancy",
            "June 5th: Zumba Gold - Denise",
            "June 11th: Cardio Drumming - Nancy",
            "June 12th: Zumba Gold - Denise",
            "",
        ])
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

        activities = Activity.objects.filter(session=session).select_related('location').prefetch_related(
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
