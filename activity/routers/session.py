from django.urls import path
from activity.views import SessionListView, SessionDetailView, SessionUpdateView, SessionCreateView, SessionCopyActivitiesView

urlpatterns = [
    path('sessions/', SessionListView.as_view(), name='session-list'),
    path('sessions/new/', SessionCreateView.as_view(), name='session-create'),
    path('sessions/<int:pk>/', SessionDetailView.as_view(), name='session-detail'),
    path('sessions/<int:pk>/update/', SessionUpdateView.as_view(), name='session-update'),
    path('sessions/<int:pk>/copy_activities/', SessionCopyActivitiesView.as_view(), name='session-copy-activities'),
]
