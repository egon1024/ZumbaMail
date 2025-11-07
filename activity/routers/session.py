from django.urls import path
from activity.views import SessionListView, SessionDetailView, SessionUpdateView

urlpatterns = [
    path('sessions/', SessionListView.as_view(), name='session-list'),
    path('sessions/<int:pk>/', SessionDetailView.as_view(), name='session-detail'),
    path('sessions/<int:pk>/update/', SessionUpdateView.as_view(), name='session-update'),
]
