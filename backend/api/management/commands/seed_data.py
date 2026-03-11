from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from api.models import MockTest, VocabSet, GrammarLesson

User = get_user_model()


class Command(BaseCommand):
    help = "Seed initial admin user and demo content"

    def handle(self, *args, **options):
        admin_email = "admin@cefr.uz"
        admin_password = "Admin123!"
        admin_user, created = User.objects.get_or_create(username=admin_email, defaults={"email": admin_email})
        if created:
            admin_user.set_password(admin_password)
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.first_name = "CEFR Admin"
            admin_user.save()
            self.stdout.write(self.style.SUCCESS("Created admin user"))
        else:
            if not admin_user.is_staff:
                admin_user.is_staff = True
                admin_user.is_superuser = True
                admin_user.save(update_fields=["is_staff", "is_superuser"])
            self.stdout.write(self.style.WARNING("Admin user already exists"))

        tests = [
            {
                "section": "reading",
                "title": "Test 1: Urban Rhythms",
                "type": "mcq",
                "passage": "Cities speak in patterns. From the early-morning bakery lines to the late-night tram bells, urban life is a layered rhythm of sound and light. Researchers who study walkable cities have found that people tend to cluster around short routes that offer predictable stops. This predictability lowers stress and makes streets feel safer. Yet, too much predictability can make city life feel monotonous, which is why planners add plazas, pocket parks, and art installations. These small surprises create micro-moments of attention. The best cities, therefore, feel both steady and alive, balancing routine with discovery.",
                "questions": [
                    {
                        "id": "r1-q1",
                        "text": "What is the main idea of the passage?",
                        "options": [
                            "Cities should remove predictable routes to reduce stress.",
                            "A balance of routine and surprise makes cities feel alive.",
                            "Urban noise causes people to avoid public transport.",
                            "Plazas are the only solution to city monotony.",
                        ],
                        "answerIndex": 1,
                    },
                    {
                        "id": "r1-q2",
                        "text": "Why do planners add plazas and pocket parks?",
                        "options": [
                            "To increase traffic congestion.",
                            "To create unexpected moments of attention.",
                            "To reduce pedestrian movement.",
                            "To make cities more predictable.",
                        ],
                        "answerIndex": 1,
                    },
                ],
            },
            {
                "section": "listening",
                "title": "Test 1: Startup Culture",
                "type": "mcq",
                "passage": "Audio Script: A founder explains how small teams decide priorities. She says that weekly planning is only useful when it leads to quick experiments. Without experiments, meetings become noise. The team uses a simple rule: build, measure, learn. They keep a visible board of assumptions and update it every Friday.",
                "questions": [
                    {
                        "id": "l1-q1",
                        "text": "What does the founder say about weekly planning?",
                        "options": [
                            "It is useless in all cases.",
                            "It matters only when experiments follow.",
                            "It should be replaced by monthly reviews.",
                            "It should be done without metrics.",
                        ],
                        "answerIndex": 1,
                    }
                ],
            },
            {
                "section": "writing",
                "title": "Test 1: Problem-Solution Essay",
                "type": "writing",
                "prompt": "Many cities struggle with traffic congestion. Write an essay explaining two causes of congestion and two solutions. Support your ideas with examples.",
                "rubric": "Evaluate your response on clarity, organization, vocabulary, and grammar.",
            },
            {
                "section": "speaking",
                "title": "Test 1: Personal Experience",
                "type": "speaking",
                "prompt": "Describe a challenging project you completed. Include what made it difficult, how you organized your time, and what you learned.",
                "rubric": "Evaluate your response on fluency, pronunciation, vocabulary, and grammar.",
            },
        ]

        for item in tests:
            test, created = MockTest.objects.get_or_create(title=item["title"], defaults=item)
            if created:
                self.stdout.write(self.style.SUCCESS(f"Added {test.title}"))

        vocab_sets = [
            {
                "title": "Academic Verbs",
                "level": "B2",
                "words": [
                    "analyze",
                    "illustrate",
                    "evaluate",
                    "contrast",
                    "synthesize",
                    "interpret",
                    "justify",
                    "summarize",
                    "predict",
                    "clarify",
                ],
            },
            {
                "title": "Workplace Collaboration",
                "level": "B1",
                "words": [
                    "align",
                    "delegate",
                    "brainstorm",
                    "feedback",
                    "milestone",
                    "ownership",
                    "deadline",
                    "stakeholder",
                    "iteration",
                    "blocker",
                ],
            },
        ]

        for item in vocab_sets:
            vocab, created = VocabSet.objects.get_or_create(title=item["title"], defaults=item)
            if created:
                self.stdout.write(self.style.SUCCESS(f"Added vocab set {vocab.title}"))

        lessons = [
            {
                "title": "Narrative Tenses",
                "level": "B2",
                "content": "Use past simple for main events and past continuous for background actions. Past perfect helps show an earlier past action.",
            },
            {
                "title": "Conditionals Overview",
                "level": "B1",
                "content": "Zero conditional for facts, first conditional for real future, second conditional for unreal present, third conditional for unreal past.",
            },
        ]

        for item in lessons:
            lesson, created = GrammarLesson.objects.get_or_create(title=item["title"], defaults=item)
            if created:
                self.stdout.write(self.style.SUCCESS(f"Added lesson {lesson.title}"))

        self.stdout.write(self.style.SUCCESS("Seeding complete."))
