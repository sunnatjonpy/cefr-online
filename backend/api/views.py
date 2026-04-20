import json
import os
import secrets
import urllib.error
import urllib.parse
import urllib.request

from django.contrib.auth import authenticate, get_user_model
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

try:
    import winreg
except Exception:  # pragma: no cover - non-Windows platforms
    winreg = None

try:
    from openai import OpenAI, RateLimitError
except Exception:  # pragma: no cover - optional dependency
    OpenAI = None
    RateLimitError = Exception

from .models import AuthToken, MockTest, VocabSet, GrammarLesson, Attempt

User = get_user_model()
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
ENV_FILE = os.path.join(BASE_DIR, ".env")
DOTENV_CACHE = None


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
                "/api/ai/writing-check",
            ],
        }
    )


def json_body(request):
    try:
        return json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return {}


def call_ollama(prompt, model, base_url):
    url = f"{base_url.rstrip('/')}/api/generate"
    payload = json.dumps({"model": model, "prompt": prompt, "stream": False}).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=120) as resp:
        raw = resp.read().decode("utf-8")
    data = json.loads(raw or "{}")
    return (data.get("response") or "").strip()


def call_gemini(system_prompt, user_prompt, model, api_key, response_mime_type="text/plain"):
    encoded_model = urllib.parse.quote(f"models/{model}", safe="/")
    url = f"https://generativelanguage.googleapis.com/v1beta/{encoded_model}:generateContent?key={urllib.parse.quote(api_key)}"
    payload = {
        "systemInstruction": {
            "parts": [{"text": system_prompt}],
        },
        "contents": [
            {
                "parts": [{"text": user_prompt}],
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 1200,
            "response_mime_type": response_mime_type,
        },
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            raw = resp.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        try:
            data = json.loads(raw or "{}")
            message = data.get("error", {}).get("message") or raw
        except json.JSONDecodeError:
            message = raw or str(exc)
        raise RuntimeError(message) from exc

    data = json.loads(raw or "{}")
    parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    return "".join(part.get("text", "") for part in parts).strip()


def get_env_value(name):
    value = os.getenv(name)
    if value:
        return value

    global DOTENV_CACHE
    if DOTENV_CACHE is None:
        DOTENV_CACHE = {}
        if os.path.exists(ENV_FILE):
            try:
                with open(ENV_FILE, "r", encoding="utf-8") as handle:
                    for raw_line in handle:
                        line = raw_line.strip()
                        if not line or line.startswith("#") or "=" not in line:
                            continue
                        key, val = line.split("=", 1)
                        key = key.strip()
                        val = val.strip().strip('"').strip("'")
                        if key:
                            DOTENV_CACHE[key] = val
            except OSError:
                DOTENV_CACHE = {}

    value = DOTENV_CACHE.get(name)
    if value:
        return value

    if winreg is None:
        return ""

    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as key:
            value, _ = winreg.QueryValueEx(key, name)
            return value or ""
    except OSError:
        return ""


def resolve_ai_provider():
    provider = (get_env_value("AI_PROVIDER") or "").strip().lower()
    if provider:
        return provider
    if get_env_value("GROQ_API_KEY"):
        return "groq"
    if get_env_value("GEMINI_API_KEY"):
        return "gemini"
    if get_env_value("OPENAI_API_KEY"):
        return "openai"
    return "groq"


def call_groq_chat(system_prompt, user_prompt, model, api_key):
    if OpenAI is not None:
        client = OpenAI(api_key=api_key, base_url="https://api.groq.com/openai/v1")
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
        )
        return (response.choices[0].message.content or "").strip()

    url = "https://api.groq.com/openai/v1/chat/completions"
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
            "User-Agent": "CEFR-Online/1.0",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            raw = resp.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        try:
            data = json.loads(raw or "{}")
            message = data.get("error", {}).get("message") or raw
        except json.JSONDecodeError:
            message = raw or str(exc)
        raise RuntimeError(message) from exc

    data = json.loads(raw or "{}")
    return (
        data.get("choices", [{}])[0]
        .get("message", {})
        .get("content", "")
        .strip()
    )


def call_openai_text(system_prompt, user_prompt, model):
    if OpenAI is None:
        raise RuntimeError("OpenAI SDK is not installed on the server")
    api_key = get_env_value("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured on the server")

    client = OpenAI(api_key=api_key)
    response = client.responses.create(
        model=model,
        input=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )
    output_text = getattr(response, "output_text", None)
    if not output_text:
        try:
            output_text = response.output[0].content[0].text
        except Exception:
            output_text = ""
    return (output_text or "").strip()


def call_ai_text(system_prompt, user_prompt, response_mime_type="text/plain"):
    provider = resolve_ai_provider()

    if provider == "groq":
        api_key = get_env_value("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY is not configured on the server")
        model = get_env_value("GROQ_MODEL") or "llama-3.3-70b-versatile"
        try:
            return call_groq_chat(system_prompt, user_prompt, model, api_key)
        except Exception as exc:
            message = str(exc)
            if "quota" in message.lower() or "rate limit" in message.lower() or "429" in message:
                raise RuntimeError("Groq quota exceeded or rate limited. Please check your Groq usage.") from exc
            raise RuntimeError(f"Groq request failed: {message}") from exc

    if provider == "openai":
        model = get_env_value("OPENAI_WRITING_MODEL") or "gpt-4.1"
        try:
            return call_openai_text(system_prompt, user_prompt, model)
        except RateLimitError as exc:
            raise RuntimeError("AI quota exceeded. Please check your OpenAI billing/credits.") from exc
        except Exception as exc:
            raise RuntimeError(f"AI request failed: {exc}") from exc

    if provider == "gemini":
        api_key = get_env_value("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured on the server")
        model = get_env_value("GEMINI_MODEL") or "gemini-2.0-flash"
        try:
            return call_gemini(system_prompt, user_prompt, model, api_key, response_mime_type)
        except Exception as exc:
            message = str(exc)
            if "quota" in message.lower() or "rate limit" in message.lower() or "429" in message:
                raise RuntimeError("Gemini quota exceeded or rate limited. Please check your Google AI usage.") from exc
            raise RuntimeError(f"Gemini request failed: {message}") from exc

    if provider == "ollama":
        base_url = get_env_value("OLLAMA_BASE_URL") or "http://localhost:11434"
        model = get_env_value("OLLAMA_MODEL") or "llama3.1"
        prompt = f"{system_prompt}\n\n{user_prompt}"
        try:
            return call_ollama(prompt, model, base_url)
        except Exception as exc:
            raise RuntimeError(f"Local AI request failed: {exc}") from exc

    raise RuntimeError(f"Unsupported AI provider: {provider}")


def score_to_cefr(score):
    try:
        score = int(score)
    except (TypeError, ValueError):
        return ""
    if 1 <= score <= 18:
        return "A1"
    if 19 <= score <= 37:
        return "A2"
    if 38 <= score <= 50:
        return "B1"
    if 51 <= score <= 64:
        return "B2"
    if 65 <= score <= 75:
        return "C1"
    return ""


def normalize_writing_assessment(data):
    score = data.get("score")
    try:
        score = int(score)
    except (TypeError, ValueError):
        score = None

    cefr_level = score_to_cefr(score)
    return {
        "score": score,
        "cefr_level": cefr_level or data.get("cefr_level") or data.get("band") or "",
        "task_match": data.get("task_match") or data.get("task_response") or "",
        "task_match_reason": data.get("task_match_reason") or data.get("task_response_reason") or "",
        "grammar_feedback": data.get("grammar_feedback") or data.get("grammar") or "",
        "vocabulary_feedback": data.get("vocabulary_feedback") or data.get("vocabulary") or "",
        "coherence_feedback": data.get("coherence_feedback") or data.get("coherence") or "",
        "strengths": data.get("strengths") or [],
        "improvements": data.get("improvements") or [],
        "suggested_rewrite": data.get("suggested_rewrite") or "",
    }


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


@csrf_exempt
def ai_writing_check(request):
    user, error = require_auth(request)
    if error:
        return error

    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    data = json_body(request)
    response_text = (data.get("response") or "").strip()
    prompt_text = (data.get("prompt") or "").strip()
    rubric_text = (data.get("rubric") or "").strip()

    if not response_text:
        return JsonResponse({"error": "Response text is required"}, status=400)

    system_prompt = (
        "You are an English writing evaluator for CEFR-style tasks. "
        "Check whether the whole text matches the task theme/title, then assess grammar, vocabulary, and coherence. "
        "Return ONLY valid JSON with these keys: "
        "score (integer 1-75), "
        "task_match (one of: Match, Partly match, Does not match), "
        "task_match_reason (short string), "
        "grammar_feedback (short string), "
        "vocabulary_feedback (short string), "
        "coherence_feedback (short string), "
        "strengths (array of short strings), "
        "improvements (array of short strings), "
        "suggested_rewrite (short improved version, optional). "
        "Do not include markdown."
    )

    user_prompt = f"Task prompt:\n{prompt_text}\n\nRubric:\n{rubric_text}\n\nStudent response:\n{response_text}"

    try:
        output_text = call_ai_text(
            f"{system_prompt}\nReturn ONLY JSON.",
            user_prompt,
            "application/json",
        )
    except Exception as exc:
        message = str(exc)
        if "quota exceeded" in message.lower() or "rate limited" in message.lower():
            return JsonResponse({"error": message}, status=429)
        if "not configured on the server" in message.lower():
            return JsonResponse({"error": message}, status=500)
        return JsonResponse({"error": message}, status=502)

    output_text = (output_text or "").strip()
    if not output_text:
        return JsonResponse({"error": "AI response was empty"}, status=502)

    try:
        parsed = json.loads(output_text)
    except json.JSONDecodeError:
        return JsonResponse({"raw": output_text}, status=200)

    return JsonResponse(normalize_writing_assessment(parsed), status=200)


@csrf_exempt
def ai_chat(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    data = json_body(request)
    message = (data.get("message") or "").strip()
    history = data.get("history") or []

    if not message:
        return JsonResponse({"error": "Message is required"}, status=400)

    clean_history = []
    for item in history[-6:]:
        role = (item.get("role") or "").strip().lower()
        content = (item.get("content") or "").strip()
        if role in {"user", "assistant"} and content:
            clean_history.append({"role": role, "content": content[:1000]})

    history_block = "\n".join(
        f"{entry['role'].title()}: {entry['content']}" for entry in clean_history
    )
    system_prompt = (
        "You are CEFR Online Assistant, a concise and friendly study helper for English learners. "
        "Help with CEFR, IELTS-style tasks, grammar, vocabulary, reading, listening, writing, and site navigation. "
        "Keep answers practical, short, and easy to understand. "
        "Detect the user's language from the latest message and reply in that same language. "
        "If the user writes in Uzbek, reply in Uzbek. If the user writes in Russian, reply in Russian. "
        "If asked about unavailable features, say so clearly."
    )
    user_prompt = (
        f"Conversation so far:\n{history_block or 'No previous messages.'}\n\n"
        f"Latest user message:\n{message}\n\n"
        "Reply as the assistant in plain text only."
    )

    try:
        reply = call_ai_text(system_prompt, user_prompt)
    except Exception as exc:
        message = str(exc)
        if "quota exceeded" in message.lower() or "rate limited" in message.lower():
            return JsonResponse({"error": message}, status=429)
        if "not configured on the server" in message.lower():
            return JsonResponse({"error": message}, status=500)
        return JsonResponse({"error": message}, status=502)

    if not reply:
        return JsonResponse({"error": "AI response was empty"}, status=502)

    return JsonResponse({"reply": reply}, status=200)
