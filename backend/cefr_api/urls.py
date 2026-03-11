from django.contrib import admin
from django.urls import include, path
from django.views.generic import TemplateView
from django.views.generic.base import RedirectView

urlpatterns = [
    path("", RedirectView.as_view(url="/login", permanent=False)),
    path("login", TemplateView.as_view(template_name="index.html"), name="login"),
    path("signup", TemplateView.as_view(template_name="signup.html"), name="signup"),
    path("dashboard", TemplateView.as_view(template_name="dashboard.html"), name="dashboard"),
    path("mock", TemplateView.as_view(template_name="mock.html"), name="mock"),
    path("section", TemplateView.as_view(template_name="section.html"), name="section"),
    path("test", TemplateView.as_view(template_name="test.html"), name="test"),
    path("vocabulary", TemplateView.as_view(template_name="vocabulary.html"), name="vocabulary"),
    path("grammar", TemplateView.as_view(template_name="grammar.html"), name="grammar"),
    path("tutorials", TemplateView.as_view(template_name="tutorials.html"), name="tutorials"),
    path("profile", TemplateView.as_view(template_name="profile.html"), name="profile"),
    path("admin-panel", TemplateView.as_view(template_name="admin.html"), name="admin_panel"),
    path("index.html", RedirectView.as_view(url="/login", permanent=False)),
    path("admin.html", RedirectView.as_view(url="/admin-panel", permanent=False)),
    path("signup.html", RedirectView.as_view(url="/signup", permanent=False)),
    path("dashboard.html", RedirectView.as_view(url="/dashboard", permanent=False)),
    path("mock.html", RedirectView.as_view(url="/mock", permanent=False)),
    path("section.html", RedirectView.as_view(url="/section", permanent=False)),
    path("test.html", RedirectView.as_view(url="/test", permanent=False)),
    path("vocabulary.html", RedirectView.as_view(url="/vocabulary", permanent=False)),
    path("grammar.html", RedirectView.as_view(url="/grammar", permanent=False)),
    path("tutorials.html", RedirectView.as_view(url="/tutorials", permanent=False)),
    path("profile.html", RedirectView.as_view(url="/profile", permanent=False)),
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]
