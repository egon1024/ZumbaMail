from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateAPIView
from rest_framework import generics, permissions, status
from activity.models import Organization, Session, Activity, Contact
from activity.serializers import OrganizationSerializer, ContactSerializer

class OrganizationSoftDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def delete(self, request, pk):
        try:
            org = Organization.objects.get(pk=pk, is_deleted=False)
        except Organization.DoesNotExist:
            return Response({'detail': 'Organization not found or already deleted.'}, status=404)
        org.is_deleted = True
        org.save()
        return Response({'detail': 'Organization soft deleted.'}, status=204)

class OrganizationListCreateView(ListCreateAPIView):
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        include_deleted = self.request.query_params.get('include_deleted') == '1'
        qs = Organization.objects.all()
        if not include_deleted:
            qs = qs.filter(is_deleted=False)
        return qs

class OrganizationListView(generics.ListAPIView):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]

class OrganizationUpdateView(RetrieveUpdateAPIView):
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        include_deleted = self.request.query_params.get('include_deleted') == '1'
        qs = Organization.objects.all()
        if not include_deleted:
            qs = qs.filter(is_deleted=False)
        return qs

class OrganizationDetailsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request, pk):
        include_deleted = request.query_params.get('include_deleted') == '1'
        qs = Organization.objects.prefetch_related('contacts', 'sessions')
        if not include_deleted:
            qs = qs.filter(is_deleted=False)
        try:
            org = qs.get(pk=pk)
        except Organization.DoesNotExist:
            return Response({'detail': 'Organization not found.'}, status=status.HTTP_404_NOT_FOUND)
        contacts = ContactSerializer(org.contacts.all(), many=True).data
        sessions = org.sessions.order_by('start_date')
        from django.utils import timezone
        try:
            current_date = timezone.now().date()
        except Exception:
            import datetime
            current_date = datetime.date.today()
        current_session = None
        future_sessions = []
        past_sessions = []
        for session in sessions:
            if session.start_date <= current_date <= session.end_date and not session.closed:
                current_session = session
            elif session.start_date > current_date and not session.closed:
                future_sessions.append(session)
            elif session.end_date < current_date or session.closed:
                past_sessions.append(session)
        current_activities = []
        if current_session:
            current_activities = Activity.objects.filter(session=current_session, closed=False)
        def session_data(session):
            return {
                'id': session.id,
                'name': session.name,
                'start_date': str(session.start_date),
                'end_date': str(session.end_date),
                'closed': session.closed,
            }
        future_sessions_data = [session_data(s) for s in future_sessions]
        past_sessions_data = [session_data(s) for s in past_sessions]
        current_session_data = session_data(current_session) if current_session else None
        activities_data = [
            {
                'id': a.id,
                'type': a.type,
                'day_of_week': a.day_of_week,
                'time': a.time.strftime('%I:%M %p'),
                'location': a.location,
            }
            for a in current_activities
        ]
        return Response({
            'id': org.id,
            'name': org.name,
            'contacts': contacts,
            'current_session': current_session_data,
            'future_sessions': future_sessions_data,
            'past_sessions': past_sessions_data,
            'current_activities': activities_data,
        })
