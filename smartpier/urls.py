from django.contrib import admin
from django.urls import path
from django.contrib.auth import views as auth_views 
from webapp import views       

urlpatterns = [
    #path('admin/', admin.site.urls),
    path('readLiftStatus/', views.readLiftStatus),
    path('', views.action),


]

