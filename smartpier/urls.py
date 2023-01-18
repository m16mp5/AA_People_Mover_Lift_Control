from django.contrib import admin
from django.urls import path
from django.contrib.auth import views as auth_views 
from webapp import views       

urlpatterns = [
    #path('admin/', admin.site.urls),
    path('readLiftStatus/', views.readLiftStatus),
    path('press6/', views.press6),
    path('press7/', views.press7),
    path('pressDoorClose/', views.pressDoorClose),
    path('releaseDoorClose/', views.releaseDoorClose),
    path('pressDoorOpen/', views.pressDoorOpen),
    path('releaseDoorOpen/', views.releaseDoorOpen),


]

