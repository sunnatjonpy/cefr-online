from django.urls import path

from . import views

urlpatterns = [
    path("auth/signup", views.signup),
    path("auth/login", views.login),
    path("auth/logout", views.logout),
    path("tests", views.tests),
    path("tests/<int:test_id>", views.tests),
    path("vocab", views.vocab_sets),
    path("vocab/<int:vocab_id>", views.vocab_sets),
    path("grammar", views.grammar_lessons),
    path("grammar/<int:lesson_id>", views.grammar_lessons),
    path("attempts", views.attempts),
    path("users", views.users),
    path("ai/writing-check", views.ai_writing_check),
    path("ai/chat", views.ai_chat),
]
