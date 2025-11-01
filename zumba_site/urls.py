from django.contrib import admin
from django.urls import path, include
from activity import api
from activity.views import OrganizationListView, ContactListView, OrganizationDetailsView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/user/', api.user_info, name='user_info'),
    path('api/organizations/', OrganizationListView.as_view(), name='organization-list'),
    path('api/organizations/<int:id>/details/', OrganizationDetailsView.as_view(), name='organization-details'),
    path('api/contacts/', ContactListView.as_view(), name='contact-list'),
]
