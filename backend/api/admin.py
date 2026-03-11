from django.contrib import admin

from .models import AuthToken, MockTest, VocabSet, GrammarLesson, Attempt

admin.site.register(AuthToken)
admin.site.register(MockTest)
admin.site.register(VocabSet)
admin.site.register(GrammarLesson)
admin.site.register(Attempt)
