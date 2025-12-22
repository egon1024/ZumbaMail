from django.urls import path
from activity.views import SessionEnrollmentCombinationsView, EmailDetailsView, EmailBlastView

urlpatterns = [
    path('session-enrollments/', SessionEnrollmentCombinationsView.as_view(), name='session-enrollments'),
    path('email-details/<str:combination_id>/', EmailDetailsView.as_view(), name='email-details'),
    path('email-blast/', EmailBlastView.as_view(), name='email-blast'),
]
