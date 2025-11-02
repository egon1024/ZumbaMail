from django.urls import path
from activity.views import StudentListView
from activity.views.student import StudentDetailView

urlpatterns = [
    path('students/', StudentListView.as_view(), name='student-list'),
    path('students/<int:pk>/details/', StudentDetailView.as_view(), name='student-detail'),
    path('students/<int:pk>/', StudentDetailView.as_view(), name='student-edit'),
]
