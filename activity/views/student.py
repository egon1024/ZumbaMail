from rest_framework.generics import ListAPIView
from rest_framework import permissions, serializers
from activity.models import Student

class StudentListView(ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        # Return all students marked as active
        return Student.objects.filter(active=True)
    def get_serializer_class(self):
        class StudentSerializer(serializers.ModelSerializer):
            class Meta:
                model = Student
                exclude = ['notes']
        return StudentSerializer
