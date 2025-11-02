from rest_framework.generics import ListAPIView, RetrieveUpdateAPIView, CreateAPIView
from rest_framework import permissions, serializers
from activity.models import Student
from activity.serializers import StudentDetailSerializer

class StudentListView(ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        status = self.request.query_params.get('status', 'active')
        if status == 'all':
            return Student.objects.all()
        elif status == 'inactive':
            return Student.objects.filter(active=False)
        else:
            return Student.objects.filter(active=True)
    def get_serializer_class(self):
        class StudentSerializer(serializers.ModelSerializer):
            class Meta:
                model = Student
                exclude = ['notes']
        return StudentSerializer


class StudentDetailView(RetrieveUpdateAPIView):
    queryset = Student.objects.all()
    serializer_class = StudentDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

class StudentCreateView(CreateAPIView):
    queryset = Student.objects.all()
    serializer_class = StudentDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
