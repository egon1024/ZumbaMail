from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, CreateAPIView, DestroyAPIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from datetime import datetime
from activity.models import ClassCancellation, Activity
from activity.serializers import ClassCancellationSerializer


class CancellationListView(ListAPIView):
    """
    List all class cancellations with optional filtering by date range or organization.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ClassCancellationSerializer

    def get_queryset(self):
        queryset = ClassCancellation.objects.select_related(
            'activity__session__organization'
        )

        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)

        # Filter by organization
        organization_id = self.request.query_params.get('organization_id')
        if organization_id:
            queryset = queryset.filter(activity__session__organization_id=organization_id)

        return queryset


class CancellationCreateView(CreateAPIView):
    """
    Create a new class cancellation.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ClassCancellationSerializer


class CancellationDeleteView(DestroyAPIView):
    """
    Delete a class cancellation (un-cancel a class).
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = ClassCancellation.objects.all()
    serializer_class = ClassCancellationSerializer


class CancellationForDateView(APIView):
    """
    Get all cancellations for a specific date.
    Used by attendance pages to check if classes are cancelled.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        date = request.query_params.get('date')

        if not date:
            return Response(
                {"error": "date parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        cancellations = ClassCancellation.objects.filter(
            date=date
        ).select_related('activity__session__organization')

        serializer = ClassCancellationSerializer(cancellations, many=True)
        return Response(serializer.data)
