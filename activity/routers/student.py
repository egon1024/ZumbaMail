from django.urls import path
from activity.views import StudentListView
from activity.api_student import student_detail

urlpatterns = [
    path('students/', StudentListView.as_view(), name='student-list'),
    path('students/<int:pk>/details/', student_detail, name='student-detail'),
]
