from django.urls import path
from activity.views.cancellations import (
    CancellationListView,
    CancellationCreateView,
    CancellationDeleteView,
    CancellationForDateView
)

urlpatterns = [
    path('cancellations/', CancellationListView.as_view(), name='cancellation-list'),
    path('cancellations/create/', CancellationCreateView.as_view(), name='cancellation-create'),
    path('cancellations/<int:pk>/delete/', CancellationDeleteView.as_view(), name='cancellation-delete'),
    path('cancellations/for-date/', CancellationForDateView.as_view(), name='cancellation-for-date'),
]
