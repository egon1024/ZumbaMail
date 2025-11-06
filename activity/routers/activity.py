from django.urls import path
from activity.views.activity import ActivityListView, ActivityDetailView, ActivityEnrollmentUpdateView

urlpatterns = [
    path('classes/', ActivityListView.as_view(), name='class-list'),
    path('activity/<int:pk>/', ActivityDetailView.as_view(), name='activity-detail'),
    path('activity/<int:pk>/enrollment/', ActivityEnrollmentUpdateView.as_view(), name='activity-enrollment-update'),
]
