from django.urls import path, include

urlpatterns = [
    path('', include('activity.routers.organization')),
    path('', include('activity.routers.contact')),
    path('', include('activity.routers.session')),
    path('', include('activity.routers.student')),
]
