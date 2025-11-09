from django.urls import path
from activity.views.attendance import (
    MeetingGetOrCreateView,
    AttendanceUpdateView,
    StudentSearchView,
    StudentQuickCreateView,
    AttendanceStatsView
)

urlpatterns = [
    path('meetings/get-or-create/', MeetingGetOrCreateView.as_view(), name='meeting-get-or-create'),
    path('meetings/<int:meeting_id>/attendance/', AttendanceUpdateView.as_view(), name='attendance-update'),
    path('students/search/', StudentSearchView.as_view(), name='student-search'),
    path('students/quick-create/', StudentQuickCreateView.as_view(), name='student-quick-create'),
    path('attendance/stats/', AttendanceStatsView.as_view(), name='attendance-stats'),
]
