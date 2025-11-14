from django.urls import path
from activity.views import (
    LocationListView,
    LocationDetailView,
    LocationCreateView,
    LocationDeleteView,
)

urlpatterns = [
    path('locations/', LocationListView.as_view(), name='location-list'),
    path('locations/new/', LocationCreateView.as_view(), name='location-create'),
    path('locations/<int:pk>/', LocationDetailView.as_view(), name='location-detail'),
    path('locations/<int:pk>/delete/', LocationDeleteView.as_view(), name='location-delete'),
]
