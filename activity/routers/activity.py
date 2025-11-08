from django.urls import path
from activity.views.activity import ActivityListView, ActivityDetailView, ActivityEnrollmentUpdateView, ActivityTypeChoicesView, ActivityLocationChoicesView, ActivityUpdateView, ActivityCreateView

urlpatterns = [
    path('classes/', ActivityListView.as_view(), name='class-list'),
    path('classes/new/', ActivityCreateView.as_view(), name='class-create'),
    path('activity/<int:pk>/', ActivityDetailView.as_view(), name='activity-detail'),
    path('activity/<int:pk>/edit/', ActivityUpdateView.as_view(), name='activity-update'),
    path('activity/<int:pk>/enrollment/', ActivityEnrollmentUpdateView.as_view(), name='activity-enrollment-update'),
    path('activity/type_choices/', ActivityTypeChoicesView.as_view(), name='activity-type-choices'),
    path('activity/location_choices/', ActivityLocationChoicesView.as_view(), name='activity-location-choices'),
]
