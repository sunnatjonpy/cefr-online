const API_BASE = window.CEFR_API_BASE || "/api";
const TOKEN_KEY = "cefr_token";
const USER_KEY = "cefr_current_user";

const SECTION_LABELS = {
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  speaking: "Speaking"
};

const qs = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const getToken = () => localStorage.getItem(TOKEN_KEY);

const getCurrentUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const setAuth = (user, token) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_KEY, token);
};

const clearAuth = () => {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
};

const apiRequest = async (path, options = {}) => {
  const method = options.method || "GET";
  const token = getToken();
  const headers = { "Content-Type": "application/json" };

  if (options.auth !== false && token) {
    headers.Authorization = `Token ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (response.status === 401) {
    clearAuth();
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data && data.error ? data.error : "Request failed";
    throw new Error(message);
  }

  return data;
};

const login = async (email, password) => {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false
  });
  setAuth(data.user, data.token);
  return data.user;
};

const signup = async (name, email, password) => {
  const data = await apiRequest("/auth/signup", {
    method: "POST",
    body: { name, email, password },
    auth: false
  });
  setAuth(data.user, data.token);
  return data.user;
};

const logout = async () => {
  try {
    await apiRequest("/auth/logout", { method: "POST" });
  } catch {
    // ignore
  }
  clearAuth();
  window.location.href = "/login";
};

const requireAuth = () => {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "/login";
    return null;
  }
  return user;
};

const requireAdmin = () => {
  const user = requireAuth();
  if (!user || user.role !== "admin") {
    window.location.href = "/dashboard";
    return null;
  }
  return user;
};

const renderHeader = () => {
  const container = qs("#site-header");
  if (!container) return;
  const user = getCurrentUser();
  const isAdmin = user && user.role === "admin";

  container.innerHTML = `
    <nav class="nav">
      <div class="nav-brand">
        <span>CEFR Mock Taker</span>
        <span class="nav-pill">v1</span>
      </div>
      <div class="nav-links">
        <a href="/dashboard">Dashboard</a>
        <a href="/mock">Take a Mock</a>
        <a href="/vocabulary">Vocabulary</a>
        <a href="/grammar">Grammar</a>
        <a href="/tutorials">Tutorials</a>
        ${isAdmin ? '<a href="/admin-panel">Admin</a>' : ""}
      </div>
      <div class="nav-actions">
        ${user ? `<span class="nav-pill">${user.name}</span>` : ""}
        ${user ? '<button class="btn btn-outline" id="logout-btn">Logout</button>' : '<a class="btn btn-outline" href="/login">Login</a>'}
      </div>
    </nav>
  `;

  const logoutBtn = qs("#logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);
};
const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return iso;
  }
};

const initLoginPage = () => {
  // Always require a fresh login when landing on the site.
  clearAuth();

  const form = qs("#login-form");
  const msg = qs("#login-msg");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.style.display = "none";
    try {
      const email = qs("#email").value.trim();
      const password = qs("#password").value.trim();
      await login(email, password);
      window.location.href = "/dashboard";
    } catch (err) {
      msg.textContent = err.message || "Login failed.";
      msg.style.display = "block";
    }
  });
};

const initSignupPage = () => {
  const user = getCurrentUser();
  if (user) {
    window.location.href = "/dashboard";
    return;
  }

  const form = qs("#signup-form");
  const msg = qs("#signup-msg");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.style.display = "none";
    try {
      const name = qs("#name").value.trim();
      const email = qs("#email").value.trim();
      const password = qs("#password").value.trim();
      await signup(name, email, password);
      window.location.href = "/dashboard";
    } catch (err) {
      msg.textContent = err.message || "Signup failed.";
      msg.style.display = "block";
    }
  });
};

const initDashboardPage = async () => {
  const user = requireAuth();
  if (!user) return;

  const nameEl = qs("#user-name");
  if (nameEl) nameEl.textContent = user.name;

  qsa("[data-role='admin-only']").forEach((el) => {
    el.style.display = user.role === "admin" ? "block" : "none";
  });

  const list = qs("#recent-attempts");
  if (!list) return;

  try {
    const attempts = await apiRequest("/attempts");
    if (!attempts || attempts.length === 0) {
      list.innerHTML = '<div class="notice">No attempts yet. Start a mock test to see progress.</div>';
      return;
    }
    const items = attempts
      .slice(0, 4)
      .map((a) => {
        return `
          <div class="list-item">
            <strong>${a.testId ? `Mock Test #${a.testId}` : "Mock Test"}</strong>
            <span class="badge">${SECTION_LABELS[a.section] || a.section}</span>
            <span>Score: ${a.score ?? "Self"}</span>
            <span>${formatDate(a.createdAt)}</span>
          </div>
        `;
      })
      .join("");
    list.innerHTML = items;
  } catch (err) {
    list.innerHTML = `<div class="notice">${err.message || "Failed to load attempts."}</div>`;
  }
};

const initSectionPage = async () => {
  const user = requireAuth();
  if (!user) return;

  const section = new URLSearchParams(window.location.search).get("/section") || "reading";
  const header = qs("#section-title");
  if (header) header.textContent = `${SECTION_LABELS[section] || section} Tests`;

  const grid = qs("#tests-grid");
  if (!grid) return;

  try {
    const tests = await apiRequest(`/tests?section=${section}`);
    if (!tests || tests.length === 0) {
      grid.innerHTML = '<div class="notice">No tests available yet. Ask an admin to add more.</div>';
      return;
    }

    grid.innerHTML = tests
      .map(
        (t, idx) => `
        <a class="card" href="/test?section=${section}&id=${t.id}" style="--delay:${idx * 0.05}s">
          <span class="tag">${SECTION_LABELS[section]}</span>
          <h3>${t.title}</h3>
          <p>${t.type === "mcq" ? "Multiple choice" : "Performance prompt"}</p>
          <span class="chip">Start Test</span>
          <span class="accent"></span>
        </a>
      `
      )
      .join("");
  } catch (err) {
    grid.innerHTML = `<div class="notice">${err.message || "Failed to load tests."}</div>`;
  }
};

const initTestPage = async () => {
  const user = requireAuth();
  if (!user) return;

  const params = new URLSearchParams(window.location.search);
  const testId = params.get("id");
  const container = qs("#test-container");
  if (!container) return;

  try {
    const test = await apiRequest(`/tests/${testId}`);
    container.innerHTML = `
      <div class="hero">
        <h1>${test.title}</h1>
        <p>${SECTION_LABELS[test.section]} mock test - ${test.type === "mcq" ? "MCQ" : "Prompt"}</p>
      </div>
      ${test.passage ? `<div class="list-item"><strong>Passage / Script</strong><p>${test.passage}</p></div>` : ""}
      ${test.prompt ? `<div class="list-item"><strong>Prompt</strong><p>${test.prompt}</p></div>` : ""}
      ${test.rubric ? `<div class="list-item"><strong>Rubric</strong><p>${test.rubric}</p></div>` : ""}
      <form class="form" id="test-form"></form>
      <div id="test-msg" class="notice" style="display:none"></div>
    `;

    const form = qs("#test-form");
    const msg = qs("#test-msg");

    if (test.type === "mcq") {
      form.innerHTML =
        (test.questions || [])
          .map((q, idx) => {
            const type = q.type || "mcq";
            const options =
              q.options && q.options.length
                ? q.options
                : type === "tfng"
                  ? ["True", "False", "Not Given"]
                  : [];
            const typeLabel =
              type === "tfng" ? "True/False/Not Given" : type === "heading" ? "Matching Headings" : "MCQ";
            return `
          <div class="list-item">
            <strong>Q${idx + 1}. ${q.text}</strong>
            <span class="badge">${typeLabel}</span>
            ${options
              .map(
                (opt, optIdx) => `
                <label>
                  <input type="radio" name="${q.id}" value="${optIdx}" /> ${opt}
                </label>
              `
              )
              .join("")}
          </div>
        `;
          })
          .join("") +
        '<button class="btn btn-primary" type="submit">Submit Answers</button>';

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        msg.style.display = "none";

        const answers = [];
        let correct = 0;
        let complete = true;

        test.questions.forEach((q) => {
          const selected = form.querySelector(`input[name='${q.id}']:checked`);
          if (!selected) {
            complete = false;
            return;
          }
          const selectedIndex = Number(selected.value);
          answers.push({ questionId: q.id, selectedIndex });
          if (selectedIndex === q.answerIndex) correct += 1;
        });

        if (!complete) {
          msg.textContent = "Please answer all questions.";
          msg.style.display = "block";
          return;
        }

        const score = `${correct} / ${test.questions.length}`;
        await apiRequest("/attempts", {
          method: "POST",
          body: {
            testId: test.id,
            section: test.section,
            type: test.type,
            score,
            answers
          }
        });

        test.questions.forEach((q) => {
          const selected = form.querySelector(`input[name='${q.id}']:checked`);
          const card = selected ? selected.closest(".list-item") : null;
          if (!card) return;
          const selectedIndex = Number(selected.value);
          if (selectedIndex === q.answerIndex) {
            card.classList.add("correct");
            card.classList.remove("wrong");
          } else {
            card.classList.add("wrong");
            card.classList.remove("correct");
          }
        });

        msg.textContent = `Saved! Your score is ${score}.`;
        msg.style.display = "block";
      });
    } else {
      form.innerHTML = `
        <label>Your response</label>
        <textarea id="response" placeholder="Write or outline your answer..."></textarea>
        <label>Self-score (0-30)</label>
        <input type="number" id="self-score" min="0" max="30" value="20" />
        <button class="btn btn-primary" type="submit">Save Attempt</button>
      `;

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        msg.style.display = "none";
        const response = qs("#response").value.trim();
        const score = Number(qs("#self-score").value || 0);

        await apiRequest("/attempts", {
          method: "POST",
          body: {
            testId: test.id,
            section: test.section,
            type: test.type,
            score,
            response
          }
        });

        msg.textContent = "Saved! Your response has been recorded.";
        msg.style.display = "block";
        form.reset();
      });
    }
  } catch (err) {
    container.innerHTML = `<div class="notice">${err.message || "Test not found."}</div>`;
  }
};

const initVocabularyPage = async () => {
  const user = requireAuth();
  if (!user) return;

  const list = qs("#vocab-list");
  if (!list) return;

  try {
    const sets = await apiRequest("/vocab");
    list.innerHTML = sets
      .map(
        (set, idx) => `
        <div class="card" style="--delay:${idx * 0.05}s">
          <span class="tag">${set.level}</span>
          <h3>${set.title}</h3>
          <p>${set.words.join(", ")}</p>
          <span class="chip">${set.words.length} words</span>
          <span class="accent"></span>
        </div>
      `
      )
      .join("");
  } catch (err) {
    list.innerHTML = `<div class="notice">${err.message || "Failed to load vocabulary."}</div>`;
  }
};

const initGrammarPage = async () => {
  const user = requireAuth();
  if (!user) return;

  const list = qs("#grammar-list");
  if (!list) return;

  try {
    const lessons = await apiRequest("/grammar");
    list.innerHTML = lessons
      .map(
        (lesson, idx) => `
        <div class="list-item" style="--delay:${idx * 0.05}s">
          <strong>${lesson.title}</strong>
          <span class="badge">${lesson.level}</span>
          <p>${lesson.content}</p>
        </div>
      `
      )
      .join("");
  } catch (err) {
    list.innerHTML = `<div class="notice">${err.message || "Failed to load grammar lessons."}</div>`;
  }
};

const initTutorialsPage = () => {
  const user = requireAuth();
  if (!user) return;
};

const initProfilePage = async () => {
  const user = requireAuth();
  if (!user) return;

  const nameEl = qs("#profile-name");
  const emailEl = qs("#profile-email");
  if (nameEl) nameEl.textContent = user.name;
  if (emailEl) emailEl.textContent = user.email;

  const list = qs("#attempts-list");
  if (!list) return;

  try {
    const attempts = await apiRequest("/attempts");
    if (!attempts || attempts.length === 0) {
      list.innerHTML = '<div class="notice">No attempts yet.</div>';
      return;
    }

    list.innerHTML = attempts
      .map((a) => {
        return `
          <div class="list-item">
            <strong>${a.testId ? `Mock Test #${a.testId}` : "Mock Test"}</strong>
            <span class="badge">${SECTION_LABELS[a.section] || a.section}</span>
            <span>Score: ${a.score ?? "Self"}</span>
            <span>${formatDate(a.createdAt)}</span>
          </div>
        `;
      })
      .join("");
  } catch (err) {
    list.innerHTML = `<div class="notice">${err.message || "Failed to load attempts."}</div>`;
  }
};
const initAdminPage = async () => {
  const user = requireAdmin();
  if (!user) return;

  const usersTable = qs("#users-table");
  try {
    const users = await apiRequest("/users");
    if (usersTable) {
      usersTable.innerHTML = users
        .map(
          (u) => `
          <tr>
            <td>${u.name}</td>
            <td>${u.email}</td>
            <td>${u.role}</td>
            <td>${u.dateJoined ? formatDate(u.dateJoined) : "-"}</td>
          </tr>
        `
        )
        .join("");
    }
  } catch (err) {
    if (usersTable) {
      usersTable.innerHTML = `<tr><td colspan="3">${err.message}</td></tr>`;
    }
  }

  const testForm = qs("#test-form");
  const testMsg = qs("#test-msg");
  const testList = qs("#test-list");
  const questionsSection = qs("#questions-section");
  const questionList = qs("#questions-builder");
  const addQuestionBtn = qs("#add-question");
  let cachedTests = [];

  const questionDefaults = {
    mcq: ["Option A", "Option B", "Option C", "Option D"],
    tfng: ["True", "False", "Not Given"],
    heading: ["Heading A", "Heading B", "Heading C", "Heading D"]
  };

  const normalizeQuestion = (question, index) => {
    const type = question.type || "mcq";
    const options =
      question.options && question.options.length
        ? question.options
        : questionDefaults[type] || questionDefaults.mcq;
    return {
      id: question.id || `q-${Date.now()}-${index}`,
      type,
      text: question.text || "",
      options,
      answerIndex: Number.isInteger(question.answerIndex) ? question.answerIndex : 0
    };
  };

  const updateAnswerSelect = (row) => {
    const answerSelect = qs(".q-answer", row);
    const optionInputs = qsa(".q-option", row);
    const current = answerSelect.value;
    answerSelect.innerHTML = optionInputs
      .map((input, idx) => {
        const label = input.value.trim() || `Option ${idx + 1}`;
        return `<option value="${idx}">${label}</option>`;
      })
      .join("");
    answerSelect.value = current || "0";
  };

  const renderOptions = (row, type, options, answerIndex) => {
    const wrap = qs(".q-options", row);
    const answerSelect = qs(".q-answer", row);
    const fixed = type === "tfng";
    const optionList = options && options.length ? options : questionDefaults[type];

    wrap.innerHTML = optionList
      .map((opt, idx) => {
        const label = type === "heading" ? `Heading ${idx + 1}` : `Option ${idx + 1}`;
        return `
          <div>
            <label>${label}</label>
            <input class="q-option" data-index="${idx}" type="text" value="${opt}" ${
              fixed ? "disabled" : ""
            } />
          </div>
        `;
      })
      .join("");

    answerSelect.innerHTML = optionList
      .map((opt, idx) => `<option value="${idx}">${opt}</option>`)
      .join("");
    answerSelect.value = Number.isInteger(answerIndex) ? String(answerIndex) : "0";

    if (!fixed) {
      wrap.addEventListener("input", () => updateAnswerSelect(row));
    }
  };

  const renderQuestionRow = (question) => {
    if (!questionList) return;
    const q = normalizeQuestion(question, questionList.children.length);
    const row = document.createElement("div");
    row.className = "list-item question-row";
    row.dataset.qid = q.id;
    row.innerHTML = `
      <div class="row">
        <div>
          <label>Type</label>
          <select class="q-type">
            <option value="mcq">MCQ</option>
            <option value="tfng">True/False/Not Given</option>
            <option value="heading">Matching Headings</option>
          </select>
        </div>
        <div>
          <label>Question text</label>
          <input class="q-text" type="text" placeholder="Enter question or statement" />
        </div>
      </div>
      <div class="q-options"></div>
      <div class="row">
        <div>
          <label>Correct answer</label>
          <select class="q-answer"></select>
        </div>
        <div>
          <button class="btn btn-outline q-remove" type="button">Remove</button>
        </div>
      </div>
    `;

    qs(".q-type", row).value = q.type;
    qs(".q-text", row).value = q.text;
    renderOptions(row, q.type, q.options, q.answerIndex);

    qs(".q-type", row).addEventListener("change", (e) => {
      const newType = e.target.value;
      renderOptions(row, newType, questionDefaults[newType], 0);
    });

    qs(".q-remove", row).addEventListener("click", () => {
      row.remove();
    });

    questionList.appendChild(row);
  };

  const setQuestions = (questions) => {
    if (!questionList) return;
    questionList.innerHTML = "";
    if (!questions || questions.length === 0) {
      renderQuestionRow({ type: "mcq" });
      return;
    }
    questions.forEach((q, idx) => renderQuestionRow(normalizeQuestion(q, idx)));
  };

  const collectQuestions = () => {
    if (!questionList) return [];
    return qsa(".question-row", questionList).map((row, idx) => {
      const type = qs(".q-type", row).value;
      const text = qs(".q-text", row).value.trim();
      const options = qsa(".q-option", row).map((input) => input.value.trim());
      const answerIndex = Number(qs(".q-answer", row).value || 0);
      return {
        id: row.dataset.qid || `q-${Date.now()}-${idx}`,
        type,
        text,
        options: options.length ? options : questionDefaults[type],
        answerIndex
      };
    });
  };

  const toggleQuestions = () => {
    if (!questionsSection) return;
    const isMcq = qs("#test-type").value === "mcq";
    questionsSection.style.display = isMcq ? "block" : "none";
    if (isMcq && questionList && questionList.children.length === 0) {
      renderQuestionRow({ type: "mcq" });
    }
  };

  const renderTests = async () => {
    cachedTests = await apiRequest("/tests");
    if (!testList) return;
    testList.innerHTML = cachedTests
      .map(
        (t) => `
        <div class="list-item">
          <strong>${t.title}</strong>
          <span class="badge">${SECTION_LABELS[t.section]}</span>
          <div>
            <button class="btn btn-outline" data-edit-test="${t.id}">Edit</button>
            <button class="btn btn-outline" data-delete-test="${t.id}">Delete</button>
          </div>
        </div>
      `
      )
      .join("");

    qsa("[data-edit-test]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.editTest);
        const test = cachedTests.find((t) => t.id === id);
        if (!test) return;
        qs("#test-id").value = test.id;
        qs("#test-title").value = test.title;
        qs("#test-section").value = test.section;
        qs("#test-type").value = test.type;
        qs("#test-passage").value = test.passage || test.prompt || "";
        setQuestions(test.questions || []);
        qs("#test-rubric").value = test.rubric || "";
        toggleQuestions();
      });
    });

    qsa("[data-delete-test]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = Number(btn.dataset.deleteTest);
        await apiRequest(`/tests/${id}`, { method: "DELETE" });
        await renderTests();
      });
    });
  };

  if (testForm) {
    if (addQuestionBtn) {
      addQuestionBtn.addEventListener("click", () => renderQuestionRow({ type: "mcq" }));
    }

    qs("#test-type").addEventListener("change", toggleQuestions);

    testForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      testMsg.style.display = "none";

      const idRaw = qs("#test-id").value.trim();
      const title = qs("#test-title").value.trim();
      const section = qs("#test-section").value;
      const type = qs("#test-type").value;
      const passage = qs("#test-passage").value.trim();
      const rubric = qs("#test-rubric").value.trim();

      if (!title) {
        testMsg.textContent = "Title is required.";
        testMsg.style.display = "block";
        return;
      }

      let questions = [];
      if (type === "mcq") {
        questions = collectQuestions();
        if (!questions.length) {
          testMsg.textContent = "Please add at least one question.";
          testMsg.style.display = "block";
          return;
        }
        const emptyText = questions.some((q) => !q.text);
        const emptyOption = questions.some((q) => q.options.some((o) => !o));
        if (emptyText || emptyOption) {
          testMsg.textContent = "Please fill all question texts and options.";
          testMsg.style.display = "block";
          return;
        }
      }

      const payload = {
        title,
        section,
        type,
        passage: type === "mcq" ? passage : "",
        prompt: type !== "mcq" ? passage : "",
        questions: type === "mcq" ? questions : [],
        rubric
      };

      if (idRaw) {
        await apiRequest(`/tests/${idRaw}`, { method: "PUT", body: payload });
      } else {
        await apiRequest("/tests", { method: "POST", body: payload });
      }

      testForm.reset();
      setQuestions([]);
      toggleQuestions();
      await renderTests();
      testMsg.textContent = "Saved.";
      testMsg.style.display = "block";
    });

    qs("#test-clear").addEventListener("click", () => {
      testForm.reset();
      setQuestions([]);
      toggleQuestions();
    });
  }

  await renderTests();
  setQuestions([]);
  toggleQuestions();

  const vocabForm = qs("#vocab-form");
  const vocabList = qs("#vocab-admin-list");
  const vocabMsg = qs("#vocab-msg");
  let cachedVocab = [];

  const renderVocab = async () => {
    cachedVocab = await apiRequest("/vocab");
    if (!vocabList) return;
    vocabList.innerHTML = cachedVocab
      .map(
        (set) => `
        <div class="list-item">
          <strong>${set.title}</strong>
          <span class="badge">${set.level}</span>
          <div>
            <button class="btn btn-outline" data-edit-vocab="${set.id}">Edit</button>
            <button class="btn btn-outline" data-delete-vocab="${set.id}">Delete</button>
          </div>
        </div>
      `
      )
      .join("");

    qsa("[data-edit-vocab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.editVocab);
        const set = cachedVocab.find((v) => v.id === id);
        if (!set) return;
        qs("#vocab-id").value = set.id;
        qs("#vocab-title").value = set.title;
        qs("#vocab-level").value = set.level;
        qs("#vocab-words").value = set.words.join(", ");
      });
    });

    qsa("[data-delete-vocab]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = Number(btn.dataset.deleteVocab);
        await apiRequest(`/vocab/${id}`, { method: "DELETE" });
        await renderVocab();
      });
    });
  };

  if (vocabForm) {
    vocabForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      vocabMsg.style.display = "none";
      const idRaw = qs("#vocab-id").value.trim();
      const title = qs("#vocab-title").value.trim();
      const level = qs("#vocab-level").value.trim();
      const wordsRaw = qs("#vocab-words").value.trim();

      if (!title || !level || !wordsRaw) {
        vocabMsg.textContent = "All vocab fields are required.";
        vocabMsg.style.display = "block";
        return;
      }

      const words = wordsRaw
        .split(",")
        .map((w) => w.trim())
        .filter(Boolean);
      const payload = { title, level, words };

      if (idRaw) {
        await apiRequest(`/vocab/${idRaw}`, { method: "PUT", body: payload });
      } else {
        await apiRequest("/vocab", { method: "POST", body: payload });
      }

      vocabForm.reset();
      await renderVocab();
      vocabMsg.textContent = "Saved.";
      vocabMsg.style.display = "block";
    });
  }

  await renderVocab();

  const grammarForm = qs("#grammar-form");
  const grammarList = qs("#grammar-admin-list");
  const grammarMsg = qs("#grammar-msg");
  let cachedGrammar = [];

  const renderGrammar = async () => {
    cachedGrammar = await apiRequest("/grammar");
    if (!grammarList) return;
    grammarList.innerHTML = cachedGrammar
      .map(
        (l) => `
        <div class="list-item">
          <strong>${l.title}</strong>
          <span class="badge">${l.level}</span>
          <div>
            <button class="btn btn-outline" data-edit-grammar="${l.id}">Edit</button>
            <button class="btn btn-outline" data-delete-grammar="${l.id}">Delete</button>
          </div>
        </div>
      `
      )
      .join("");

    qsa("[data-edit-grammar]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.editGrammar);
        const lesson = cachedGrammar.find((g) => g.id === id);
        if (!lesson) return;
        qs("#grammar-id").value = lesson.id;
        qs("#grammar-title").value = lesson.title;
        qs("#grammar-level").value = lesson.level;
        qs("#grammar-content").value = lesson.content;
      });
    });

    qsa("[data-delete-grammar]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = Number(btn.dataset.deleteGrammar);
        await apiRequest(`/grammar/${id}`, { method: "DELETE" });
        await renderGrammar();
      });
    });
  };

  if (grammarForm) {
    grammarForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      grammarMsg.style.display = "none";
      const idRaw = qs("#grammar-id").value.trim();
      const title = qs("#grammar-title").value.trim();
      const level = qs("#grammar-level").value.trim();
      const content = qs("#grammar-content").value.trim();

      if (!title || !level || !content) {
        grammarMsg.textContent = "All grammar fields are required.";
        grammarMsg.style.display = "block";
        return;
      }

      const payload = { title, level, content };

      if (idRaw) {
        await apiRequest(`/grammar/${idRaw}`, { method: "PUT", body: payload });
      } else {
        await apiRequest("/grammar", { method: "POST", body: payload });
      }

      grammarForm.reset();
      await renderGrammar();
      grammarMsg.textContent = "Saved.";
      grammarMsg.style.display = "block";
    });
  }

  await renderGrammar();
};

const initMockPage = () => {
  const user = requireAuth();
  if (!user) return;
};

const initPage = async () => {
  renderHeader();
  const page = document.body.dataset.page;

  switch (page) {
    case "login":
      initLoginPage();
      break;
    case "signup":
      initSignupPage();
      break;
    case "dashboard":
      await initDashboardPage();
      break;
    case "mock":
      initMockPage();
      break;
    case "section":
      await initSectionPage();
      break;
    case "test":
      await initTestPage();
      break;
    case "vocabulary":
      await initVocabularyPage();
      break;
    case "grammar":
      await initGrammarPage();
      break;
    case "tutorials":
      initTutorialsPage();
      break;
    case "profile":
      await initProfilePage();
      break;
    case "admin":
      await initAdminPage();
      break;
    default:
      break;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  initPage().catch((err) => console.error(err));
});





