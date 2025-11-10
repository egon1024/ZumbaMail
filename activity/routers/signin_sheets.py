from django.urls import path
from activity.views.signin_sheets import GenerateSignInSheetView

urlpatterns = [
    path('signin-sheet/generate/', GenerateSignInSheetView.as_view(), name='signin-sheet-generate'),
]
