import json
import secrets

from django.contrib.auth import authenticate, get_user_model
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import AuthToken, MockTest, VocabSet, GrammarLesson, Attempt

User = get_user_model()


def index(_request):
    return JsonResponse(
        {
            "message": "CEFR API is running.",
            "endpoints": [
                "/api/auth/signup",
                "/api/auth/login",
                "/api/tests",
                "/api/vocab",
                "/api/grammar",
                "/api/attempts",
                "/api/users",
            ],
        }
    )


def json_body(request):
    try:
        return json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return {}


def user_to_dict(user):
    return {
        "id": user.id,
        "name": user.first_name or user.username,
        "email": user.email,
        "role": "admin" if user.is_staff or user.is_superuser else "user",
        "dateJoined": user.date_joined.isoformat() if user.date_joined else None,
    }


def test_to_dict(test):
    return {
        "id": test.id,
        "section": test.section,
        "title": test.title,
        "type": test.type,
        "passage": test.passage,
        "prompt": test.prompt,
        "rubric": test.rubric,
        "questions": test.questions,
    }


def vocab_to_dict(vocab):
    return {
        "id": vocab.id,
        "title": vocab.title,
        "level": vocab.level,
        "words": vocab.words,
    }


def grammar_to_dict(lesson):
    return {
        "id": lesson.id,
        "title": lesson.title,
        "level": lesson.level,
        "content": lesson.content,
    }


def attempt_to_dict(attempt):
    return {
        "id": attempt.id,
        "testId": attempt.test_id,
        "section": attempt.section,
        "type": attempt.type,
        "score": attempt.score,
        "response": attempt.response,
        "answers": attempt.answers,
        "createdAt": attempt.created_at.isoformat(),
    }


def get_token_user(request):
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Token "):
        return None
    key = auth.split(" ", 1)[1].strip()
    if not key:
        return None
    try:
        token = AuthToken.objects.select_related("user").get(key=key)
        return token.user
    except AuthToken.DoesNotExist:
        return None


def require_auth(request):
    user = get_token_user(request)
    if not user:
        return None, JsonResponse({"error": "Unauthorized"}, status=401)
    return user, None


def require_admin(request):
    user, error = require_auth(request)
    if error:
        return None, error
    if not (user.is_staff or user.is_superuser):
        return None, JsonResponse({"error": "Forbidden"}, status=403)
    return user, None


