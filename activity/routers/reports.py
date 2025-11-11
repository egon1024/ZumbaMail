from django.urls import path
from activity.views import WeeklyReportView, ResidencyReportView

urlpatterns = [
    path('weekly/', WeeklyReportView.as_view(), name='weekly-report'),
    path('residency/', ResidencyReportView.as_view(), name='residency-report'),
]
