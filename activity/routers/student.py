from django.urls import path
from activity.views import StudentListView
from activity.views.student import StudentDetailView, StudentCreateView

urlpatterns = [
    path('students/', StudentListView.as_view(), name='student-list'),
    path('students/new/', StudentCreateView.as_view(), name='student-create'),
    path('students/<int:pk>/details/', StudentDetailView.as_view(), name='student-detail'),
    path('students/<int:pk>/', StudentDetailView.as_view(), name='student-edit'),
]
