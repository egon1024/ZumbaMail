from django.contrib import admin
from django.urls import path, include
from activity import api
from activity.views import OrganizationListCreateView, ContactListView, OrganizationDetailsView, ContactDetailView, OrganizationUpdateView, OrganizationSoftDeleteView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/user/', api.user_info, name='user_info'),
    path('api/organizations/', OrganizationListCreateView.as_view(), name='organization-list-create'),
    path('api/organizations/<int:pk>/details/', OrganizationDetailsView.as_view(), name='organization-details'),
    path('api/organizations/<int:pk>/', OrganizationUpdateView.as_view(), name='organization-update'),
    path('api/organizations/<int:pk>/soft_delete/', OrganizationSoftDeleteView.as_view(), name='organization-soft-delete'),
    path('api/contacts/', ContactListView.as_view(), name='contact-list'),
    path('api/contacts/<int:pk>/', ContactDetailView.as_view(), name='contact-detail'),
]
