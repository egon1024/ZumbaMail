from django.urls import path
from activity.views import WeeklyReportView, ResidencyReportView, EndOfSessionReportView, CumulativeReportView

urlpatterns = [
    path('weekly/', WeeklyReportView.as_view(), name='weekly-report'),
    path('residency/', ResidencyReportView.as_view(), name='residency-report'),
    path('end-of-session/', EndOfSessionReportView.as_view(), name='end-of-session-report'),
    path('cumulative/', CumulativeReportView.as_view(), name='cumulative-report'),
]
