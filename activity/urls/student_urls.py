from django.urls import path
from activity.views import StudentListView

urlpatterns = [
    path('students/', StudentListView.as_view(), name='student-list'),
]
