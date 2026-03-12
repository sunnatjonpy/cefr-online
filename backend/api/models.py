from ckeditor.fields import RichTextField
from django.conf import settings
from django.db import models


class AuthToken(models.Model):
    key = models.CharField(max_length=40, unique=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user_id}:{self.key}"


class MockTest(models.Model):
    section = models.CharField(max_length=20)
    title = models.CharField(max_length=200)
    type = models.CharField(max_length=20)
    passage = RichTextField(blank=True)
    prompt = RichTextField(blank=True)
    rubric = RichTextField(blank=True)
    questions = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class VocabSet(models.Model):
    title = models.CharField(max_length=200)
    level = models.CharField(max_length=20)
    words = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class GrammarLesson(models.Model):
    title = models.CharField(max_length=200)
    level = models.CharField(max_length=20)
    content = RichTextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Attempt(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    test = models.ForeignKey(MockTest, on_delete=models.SET_NULL, null=True, blank=True)
    section = models.CharField(max_length=20)
    type = models.CharField(max_length=20)
    score = models.CharField(max_length=50, blank=True)
    response = models.TextField(blank=True)
    answers = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user_id}:{self.section}:{self.created_at}"
