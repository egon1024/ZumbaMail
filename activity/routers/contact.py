from django.urls import path
from activity.views import (
    ContactListView,
    ContactDetailView,
    ContactCreateView,
    ContactDeleteView,
)

urlpatterns = [
    path('contacts/', ContactListView.as_view(), name='contact-list'),
    path('contacts/new/', ContactCreateView.as_view(), name='contact-create'),
    path('contacts/<int:pk>/', ContactDetailView.as_view(), name='contact-detail'),
    path('contacts/<int:pk>/delete/', ContactDeleteView.as_view(), name='contact-delete'),
]
