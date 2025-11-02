from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Student
from .serializers import StudentDetailSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_detail(request, pk):
    try:
        student = Student.objects.get(pk=pk)
    except Student.DoesNotExist:
        return Response({'error': 'Student not found'}, status=404)
    include_closed = request.query_params.get('include_closed', 'false').lower() == 'true'
    serializer = StudentDetailSerializer(student, context={'include_closed': include_closed})
    return Response({'student': serializer.data})
