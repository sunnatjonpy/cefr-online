"""
URL configuration for cefr_api project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
from django.views.generic import TemplateView

urlpatterns = [
    path('', TemplateView.as_view(template_name='index.html')),
    path('index.html', TemplateView.as_view(template_name='index.html')),
    path('signup.html', TemplateView.as_view(template_name='signup.html')),
    path('dashboard.html', TemplateView.as_view(template_name='dashboard.html')),
    path('mock.html', TemplateView.as_view(template_name='mock.html')),
    path('section.html', TemplateView.as_view(template_name='section.html')),
    path('test.html', TemplateView.as_view(template_name='test.html')),
    path('vocabulary.html', TemplateView.as_view(template_name='vocabulary.html')),
    path('grammar.html', TemplateView.as_view(template_name='grammar.html')),
    path('tutorials.html', TemplateView.as_view(template_name='tutorials.html')),
    path('profile.html', TemplateView.as_view(template_name='profile.html')),
    path('admin.html', TemplateView.as_view(template_name='admin.html')),
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]
