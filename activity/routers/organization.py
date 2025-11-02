from django.urls import path
from activity.views import (
    OrganizationListCreateView,
    OrganizationListView,
    OrganizationDetailsView,
    OrganizationUpdateView,
    OrganizationSoftDeleteView,
)

urlpatterns = [
    path('organizations/', OrganizationListCreateView.as_view(), name='organization-list-create'),
    path('organizations/<int:pk>/details/', OrganizationDetailsView.as_view(), name='organization-details'),
    path('organizations/<int:pk>/', OrganizationUpdateView.as_view(), name='organization-update'),
    path('organizations/<int:pk>/soft_delete/', OrganizationSoftDeleteView.as_view(), name='organization-soft-delete'),
]
