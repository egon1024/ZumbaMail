from django.urls import path
from activity.views import SessionEnrollmentCombinationsView, EmailDetailsView

urlpatterns = [
    path('session-enrollments/', SessionEnrollmentCombinationsView.as_view(), name='session-enrollments'),
    path('email-details/<str:combination_id>/', EmailDetailsView.as_view(), name='email-details'),
]
