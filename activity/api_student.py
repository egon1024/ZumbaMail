from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Student
from .serializers import StudentDetailSerializer

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def student_detail(request, pk):
    try:
        student = Student.objects.get(pk=pk)
    except Student.DoesNotExist:
        return Response({'error': 'Student not found'}, status=404)
    if request.method == 'GET':
        include_closed = request.query_params.get('include_closed', 'false').lower() == 'true'
        serializer = StudentDetailSerializer(student, context={'include_closed': include_closed})
        return Response({'student': serializer.data})
    elif request.method == 'PUT':
        serializer = StudentDetailSerializer(student, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'student': serializer.data})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