@csrf_exempt
def signup(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    data = json_body(request)
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    name = (data.get("name") or "").strip()

    if not email or not password:
        return JsonResponse({"error": "Email and password are required"}, status=400)

    if User.objects.filter(username=email).exists():
        return JsonResponse({"error": "Email already exists"}, status=400)

    user = User.objects.create_user(username=email, email=email, password=password)
    user.first_name = name or email.split("@", 1)[0]
    user.save(update_fields=["first_name"])

    key = secrets.token_hex(20)
    AuthToken.objects.create(key=key, user=user)

    return JsonResponse({"token": key, "user": user_to_dict(user)})


@csrf_exempt
def login(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    data = json_body(request)
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = authenticate(username=email, password=password)
    if not user:
        return JsonResponse({"error": "Invalid credentials"}, status=401)

    key = secrets.token_hex(20)
    AuthToken.objects.create(key=key, user=user)

    return JsonResponse({"token": key, "user": user_to_dict(user)})


@csrf_exempt
def logout(request):
    user, error = require_auth(request)
    if error:
        return error
    auth = request.headers.get("Authorization", "")
    key = auth.split(" ", 1)[1].strip() if " " in auth else ""
    AuthToken.objects.filter(key=key, user=user).delete()
    return JsonResponse({"ok": True})


@csrf_exempt
def tests(request, test_id=None):
    if request.method == "GET":
        if test_id:
            try:
                test = MockTest.objects.get(id=test_id)
            except MockTest.DoesNotExist:
                return JsonResponse({"error": "Not found"}, status=404)
            return JsonResponse(test_to_dict(test))

        section = request.GET.get("section")
        queryset = MockTest.objects.all().order_by("id")
        if section:
            queryset = queryset.filter(section=section)
        return JsonResponse([test_to_dict(t) for t in queryset], safe=False)

    if request.method == "POST":
        _, error = require_admin(request)
        if error:
            return error
        data = json_body(request)
        test = MockTest.objects.create(
            section=data.get("section", ""),
            title=data.get("title", ""),
            type=data.get("type", ""),
            passage=data.get("passage", ""),
            prompt=data.get("prompt", ""),
            rubric=data.get("rubric", ""),
            questions=data.get("questions", []) or [],
        )
        return JsonResponse(test_to_dict(test), status=201)

    if request.method in ("PUT", "PATCH") and test_id:
        _, error = require_admin(request)
        if error:
            return error
        try:
            test = MockTest.objects.get(id=test_id)
        except MockTest.DoesNotExist:
            return JsonResponse({"error": "Not found"}, status=404)
        data = json_body(request)
        for field in ["section", "title", "type", "passage", "prompt", "rubric", "questions"]:
            if field in data:
                setattr(test, field, data[field])
        test.save()
        return JsonResponse(test_to_dict(test))

    if request.method == "DELETE" and test_id:
        _, error = require_admin(request)
        if error:
            return error
        MockTest.objects.filter(id=test_id).delete()
        return JsonResponse({"ok": True})

    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def vocab_sets(request, vocab_id=None):
    if request.method == "GET":
        if vocab_id:
            try:
                vocab = VocabSet.objects.get(id=vocab_id)
            except VocabSet.DoesNotExist:
                return JsonResponse({"error": "Not found"}, status=404)
            return JsonResponse(vocab_to_dict(vocab))
        return JsonResponse([vocab_to_dict(v) for v in VocabSet.objects.all()], safe=False)

    if request.method == "POST":
        _, error = require_admin(request)
        if error:
            return error
        data = json_body(request)
        vocab = VocabSet.objects.create(
            title=data.get("title", ""),
            level=data.get("level", ""),
            words=data.get("words", []) or [],
        )
        return JsonResponse(vocab_to_dict(vocab), status=201)

    if request.method in ("PUT", "PATCH") and vocab_id:
        _, error = require_admin(request)
        if error:
            return error
        try:
            vocab = VocabSet.objects.get(id=vocab_id)
        except VocabSet.DoesNotExist:
            return JsonResponse({"error": "Not found"}, status=404)
        data = json_body(request)
        for field in ["title", "level", "words"]:
            if field in data:
                setattr(vocab, field, data[field])
        vocab.save()
        return JsonResponse(vocab_to_dict(vocab))

    if request.method == "DELETE" and vocab_id:
        _, error = require_admin(request)
        if error:
            return error
        VocabSet.objects.filter(id=vocab_id).delete()
        return JsonResponse({"ok": True})

    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def grammar_lessons(request, lesson_id=None):
    if request.method == "GET":
        if lesson_id:
            try:
                lesson = GrammarLesson.objects.get(id=lesson_id)
            except GrammarLesson.DoesNotExist:
                return JsonResponse({"error": "Not found"}, status=404)
            return JsonResponse(grammar_to_dict(lesson))
        return JsonResponse([grammar_to_dict(l) for l in GrammarLesson.objects.all()], safe=False)

    if request.method == "POST":
        _, error = require_admin(request)
        if error:
            return error
        data = json_body(request)
        lesson = GrammarLesson.objects.create(
            title=data.get("title", ""),
            level=data.get("level", ""),
            content=data.get("content", ""),
        )
        return JsonResponse(grammar_to_dict(lesson), status=201)

    if request.method in ("PUT", "PATCH") and lesson_id:
        _, error = require_admin(request)
        if error:
            return error
        try:
            lesson = GrammarLesson.objects.get(id=lesson_id)
        except GrammarLesson.DoesNotExist:
            return JsonResponse({"error": "Not found"}, status=404)
        data = json_body(request)
        for field in ["title", "level", "content"]:
            if field in data:
                setattr(lesson, field, data[field])
        lesson.save()
        return JsonResponse(grammar_to_dict(lesson))

    if request.method == "DELETE" and lesson_id:
        _, error = require_admin(request)
        if error:
            return error
        GrammarLesson.objects.filter(id=lesson_id).delete()
        return JsonResponse({"ok": True})

    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def attempts(request):
    user, error = require_auth(request)
    if error:
        return error

    if request.method == "GET":
        attempts_qs = Attempt.objects.filter(user=user).order_by("-created_at")
        return JsonResponse([attempt_to_dict(a) for a in attempts_qs], safe=False)

    if request.method == "POST":
        data = json_body(request)
        test_id = data.get("testId")
        test = None
        if test_id:
            try:
                test = MockTest.objects.get(id=test_id)
            except MockTest.DoesNotExist:
                test = None

        attempt = Attempt.objects.create(
            user=user,
            test=test,
            section=data.get("section", ""),
            type=data.get("type", ""),
            score=str(data.get("score", "")),
            response=data.get("response", ""),
            answers=data.get("answers", []) or [],
        )
        return JsonResponse(attempt_to_dict(attempt), status=201)

    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def users(request):
    _, error = require_admin(request)
    if error:
        return error

    if request.method == "GET":
        data = [user_to_dict(u) for u in User.objects.all().order_by("id")]
        return JsonResponse(data, safe=False)

    return JsonResponse({"error": "Method not allowed"}, status=405)
