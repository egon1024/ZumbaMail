from django.contrib import admin
from django.urls import path, include
from activity import api
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/user/', api.user_info, name='user_info'),
    path('api/', include('activity.urls.organization_urls')),
    path('api/', include('activity.urls.contact_urls')),
    path('api/', include('activity.urls.session_urls')),
    path('api/', include('activity.urls.student_urls')),
]
