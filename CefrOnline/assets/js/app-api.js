const API_BASE = window.CEFR_API_BASE || "/api";
const TOKEN_KEY = "cefr_token";
const USER_KEY = "cefr_current_user";
const READING_STATE_PREFIX = "cefr_reading_state_";
const SCORE_KEY = "cefr_last_score";
const TIMER_PREFIX = "cefr_timer_";
const THEME_KEY = "cefr_theme";

const SECTION_LABELS = {
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  speaking: "Speaking"
};

const SECTION_TIMERS = {
  reading: 60 * 60,
  listening: 60 * 60,
  writing: 60 * 60
};
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const qs = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const getPreferredTheme = () => {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) return saved;
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
};

const applyTheme = (theme) => {
  const next = theme === "dark" ? "dark" : "light";
  document.body.dataset.theme = next;
  localStorage.setItem(THEME_KEY, next);
  qsa(".theme-toggle-input").forEach((toggle) => {
    toggle.checked = next === "dark";
  });
};

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

const loadJson = (key, fallback = null) => {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const saveJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const removeJson = (key) => {
  localStorage.removeItem(key);
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
    <nav class="nav" id="main-nav">
      <div class="nav-left">
        <div class="nav-brand">
          <span>CEFR</span>
          <span class="nav-pill">online</span>
        </div>
        <div class="nav-toggle-wrap">
          <label class="switch theme-toggle theme-toggle-mobile" aria-label="Toggle theme">
            <input id="theme-toggle-mobile" class="theme-toggle-input" type="checkbox" />
            <span class="slider">
              <div class="star star_1"></div>
              <div class="star star_2"></div>
              <div class="star star_3"></div>
              <svg viewBox="0 0 16 16" class="cloud_1 cloud">
                <path
                  transform="matrix(.77976 0 0 .78395-299.99-418.63)"
                  fill="#fff"
                  d="m391.84 540.91c-.421-.329-.949-.524-1.523-.524-1.351 0-2.451 1.084-2.485 2.435-1.395.526-2.388 1.88-2.388 3.466 0 1.874 1.385 3.423 3.182 3.667v.034h12.73v-.006c1.775-.104 3.182-1.584 3.182-3.395 0-1.747-1.309-3.186-2.994-3.379.007-.106.011-.214.011-.322 0-2.707-2.271-4.901-5.072-4.901-2.073 0-3.856 1.202-4.643 2.925"
                ></path>
              </svg>
            </span>
          </label>
          <button class="nav-toggle" id="nav-toggle" type="button" aria-label="Toggle navigation">
            <span></span>
          </button>
        </div>
      </div>
      <div class="nav-menu" id="nav-menu">
        <div class="nav-links">
          <a href="/dashboard">Dashboard</a>
          <a href="/mock">Take a Mock</a>
          <a href="/tutorials">Tutorials</a>
          ${isAdmin ? '<a href="/admin-panel">Admin</a>' : ""}
        </div>
        <div class="nav-actions">
          ${user ? `<span class="nav-pill">${user.name}</span>` : ""}
          <label class="switch theme-toggle theme-toggle-desktop" aria-label="Toggle theme">
            <input id="theme-toggle-desktop" class="theme-toggle-input" type="checkbox" />
            <span class="slider">
              <div class="star star_1"></div>
              <div class="star star_2"></div>
              <div class="star star_3"></div>
              <svg viewBox="0 0 16 16" class="cloud_1 cloud">
                <path
                  transform="matrix(.77976 0 0 .78395-299.99-418.63)"
                  fill="#fff"
                  d="m391.84 540.91c-.421-.329-.949-.524-1.523-.524-1.351 0-2.451 1.084-2.485 2.435-1.395.526-2.388 1.88-2.388 3.466 0 1.874 1.385 3.423 3.182 3.667v.034h12.73v-.006c1.775-.104 3.182-1.584 3.182-3.395 0-1.747-1.309-3.186-2.994-3.379.007-.106.011-.214.011-.322 0-2.707-2.271-4.901-5.072-4.901-2.073 0-3.856 1.202-4.643 2.925"
                ></path>
              </svg>
            </span>
          </label>
          ${user ? '<button class="btn btn-outline" id="logout-btn">Logout</button>' : '<a class="btn btn-outline" href="/login">Login</a>'}
        </div>
      </div>
    </nav>
  `;

  const logoutBtn = qs("#logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  const nav = qs("#main-nav");
  const toggle = qs("#nav-toggle");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      nav.classList.toggle("is-open");
    });
  }

  applyTheme(getPreferredTheme());
  qsa(".theme-toggle-input").forEach((input) => {
    input.addEventListener("change", (event) => {
      const next = event.target.checked ? "dark" : "light";
      applyTheme(next);
    });
  });
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

  const section = new URLSearchParams(window.location.search).get("section") || "reading";
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

    const sortedTests = tests
      .slice()
      .sort((a, b) => {
        const aMatch = String(a.title || "").match(/\\btest\\s*(\\d+)/i);
        const bMatch = String(b.title || "").match(/\\btest\\s*(\\d+)/i);
        const aNum = aMatch ? Number(aMatch[1]) : null;
        const bNum = bMatch ? Number(bMatch[1]) : null;
        if (aNum !== null && bNum !== null) return aNum - bNum;
        if (aNum !== null) return -1;
        if (bNum !== null) return 1;
        return String(a.title || "").localeCompare(String(b.title || ""));
      });

    grid.innerHTML = sortedTests
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
        <div class="timer" id="section-timer" style="display:none"></div>
      </div>
      ${
        test.passage
          ? `<div class="list-item"><strong>Passage / Script</strong><div class="rich-text" id="passage-container">${test.passage}</div></div>`
          : ""
      }
      ${test.prompt ? `<div class="list-item"><strong>Prompt</strong><div class="rich-text">${test.prompt}</div></div>` : ""}
      ${test.rubric ? `<div class="list-item"><strong>Rubric</strong><div class="rich-text">${test.rubric}</div></div>` : ""}
      <form class="form" id="test-form"></form>
      <div id="test-msg" class="notice" style="display:none"></div>
    `;

    const form = qs("#test-form");
    const msg = qs("#test-msg");

    let submitted = false;
    const hasReadingParts =
      test.section === "reading" && Array.isArray(test.questions) && test.questions.some((q) => q && q.kind === "part");
    const readingPartsTotal = 5;
    const activeReadingPart = hasReadingParts
      ? Math.min(
          Math.max(Number.parseInt(params.get("part") || "1", 10) || 1, 1),
          readingPartsTotal
        )
      : null;
    const readingStateKey = hasReadingParts ? `${READING_STATE_PREFIX}${test.id}` : null;
    let readingState = hasReadingParts ? loadJson(readingStateKey, { parts: {} }) : null;
    if (hasReadingParts && (!readingState || typeof readingState !== "object")) {
      readingState = { parts: {} };
    }
    const timerKey = test?.id ? `${TIMER_PREFIX}${test.section}_${test.id}` : null;
    const clearTimerState = () => {
      if (!timerKey) return;
      removeJson(timerKey);
    };

    const saveReadingState = () => {
      if (!hasReadingParts || !readingStateKey) return;
      saveJson(readingStateKey, readingState);
    };

    const finalizeSubmission = (scoreText, auto) => {
      msg.textContent = auto ? `Time is up. Your score is ${scoreText}.` : `Saved! Your score is ${scoreText}.`;
      msg.style.display = "block";
      form.querySelectorAll("input, button, select, textarea").forEach((el) => {
        el.disabled = true;
      });
    };

    const applyReadingHighlights = (results) => {
      Object.entries(results).forEach(([qid, isCorrect]) => {
        const row = form.querySelector(`[data-qid="${qid}"]`);
        if (!row) return;
        if (isCorrect) {
          row.classList.add("correct");
          row.classList.remove("wrong");
        } else {
          row.classList.add("wrong");
          row.classList.remove("correct");
        }
      });
    };

    const renderReadingPartsForm = (parts, activePart, totalParts, testId) => {
      const partMap = new Map((parts || []).map((p) => [p.part, p]));

      const renderGapSet = (part) => {
        if (!part) return "";
        const gaps = part.gaps || [];
        return `
          <div class="list-item reading-part">
            <h3>${part.title || "Part 1 - Gap Filling"}</h3>
            ${part.passage ? `<div class="rich-text reading-passage">${part.passage}</div>` : ""}
            <div class="list">
              ${gaps
                .map(
                  (gap, idx) => `
                    <div class="list-item" data-qid="${gap.id}">
                      <label>Gap ${idx + 1}</label>
                      <input type="text" name="${gap.id}" placeholder="Type the missing word" />
                    </div>
                  `
                )
                .join("")}
            </div>
          </div>
        `;
      };

      const renderMatching = (part, prefix, titleFallback) => {
        if (!part) return "";
        const choices = part.choices || [];
        const items = part.items || [];
        return `
          <div class="list-item reading-part">
            <h3>${part.title || titleFallback}</h3>
            ${part.prompt ? `<p>${part.prompt}</p>` : ""}
            <div class="list-item">
              <strong>Choices</strong>
              <ol class="list">
                ${choices.map((choice, idx) => `<li>${ALPHABET[idx] || idx + 1}. ${choice}</li>`).join("")}
              </ol>
            </div>
            <div class="list">
              ${items
                .map(
                  (item, idx) => `
                    <div class="list-item" data-qid="${prefix}-${idx}">
                      <p>${item}</p>
                      <label>Answer</label>
                      <select name="${prefix}-${idx}">
                        <option value="">Select</option>
                        ${choices
                          .map(
                            (choice, optIdx) =>
                              `<option value="${optIdx}">${ALPHABET[optIdx] || optIdx + 1}. ${choice}</option>`
                          )
                          .join("")}
                      </select>
                    </div>
                  `
                )
                .join("")}
            </div>
          </div>
        `;
      };

      const renderMixed = (part, prefix, titleFallback, split = false) => {
        if (!part) return "";
        const questions = part.questions || [];
        const renderQuestion = (q, idx) => {
          const type = q.type || "mcq";
          const qid = q.id || `${prefix}-${idx}`;
          const options =
            q.options && q.options.length
              ? q.options
              : type === "tfng"
                ? ["True", "False", "Not Given"]
                : [];
          const typeLabel =
            type === "tfng" ? "True/False/Not Given" : type === "gap" ? "Gap Filling" : "MCQ";
          const isGap = type === "gap";
          return `
            <div class="list-item" data-qid="${qid}">
              <strong>Q${idx + 1}. ${q.text || ""}</strong>
              <span class="badge">${typeLabel}</span>
              ${
                isGap
                  ? `<label><input type="text" class="gap-input" name="${qid}" placeholder="Type your answer" /></label>`
                  : options
                      .map(
                        (opt, optIdx) => `
                          <label>
                            <input type="radio" name="${qid}" value="${optIdx}" /> ${opt}
                          </label>
                        `
                      )
                      .join("")
              }
            </div>
          `;
        };
        return `
          <div class="list-item reading-part${split ? " reading-part-split" : ""}">
            <h3>${part.title || titleFallback}</h3>
            ${
              split
                ? `
                  <div class="reading-part-columns">
                    <div class="reading-part-col reading-part-text">
                      ${part.passage ? `<div class="rich-text reading-passage">${part.passage}</div>` : ""}
                    </div>
                    <div class="reading-part-col reading-part-questions">
                      <div class="list">
                        ${questions.map((q, idx) => renderQuestion(q, idx)).join("")}
                      </div>
                    </div>
                  </div>
                `
                : `
                  ${part.passage ? `<div class="rich-text reading-passage">${part.passage}</div>` : ""}
                  <div class="list">
                    ${questions.map((q, idx) => renderQuestion(q, idx)).join("")}
                  </div>
                `
            }
          </div>
        `;
      };

      const renderPartNav = () => {
        const total = totalParts || 6;
        return `
          <div class="reading-part-nav">
            ${Array.from({ length: total }).map((_, idx) => {
              const part = idx + 1;
              const exists = partMap.has(part);
              const href = `/test?section=reading&id=${testId}&part=${part}`;
              const classes = [
                "reading-part-link",
                part === activePart ? "is-active" : "",
                !exists ? "is-disabled" : ""
              ]
                .filter(Boolean)
                .join(" ");
              return `<a class="${classes}" href="${href}">Part ${part}</a>`;
            }).join("")}
          </div>
        `;
      };

      const renderSelectedPart = () => {
        const selected = partMap.get(activePart);
        if (!selected) {
          return `<div class="notice">Part ${activePart} is not available for this test yet.</div>`;
        }
        switch (selected.part) {
          case 1:
            return renderGapSet(selected);
          case 2:
            return renderMatching(selected, "p2", "Part 2 - Matching Information");
          case 3:
            return renderMatching(selected, "p3", "Part 3 - Matching Headings");
          case 4:
            return renderMixed(selected, "p4", "Part 4 - Long Text", true);
          case 5:
            return renderMixed(selected, "p5", "Part 5 - Long Text", true);
          case 6:
            return renderMixed(selected, "p6", "Part 6 - Long Text", true);
          default:
            return "";
        }
      };

      const selected = partMap.get(activePart);
      return `
        ${renderSelectedPart()}
        ${selected && activePart === 5 ? '<button class="btn btn-primary" type="submit">Submit Answers</button>' : ""}
        ${renderPartNav()}
      `;
    };

    const getReadingPartMap = () => new Map((test.questions || []).map((p) => [p.part, p]));
    const getReadingPrefix = (part) => {
      if (part === 2) return "p2";
      if (part === 3) return "p3";
      if (part === 4) return "p4";
      if (part === 5) return "p5";
      return `p${part}`;
    };
    const getPartState = (part) => (readingState && readingState.parts ? readingState.parts[part] : null) || null;
    const setPartState = (part, data) => {
      if (!readingState) return;
      if (!readingState.parts) readingState.parts = {};
      readingState.parts[part] = data;
      saveReadingState();
    };

    const collectPartState = (part) => {
      const partMap = getReadingPartMap();
      const selected = partMap.get(part);
      if (!selected) return null;
      const prefix = getReadingPrefix(part);

      if (selected.part === 1) {
        const gaps = {};
        (selected.gaps || []).forEach((gap) => {
          const input = form.querySelector(`input[name='${gap.id}']`);
          gaps[gap.id] = input ? input.value.trim() : "";
        });
        return { gaps };
      }

      if (selected.part === 2 || selected.part === 3) {
        const matches = [];
        (selected.items || []).forEach((_, idx) => {
          const select = form.querySelector(`select[name='${prefix}-${idx}']`);
          const value = select ? select.value : "";
          matches[idx] = value === "" ? null : Number(value);
        });
        return { matches };
      }

      const answers = {};
      (selected.questions || []).forEach((q, idx) => {
        const qid = q.id || `${prefix}-${idx}`;
        const type = q.type || "mcq";
        if (type === "gap") {
          const input = form.querySelector(`input[name='${qid}']`);
          answers[qid] = { type, response: input ? input.value.trim() : "" };
          return;
        }
        const selectedInput = form.querySelector(`input[name='${qid}']:checked`);
        answers[qid] = { type, selectedIndex: selectedInput ? Number(selectedInput.value) : null };
      });
      return { answers };
    };

    const hydratePartInputs = (part) => {
      const partMap = getReadingPartMap();
      const selected = partMap.get(part);
      if (!selected) return;
      const state = getPartState(part);
      if (!state) return;
      const prefix = getReadingPrefix(part);

      if (selected.part === 1 && state.gaps) {
        Object.entries(state.gaps).forEach(([gapId, value]) => {
          const input = form.querySelector(`input[name='${gapId}']`);
          if (input) input.value = value || "";
        });
        return;
      }

      if ((selected.part === 2 || selected.part === 3) && Array.isArray(state.matches)) {
        state.matches.forEach((value, idx) => {
          const select = form.querySelector(`select[name='${prefix}-${idx}']`);
          if (select) select.value = value === null || value === undefined ? "" : String(value);
        });
        return;
      }

      if (state.answers) {
        Object.entries(state.answers).forEach(([qid, answer]) => {
          if (!answer) return;
          if (answer.type === "gap") {
            const input = form.querySelector(`input[name='${qid}']`);
            if (input) input.value = answer.response || "";
            return;
          }
          const radio = form.querySelector(`input[name='${qid}'][value='${answer.selectedIndex}']`);
          if (radio) radio.checked = true;
        });
      }
    };

    const persistActivePart = () => {
      if (!hasReadingParts) return;
      const data = collectPartState(activeReadingPart || 1);
      if (data) setPartState(activeReadingPart || 1, data);
    };

    const applyHighlights = () => {
      test.questions.forEach((q) => {
        const type = q.type || "mcq";
        if (type === "gap") {
          const input = form.querySelector(`input[name='${q.id}']`);
          const card = input ? input.closest(".list-item") : null;
          if (!card) return;
          const response = (input.value || "").trim().toLowerCase();
          const expected = (q.answerText || "").trim().toLowerCase();
          if (response && response === expected) {
            card.classList.add("correct");
            card.classList.remove("wrong");
          } else {
            card.classList.add("wrong");
            card.classList.remove("correct");
          }
          return;
        }
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
    };

    const submitMcq = async (auto = false) => {
      if (submitted) return;
      const answers = [];
      let correct = 0;
      let complete = true;

      test.questions.forEach((q) => {
        const type = q.type || "mcq";
        if (type === "gap") {
          const input = form.querySelector(`input[name='${q.id}']`);
          const response = input ? input.value.trim() : "";
          if (!response) {
            complete = false;
            if (!auto) return;
          }
          answers.push({ questionId: q.id, response });
          const expected = (q.answerText || "").trim().toLowerCase();
          if (response.toLowerCase() === expected) correct += 1;
          return;
        }
        const selected = form.querySelector(`input[name='${q.id}']:checked`);
        if (!selected) {
          complete = false;
          if (!auto) return;
          answers.push({ questionId: q.id, selectedIndex: null });
          return;
        }
        const selectedIndex = Number(selected.value);
        answers.push({ questionId: q.id, selectedIndex });
        if (selectedIndex === q.answerIndex) correct += 1;
      });

      if (!complete && !auto) {
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

      clearTimerState();
      applyHighlights();
      submitted = true;
      finalizeSubmission(score, auto);
    };

    const submitReadingParts = async (auto = false) => {
      if (submitted) return;
      const partMap = getReadingPartMap();
      const activePart = activeReadingPart || 1;
      const selected = partMap.get(activePart);

      if (!selected) {
        msg.textContent = `Part ${activePart} is not available for this test.`;
        msg.style.display = "block";
        return;
      }

      persistActivePart();

      if (activePart !== 5 && !auto) {
        msg.textContent = "Submit is available on Part 5 to include all parts.";
        msg.style.display = "block";
        return;
      }

      const results = {};
      const partBreakdown = [];
      let totalCorrect = 0;
      let totalQuestions = 0;
      let complete = true;

      const scoreGapSet = (part, partState) => {
        let correct = 0;
        let total = 0;
        (part.gaps || []).forEach((gap) => {
          total += 1;
          const response = (partState?.gaps?.[gap.id] || "").trim();
          if (!response) {
            complete = false;
            if (!auto) return;
          }
          const expected = (gap.answerText || "").trim().toLowerCase();
          const isCorrect = response.toLowerCase() === expected;
          results[gap.id] = isCorrect;
          if (isCorrect) correct += 1;
        });
        return { correct, total };
      };

      const scoreMatching = (part, partState, prefix) => {
        let correct = 0;
        let total = 0;
        const expectedAnswers = Array.isArray(part.answers) ? part.answers : [];
        (part.items || []).forEach((_, idx) => {
          total += 1;
          const selectedIndex = Array.isArray(partState?.matches) ? partState.matches[idx] : null;
          if (selectedIndex === null || selectedIndex === undefined) {
            complete = false;
            if (!auto) return;
          }
          const isCorrect = selectedIndex === expectedAnswers[idx];
          results[`${prefix}-${idx}`] = isCorrect;
          if (isCorrect) correct += 1;
        });
        return { correct, total };
      };

      const scoreMixed = (part, partState, prefix) => {
        let correct = 0;
        let total = 0;
        (part.questions || []).forEach((q, idx) => {
          const type = q.type || "mcq";
          const qid = q.id || `${prefix}-${idx}`;
          total += 1;
          if (type === "gap") {
            const response = (partState?.answers?.[qid]?.response || "").trim();
            if (!response) {
              complete = false;
              if (!auto) return;
            }
            const expected = (q.answerText || "").trim().toLowerCase();
            const isCorrect = response.toLowerCase() === expected;
            results[qid] = isCorrect;
            if (isCorrect) correct += 1;
            return;
          }
          const selectedIndex = partState?.answers?.[qid]?.selectedIndex;
          if (selectedIndex === null || selectedIndex === undefined) {
            complete = false;
            if (!auto) return;
            results[qid] = false;
            return;
          }
          const isCorrect = Number(selectedIndex) === q.answerIndex;
          results[qid] = isCorrect;
          if (isCorrect) correct += 1;
        });
        return { correct, total };
      };

      for (let part = 1; part <= 5; part += 1) {
        const partDef = partMap.get(part);
        if (!partDef) continue;
        const partState = getPartState(part);
        let scored = { correct: 0, total: 0 };
        if (part === 1) scored = scoreGapSet(partDef, partState);
        else if (part === 2) scored = scoreMatching(partDef, partState, "p2");
        else if (part === 3) scored = scoreMatching(partDef, partState, "p3");
        else if (part === 4) scored = scoreMixed(partDef, partState, "p4");
        else if (part === 5) scored = scoreMixed(partDef, partState, "p5");
        partBreakdown.push({ part, correct: scored.correct, total: scored.total });
        totalCorrect += scored.correct;
        totalQuestions += scored.total;
      }

      if (!complete && !auto) {
        msg.textContent = "Please answer all questions in Parts 1-5.";
        msg.style.display = "block";
        return;
      }

      const score = `${totalCorrect} / ${totalQuestions}`;
      const attempt = await apiRequest("/attempts", {
        method: "POST",
        body: {
          testId: test.id,
          section: test.section,
          type: test.type,
          score,
          answers: {
            parts: readingState?.parts || {},
            breakdown: partBreakdown
          }
        }
      });

      clearTimerState();
      const scoreSummary = {
        attemptId: attempt.id,
        testId: test.id,
        title: test.title,
        section: test.section,
        totalCorrect,
        totalQuestions,
        parts: partBreakdown,
        createdAt: attempt.createdAt
      };
      saveJson(SCORE_KEY, scoreSummary);

      applyReadingHighlights(results);
      submitted = true;
      window.location.href = `/score?attempt=${attempt.id}`;
      finalizeSubmission(score, auto);
    };

    const submitWriting = async (auto = false) => {
      if (submitted) return;
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

      clearTimerState();
      submitted = true;
      msg.textContent = auto ? "Time is up. Your response has been recorded." : "Saved! Your response has been recorded.";
      msg.style.display = "block";
      form.querySelectorAll("input, button, select, textarea").forEach((el) => {
        el.disabled = true;
      });
    };

    if (hasReadingParts) {
      form.innerHTML = renderReadingPartsForm(
        test.questions || [],
        activeReadingPart,
        readingPartsTotal,
        test.id
      );
      hydratePartInputs(activeReadingPart || 1);
      form.addEventListener("input", persistActivePart);
      form.addEventListener("change", persistActivePart);
      const partNav = qs(".reading-part-nav", form);
      if (partNav) {
        partNav.addEventListener("click", (event) => {
          const link = event.target.closest(".reading-part-link");
          if (!link) return;
          persistActivePart();
        });
      }
      window.addEventListener("beforeunload", persistActivePart);
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        msg.style.display = "none";
        await submitReadingParts(false);
      });
    } else if (test.type === "mcq") {
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
              type === "tfng"
                ? "True/False/Not Given"
                : type === "heading"
                  ? "Matching Headings"
                  : type === "gap"
                    ? "Gap Filling"
                    : "MCQ";
            const isGap = type === "gap";
            return `
          <div class="list-item">
            <strong>Q${idx + 1}. ${q.text}</strong>
            <span class="badge">${typeLabel}</span>
            ${
              isGap
                ? `<label><input type="text" class="gap-input" name="${q.id}" placeholder="Type your answer" /></label>`
                : options
                    .map(
                      (opt, optIdx) => `
                <label>
                  <input type="radio" name="${q.id}" value="${optIdx}" /> ${opt}
                </label>
              `
                    )
                    .join("")
            }
          </div>
        `;
          })
          .join("") +
        '<button class="btn btn-primary" type="submit">Submit Answers</button>';

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        msg.style.display = "none";
        await submitMcq(false);
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
        await submitWriting(false);
      });
    }

    const timerEl = qs("#section-timer");
    const duration = SECTION_TIMERS[test.section];
    if (timerEl && duration) {
      const now = Date.now();
      const stored = timerKey ? loadJson(timerKey, null) : null;
      let endTime = stored && stored.end ? Number(stored.end) : 0;
      if (!endTime || endTime <= now) {
        endTime = now + duration * 1000;
        if (timerKey) saveJson(timerKey, { end: endTime });
      }
      const updateTimer = () => {
        const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        timerEl.textContent = `Time left: ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
        return remaining;
      };
      timerEl.style.display = "inline-flex";
      let remaining = updateTimer();
      const timerId = setInterval(async () => {
        remaining = updateTimer();
        if (remaining <= 0) {
          clearInterval(timerId);
          if (hasReadingParts) {
            await submitReadingParts(true);
          } else if (test.type === "mcq") {
            await submitMcq(true);
          } else {
            await submitWriting(true);
          }
          clearTimerState();
        }
      }, 1000);
    }

    const enableHighlight = (target) => {
      if (!target) return;
      target.classList.add("highlightable");
      target.setAttribute("contenteditable", "true");
      target.addEventListener("beforeinput", (e) => {
        if (e.inputType && (e.inputType.startsWith("insert") || e.inputType.startsWith("delete"))) {
          e.preventDefault();
        }
      });

      const toolbar = document.createElement("div");
      toolbar.className = "highlight-toolbar";
      toolbar.innerHTML = `
        <button class="highlight-btn" type="button" data-color="#fff59d" title="Yellow" style="background:#fff59d"></button>
        <button class="highlight-btn" type="button" data-color="#c8e6c9" title="Green" style="background:#c8e6c9"></button>
        <button class="highlight-btn" type="button" data-color="#ffcdd2" title="Red" style="background:#ffcdd2"></button>
        <button class="highlight-btn" type="button" data-color="#bbdefb" title="Blue" style="background:#bbdefb"></button>
        <button class="highlight-clear" type="button" data-clear="true">Clear</button>
      `;
      target.parentElement.insertBefore(toolbar, target);

      toolbar.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        target.focus();
        if (btn.dataset.clear) {
          document.execCommand("removeFormat", false, null);
          return;
        }
        const color = btn.dataset.color;
        document.execCommand("hiliteColor", false, color);
      });
    };

    if (["reading", "listening"].includes(test.section)) {
      const passageContainer = qs("#passage-container");
      if (passageContainer) enableHighlight(passageContainer);
      qsa(".reading-passage").forEach((el) => enableHighlight(el));
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

const initScorePage = async () => {
  const user = requireAuth();
  if (!user) return;

  const container = qs("#score-container");
  if (!container) return;

  const score = loadJson(SCORE_KEY, null);
  if (!score) {
    container.innerHTML = '<div class="notice">No score found yet. Complete a test to see results.</div>';
    return;
  }

  const totalPercent = score.totalQuestions
    ? Math.round((score.totalCorrect / score.totalQuestions) * 100)
    : 0;
  const parts = Array.isArray(score.parts) ? score.parts : [];

  container.innerHTML = `
    <div class="hero">
      <h1>Score Summary</h1>
      <p>${score.title || "Mock Test"} · ${SECTION_LABELS[score.section] || score.section}</p>
      <div class="score-total">
        <div class="score-big">${score.totalCorrect} / ${score.totalQuestions}</div>
        <div class="score-sub">${totalPercent}% overall</div>
      </div>
    </div>
    <div class="score-breakdown">
      ${parts
        .map((p) => {
          const percent = p.total ? Math.round((p.correct / p.total) * 100) : 0;
          return `
            <div class="score-row">
              <div class="score-label">Part ${p.part}</div>
              <div class="score-bar"><span style="width:${percent}%"></span></div>
              <div class="score-value">${p.correct}/${p.total}</div>
            </div>
          `;
        })
        .join("")}
    </div>
    <div class="score-actions">
      <a class="btn btn-outline" href="/mock">Back to Mocks</a>
      <a class="btn btn-primary" href="/dashboard">Dashboard</a>
    </div>
  `;
};
const initAdminHubPage = () => {
  const user = requireAdmin();
  if (!user) return;
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
  const testSectionSelect = qs("#test-section");
  const testTypeSelect = qs("#test-type");
  const passageWrap = qs("#test-passage-wrap");
  const readingPartsWrap = qs("#reading-parts");
  const passageInput = qs("#test-passage");
  const rubricInput = qs("#test-rubric");
  const grammarContentInput = qs("#grammar-content");
  const editors = {};
  const pendingData = {};
  let cachedTests = [];

  const initEditors = () => {
    const ids = ["test-passage", "test-rubric", "grammar-content"];
    const tryCreate = (id) => {
      if (!window.CKEDITOR || editors[id]) return false;
      const el = qs(`#${id}`);
      if (!el) return false;
      editors[id] = window.CKEDITOR.replace(id, {
        toolbar: [
          { name: "styles", items: ["Format"] },
          { name: "basicstyles", items: ["Bold", "Italic", "Underline"] },
          { name: "paragraph", items: ["NumberedList", "BulletedList"] },
          { name: "clipboard", items: ["Undo", "Redo"] }
        ]
      });
      if (pendingData[id]) {
        editors[id].setData(pendingData[id]);
      }
      return true;
    };

    let retries = 0;
    const timer = setInterval(() => {
      ids.forEach((id) => tryCreate(id));
      retries += 1;
      if (ids.every((id) => editors[id] || !qs(`#${id}`)) || retries > 10) {
        clearInterval(timer);
        if (!window.CKEDITOR) {
          console.warn("CKEditor not loaded; using plain textarea.");
        }
      }
    }, 300);
  };

  const setEditorContent = (id, html) => {
    if (editors[id]) {
      editors[id].setData(html || "");
      return;
    }
    const el = qs(`#${id}`);
    if (el) {
      el.value = html || "";
      pendingData[id] = html || "";
    }
  };

  const getEditorContent = (id) => {
    if (editors[id]) return editors[id].getData().trim();
    const el = qs(`#${id}`);
    return el ? el.value.trim() : "";
  };

  const questionDefaults = {
    mcq: ["Option A", "Option B", "Option C", "Option D"],
    tfng: ["True", "False", "Not Given"],
    heading: ["Heading A", "Heading B", "Heading C", "Heading D"],
    gap: []
  };
  const readingQuestionDefaults = {
    mcq: ["Option A", "Option B", "Option C", "Option D"],
    tfng: ["True", "False", "Not Given"],
    gap: []
  };

  const isReadingSection = () => testSectionSelect && testSectionSelect.value === "reading";

  const ensureReadingPartsUI = () => {
    if (!readingPartsWrap || readingPartsWrap.childElementCount) return;
    readingPartsWrap.innerHTML = `
      <div class="list">
        <div class="list-item" data-part="1">
          <h3>Part 1 - Gap Filling</h3>
          <p class="muted">Provide a 50-60 word text and 6 missing words.</p>
          <label for="part1-passage">Passage (use [1]...[6] to mark gaps)</label>
          <textarea id="part1-passage" placeholder="Enter the text with [1]...[6] placeholders."></textarea>
          <div class="grid" id="part1-answers"></div>
        </div>
        <div class="list-item" data-part="2">
          <h3>Part 2 - Matching Information</h3>
          <p class="muted">Add 8 pieces of information and 8 short texts to match.</p>
          <div class="row">
            <div>
              <label>Information (8)</label>
              <div class="list" id="part2-choices"></div>
            </div>
            <div>
              <label>Texts (8)</label>
              <div class="list" id="part2-items"></div>
            </div>
          </div>
          <label>Answer Key</label>
          <div class="list" id="part2-answers"></div>
        </div>
        <div class="list-item" data-part="3">
          <h3>Part 3 - Matching Headings</h3>
          <p class="muted">Add 10 headings (A-J) and 6 texts to match.</p>
          <div class="row">
            <div>
              <label>Headings (10)</label>
              <div class="list" id="part3-choices"></div>
            </div>
            <div>
              <label>Texts (6)</label>
              <div class="list" id="part3-items"></div>
            </div>
          </div>
          <label>Answer Key</label>
          <div class="list" id="part3-answers"></div>
        </div>
        <div class="list-item" data-part="4">
          <h3>Part 4 - Long Text + MCQ/TFNG</h3>
          <p class="muted">Add a long passage with 4 MCQ and 5 TFNG questions.</p>
          <label for="part4-passage">Passage</label>
          <textarea id="part4-passage" placeholder="Enter the long passage for part 4."></textarea>
          <div class="list" id="part4-questions"></div>
          <button class="btn btn-outline" type="button" id="part4-add-question">Add Question</button>
        </div>
        <div class="list-item" data-part="5">
          <h3>Part 5 - Long Text + Mixed</h3>
          <p class="muted">Add a long passage with 4 gap-fill and 2 MCQ questions.</p>
          <label for="part5-passage">Passage</label>
          <textarea id="part5-passage" placeholder="Enter the long passage for part 5."></textarea>
          <div class="list" id="part5-questions"></div>
          <button class="btn btn-outline" type="button" id="part5-add-question">Add Question</button>
        </div>
      </div>
    `;

    const buildInputs = (containerId, count, labelPrefix, multiline = false, placeholder = "") => {
      const container = qs(`#${containerId}`);
      if (!container) return;
      container.innerHTML = Array.from({ length: count })
        .map((_, idx) => {
          const id = `${containerId}-${idx + 1}`;
          return `
            <div>
              <label for="${id}">${labelPrefix} ${idx + 1}</label>
              ${
                multiline
                  ? `<textarea id="${id}" placeholder="${placeholder}"></textarea>`
                  : `<input id="${id}" type="text" placeholder="${placeholder}" />`
              }
            </div>
          `;
        })
        .join("");
    };

    buildInputs("part1-answers", 6, "Gap answer");
    buildInputs("part2-choices", 8, "Info");
    buildInputs("part2-items", 8, "Text", true, "20-30 words");
    buildInputs("part3-choices", 10, "Heading");
    buildInputs("part3-items", 6, "Text", true, "20-30 words");

    const buildAnswerSelects = (containerId, count, choicePrefix, choiceCount) => {
      const container = qs(`#${containerId}`);
      if (!container) return;
      container.innerHTML = Array.from({ length: count })
        .map((_, idx) => {
          const id = `${containerId}-${idx + 1}`;
          return `
            <div>
              <label for="${id}">Answer for text ${idx + 1}</label>
              <select id="${id}"></select>
            </div>
          `;
        })
        .join("");

      const syncOptions = () => {
        const choices = Array.from({ length: choiceCount }).map((_, i) => {
          const input = qs(`#${choicePrefix}-${i + 1}`);
          return (input && input.value.trim()) || `Choice ${i + 1}`;
        });
        qsa(`#${containerId} select`).forEach((select) => {
          const current = select.value;
          select.innerHTML =
            `<option value="">Select</option>` +
            choices
              .map((choice, idx) => `<option value="${idx}">${ALPHABET[idx] || idx + 1}. ${choice}</option>`)
              .join("");
          if (current) select.value = current;
        });
      };

      const choiceContainer = qs(`#${choicePrefix}`);
      if (choiceContainer) {
        choiceContainer.addEventListener("input", syncOptions);
      }
      syncOptions();
    };

    buildAnswerSelects("part2-answers", 8, "part2-choices", 8);
    buildAnswerSelects("part3-answers", 6, "part3-choices", 10);

    const buildQuestionRow = (listEl, allowedTypes, question = {}) => {
      if (!listEl) return;
      const qid = question.id || `rq-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
      const row = document.createElement("div");
      row.className = "list-item question-row";
      row.dataset.qid = qid;
      row.innerHTML = `
        <div class="row">
          <div>
            <label>Type</label>
            <select class="rq-type">
              ${allowedTypes
                .map((type) => {
                  const label =
                    type === "tfng" ? "True/False/Not Given" : type === "gap" ? "Gap Filling" : "MCQ";
                  return `<option value="${type}">${label}</option>`;
                })
                .join("")}
            </select>
          </div>
          <div>
            <label>Question text</label>
            <input class="rq-text" type="text" placeholder="Enter the question" />
          </div>
        </div>
        <div class="rq-options"></div>
        <div class="rq-gap" style="display:none">
          <label>Correct answer</label>
          <input class="rq-gap-answer" type="text" placeholder="Enter correct word or phrase" />
        </div>
        <div class="row">
          <div class="rq-answer-wrap">
            <label>Correct answer</label>
            <select class="rq-answer"></select>
          </div>
          <div>
            <button class="btn btn-outline rq-remove" type="button">Remove</button>
          </div>
        </div>
      `;

      const typeSelect = qs(".rq-type", row);
      const textInput = qs(".rq-text", row);
      const gapWrap = qs(".rq-gap", row);
      const gapInput = qs(".rq-gap-answer", row);
      const optionsWrap = qs(".rq-options", row);
      const answerSelect = qs(".rq-answer", row);
      const answerWrap = qs(".rq-answer-wrap", row);

      const renderOptions = (type) => {
        const optionList = readingQuestionDefaults[type] || readingQuestionDefaults.mcq;
        if (type === "gap") {
          optionsWrap.innerHTML = "";
          if (answerWrap) answerWrap.style.display = "none";
          if (gapWrap) gapWrap.style.display = "block";
          if (gapInput) gapInput.value = question.answerText || "";
          return;
        }
        if (gapWrap) gapWrap.style.display = "none";
        if (answerWrap) answerWrap.style.display = "block";
        optionsWrap.innerHTML = optionList
          .map(
            (opt, idx) => `
              <div>
                <label>Option ${idx + 1}</label>
                <input class="rq-option" data-index="${idx}" type="text" value="${
                  (question.options && question.options[idx]) || opt
                }" ${type === "tfng" ? "disabled" : ""} />
              </div>
            `
          )
          .join("");
        const options = qsa(".rq-option", optionsWrap).map((input) => input.value.trim());
        answerSelect.innerHTML = options
          .map((opt, idx) => `<option value="${idx}">${opt || `Option ${idx + 1}`}</option>`)
          .join("");
        answerSelect.value = Number.isInteger(question.answerIndex) ? String(question.answerIndex) : "0";
        if (type !== "tfng") {
          optionsWrap.addEventListener("input", () => {
            const updated = qsa(".rq-option", optionsWrap).map((input) => input.value.trim());
            const current = answerSelect.value;
            answerSelect.innerHTML = updated
              .map((opt, idx) => `<option value="${idx}">${opt || `Option ${idx + 1}`}</option>`)
              .join("");
            answerSelect.value = current || "0";
          });
        }
      };

      typeSelect.value = allowedTypes.includes(question.type) ? question.type : allowedTypes[0];
      textInput.value = question.text || "";
      renderOptions(typeSelect.value);

      typeSelect.addEventListener("change", () => renderOptions(typeSelect.value));
      qs(".rq-remove", row).addEventListener("click", () => row.remove());

      listEl.appendChild(row);
    };

    const setupQuestionList = (listId, addBtnId, allowedTypes) => {
      const listEl = qs(`#${listId}`);
      const addBtn = qs(`#${addBtnId}`);
      if (addBtn) {
        addBtn.addEventListener("click", () => buildQuestionRow(listEl, allowedTypes));
      }
    };

    setupQuestionList("part4-questions", "part4-add-question", ["mcq", "tfng"]);
    setupQuestionList("part5-questions", "part5-add-question", ["gap", "mcq"]);
  };

  const resetReadingParts = () => {
    if (!readingPartsWrap) return;
    readingPartsWrap.innerHTML = "";
    ensureReadingPartsUI();
  };

  const collectReadingQuestions = (listId) => {
    const listEl = qs(`#${listId}`);
    if (!listEl) return [];
    return qsa(".question-row", listEl).map((row, idx) => {
      const type = qs(".rq-type", row).value;
      const text = qs(".rq-text", row).value.trim();
      if (type === "gap") {
        const answerText = (qs(".rq-gap-answer", row)?.value || "").trim();
        return {
          id: row.dataset.qid || `rq-${Date.now()}-${idx}`,
          type,
          text,
          answerText
        };
      }
      const options = qsa(".rq-option", row).map((input) => input.value.trim());
      const answerIndex = Number(qs(".rq-answer", row).value || 0);
      return {
        id: row.dataset.qid || `rq-${Date.now()}-${idx}`,
        type,
        text,
        options: options.length ? options : readingQuestionDefaults[type],
        answerIndex
      };
    });
  };

  const collectReadingParts = () => {
    if (!readingPartsWrap) return [];
    const gaps = Array.from({ length: 6 }).map((_, idx) => ({
      id: `p1-gap-${idx + 1}`,
      answerText: (qs(`#part1-answers-${idx + 1}`)?.value || "").trim()
    }));

    const part2Choices = Array.from({ length: 8 }).map((_, idx) =>
      (qs(`#part2-choices-${idx + 1}`)?.value || "").trim()
    );
    const part2Items = Array.from({ length: 8 }).map((_, idx) =>
      (qs(`#part2-items-${idx + 1}`)?.value || "").trim()
    );
    const part2Answers = Array.from({ length: 8 }).map((_, idx) => {
      const value = qs(`#part2-answers-${idx + 1}`)?.value;
      return value === "" || value === undefined ? null : Number(value);
    });

    const part3Choices = Array.from({ length: 10 }).map((_, idx) =>
      (qs(`#part3-choices-${idx + 1}`)?.value || "").trim()
    );
    const part3Items = Array.from({ length: 6 }).map((_, idx) =>
      (qs(`#part3-items-${idx + 1}`)?.value || "").trim()
    );
    const part3Answers = Array.from({ length: 6 }).map((_, idx) => {
      const value = qs(`#part3-answers-${idx + 1}`)?.value;
      return value === "" || value === undefined ? null : Number(value);
    });

    const part4Questions = collectReadingQuestions("part4-questions");
    const part5Questions = collectReadingQuestions("part5-questions");

    return [
      {
        kind: "part",
        part: 1,
        title: "Part 1 - Gap Filling",
        type: "gapset",
        passage: (qs("#part1-passage")?.value || "").trim(),
        gaps
      },
      {
        kind: "part",
        part: 2,
        title: "Part 2 - Matching Information",
        type: "matching",
        prompt: "Match the information to the texts.",
        choices: part2Choices,
        items: part2Items,
        answers: part2Answers
      },
      {
        kind: "part",
        part: 3,
        title: "Part 3 - Matching Headings",
        type: "matching",
        prompt: "Match the heading to each paragraph.",
        choices: part3Choices,
        items: part3Items,
        answers: part3Answers
      },
      {
        kind: "part",
        part: 4,
        title: "Part 4 - Long Text",
        type: "mixed",
        passage: (qs("#part4-passage")?.value || "").trim(),
        questions: part4Questions
      },
      {
        kind: "part",
        part: 5,
        title: "Part 5 - Long Text",
        type: "mixed",
        passage: (qs("#part5-passage")?.value || "").trim(),
        questions: part5Questions
      }
    ];
  };

  const setReadingParts = (parts = []) => {
    if (!readingPartsWrap) return;
    ensureReadingPartsUI();
    const partMap = new Map(parts.map((p) => [p.part, p]));

    const part1 = partMap.get(1);
    if (part1) {
      const passage = qs("#part1-passage");
      if (passage) passage.value = part1.passage || "";
      (part1.gaps || []).forEach((gap, idx) => {
        const input = qs(`#part1-answers-${idx + 1}`);
        if (input) input.value = gap.answerText || "";
      });
    }

    const part2 = partMap.get(2);
    if (part2) {
      (part2.choices || []).forEach((choice, idx) => {
        const input = qs(`#part2-choices-${idx + 1}`);
        if (input) input.value = choice || "";
      });
      const part2ChoiceContainer = qs("#part2-choices");
      if (part2ChoiceContainer) {
        part2ChoiceContainer.dispatchEvent(new Event("input", { bubbles: true }));
      }
      (part2.items || []).forEach((item, idx) => {
        const input = qs(`#part2-items-${idx + 1}`);
        if (input) input.value = item || "";
      });
      (part2.answers || []).forEach((answer, idx) => {
        const select = qs(`#part2-answers-${idx + 1}`);
        if (select) select.value = answer === null || answer === undefined ? "" : String(answer);
      });
    }

    const part3 = partMap.get(3);
    if (part3) {
      (part3.choices || []).forEach((choice, idx) => {
        const input = qs(`#part3-choices-${idx + 1}`);
        if (input) input.value = choice || "";
      });
      const part3ChoiceContainer = qs("#part3-choices");
      if (part3ChoiceContainer) {
        part3ChoiceContainer.dispatchEvent(new Event("input", { bubbles: true }));
      }
      (part3.items || []).forEach((item, idx) => {
        const input = qs(`#part3-items-${idx + 1}`);
        if (input) input.value = item || "";
      });
      (part3.answers || []).forEach((answer, idx) => {
        const select = qs(`#part3-answers-${idx + 1}`);
        if (select) select.value = answer === null || answer === undefined ? "" : String(answer);
      });
    }

    const part4 = partMap.get(4);
    if (part4) {
      const passage = qs("#part4-passage");
      if (passage) passage.value = part4.passage || "";
      const listEl = qs("#part4-questions");
      if (listEl) {
        listEl.innerHTML = "";
        (part4.questions || []).forEach((q) => {
          ensureReadingPartsUI();
          const listRef = qs("#part4-questions");
          const allowed = ["mcq", "tfng"];
          if (listRef) {
            const row = listRef;
            const buildRow = () => {
              const question = q || {};
              const qid = question.id || `rq-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
              const item = document.createElement("div");
              item.className = "list-item question-row";
              item.dataset.qid = qid;
              item.innerHTML = `
                <div class="row">
                  <div>
                    <label>Type</label>
                    <select class="rq-type">
                      ${allowed
                        .map((type) => {
                          const label =
                            type === "tfng" ? "True/False/Not Given" : type === "gap" ? "Gap Filling" : "MCQ";
                          return `<option value="${type}">${label}</option>`;
                        })
                        .join("")}
                    </select>
                  </div>
                  <div>
                    <label>Question text</label>
                    <input class="rq-text" type="text" placeholder="Enter the question" />
                  </div>
                </div>
                <div class="rq-options"></div>
                <div class="rq-gap" style="display:none">
                  <label>Correct answer</label>
                  <input class="rq-gap-answer" type="text" placeholder="Enter correct word or phrase" />
                </div>
                <div class="row">
                  <div class="rq-answer-wrap">
                    <label>Correct answer</label>
                    <select class="rq-answer"></select>
                  </div>
                  <div>
                    <button class="btn btn-outline rq-remove" type="button">Remove</button>
                  </div>
                </div>
              `;
              row.appendChild(item);
              const typeSelect = qs(".rq-type", item);
              const textInput = qs(".rq-text", item);
              const gapWrap = qs(".rq-gap", item);
              const gapInput = qs(".rq-gap-answer", item);
              const optionsWrap = qs(".rq-options", item);
              const answerSelect = qs(".rq-answer", item);
              const answerWrap = qs(".rq-answer-wrap", item);
              const renderOptions = (type) => {
                const optionList = readingQuestionDefaults[type] || readingQuestionDefaults.mcq;
                if (type === "gap") {
                  optionsWrap.innerHTML = "";
                  if (answerWrap) answerWrap.style.display = "none";
                  if (gapWrap) gapWrap.style.display = "block";
                  if (gapInput) gapInput.value = question.answerText || "";
                  return;
                }
                if (gapWrap) gapWrap.style.display = "none";
                if (answerWrap) answerWrap.style.display = "block";
                optionsWrap.innerHTML = optionList
                  .map(
                    (opt, idx) => `
                      <div>
                        <label>Option ${idx + 1}</label>
                        <input class="rq-option" data-index="${idx}" type="text" value="${
                          (question.options && question.options[idx]) || opt
                        }" ${type === "tfng" ? "disabled" : ""} />
                      </div>
                    `
                  )
                  .join("");
                const options = qsa(".rq-option", optionsWrap).map((input) => input.value.trim());
                answerSelect.innerHTML = options
                  .map((opt, idx) => `<option value="${idx}">${opt || `Option ${idx + 1}`}</option>`)
                  .join("");
                answerSelect.value = Number.isInteger(question.answerIndex) ? String(question.answerIndex) : "0";
              };
              typeSelect.value = allowed.includes(question.type) ? question.type : allowed[0];
              textInput.value = question.text || "";
              renderOptions(typeSelect.value);
              typeSelect.addEventListener("change", () => renderOptions(typeSelect.value));
              qs(".rq-remove", item).addEventListener("click", () => item.remove());
            };
            buildRow();
          }
        });
      }
    }

    const part5 = partMap.get(5);
    if (part5) {
      const passage = qs("#part5-passage");
      if (passage) passage.value = part5.passage || "";
      const listEl = qs("#part5-questions");
      if (listEl) {
        listEl.innerHTML = "";
        (part5.questions || []).forEach((q) => {
          ensureReadingPartsUI();
          const listRef = qs("#part5-questions");
          const allowed = ["gap", "mcq"];
          if (listRef) {
            const row = listRef;
            const question = q || {};
            const qid = question.id || `rq-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
            const item = document.createElement("div");
            item.className = "list-item question-row";
            item.dataset.qid = qid;
            item.innerHTML = `
              <div class="row">
                <div>
                  <label>Type</label>
                  <select class="rq-type">
                    ${allowed
                      .map((type) => {
                        const label =
                          type === "tfng" ? "True/False/Not Given" : type === "gap" ? "Gap Filling" : "MCQ";
                        return `<option value="${type}">${label}</option>`;
                      })
                      .join("")}
                  </select>
                </div>
                <div>
                  <label>Question text</label>
                  <input class="rq-text" type="text" placeholder="Enter the question" />
                </div>
              </div>
              <div class="rq-options"></div>
              <div class="rq-gap" style="display:none">
                <label>Correct answer</label>
                <input class="rq-gap-answer" type="text" placeholder="Enter correct word or phrase" />
              </div>
              <div class="row">
                <div class="rq-answer-wrap">
                  <label>Correct answer</label>
                  <select class="rq-answer"></select>
                </div>
                <div>
                  <button class="btn btn-outline rq-remove" type="button">Remove</button>
                </div>
              </div>
            `;
            row.appendChild(item);
            const typeSelect = qs(".rq-type", item);
            const textInput = qs(".rq-text", item);
            const gapWrap = qs(".rq-gap", item);
            const gapInput = qs(".rq-gap-answer", item);
            const optionsWrap = qs(".rq-options", item);
            const answerSelect = qs(".rq-answer", item);
            const answerWrap = qs(".rq-answer-wrap", item);
            const renderOptions = (type) => {
              const optionList = readingQuestionDefaults[type] || readingQuestionDefaults.mcq;
              if (type === "gap") {
                optionsWrap.innerHTML = "";
                if (answerWrap) answerWrap.style.display = "none";
                if (gapWrap) gapWrap.style.display = "block";
                if (gapInput) gapInput.value = question.answerText || "";
                return;
              }
              if (gapWrap) gapWrap.style.display = "none";
              if (answerWrap) answerWrap.style.display = "block";
              optionsWrap.innerHTML = optionList
                .map(
                  (opt, idx) => `
                    <div>
                      <label>Option ${idx + 1}</label>
                      <input class="rq-option" data-index="${idx}" type="text" value="${
                        (question.options && question.options[idx]) || opt
                      }" ${type === "tfng" ? "disabled" : ""} />
                    </div>
                  `
                )
                .join("");
              const options = qsa(".rq-option", optionsWrap).map((input) => input.value.trim());
              answerSelect.innerHTML = options
                .map((opt, idx) => `<option value="${idx}">${opt || `Option ${idx + 1}`}</option>`)
                .join("");
              answerSelect.value = Number.isInteger(question.answerIndex) ? String(question.answerIndex) : "0";
            };
            typeSelect.value = allowed.includes(question.type) ? question.type : allowed[0];
            textInput.value = question.text || "";
            renderOptions(typeSelect.value);
            typeSelect.addEventListener("change", () => renderOptions(typeSelect.value));
            qs(".rq-remove", item).addEventListener("click", () => item.remove());
          }
        });
      }
    }
  };

  const toggleEditors = () => {
    const reading = isReadingSection();
    if (readingPartsWrap) {
      ensureReadingPartsUI();
      readingPartsWrap.style.display = reading ? "block" : "none";
    }
    if (passageWrap) {
      passageWrap.style.display = reading ? "none" : "block";
    }
    if (testTypeSelect) {
      testTypeSelect.disabled = reading;
      if (reading) testTypeSelect.value = "mcq";
    }
    if (reading) {
      if (questionsSection) questionsSection.style.display = "none";
    } else {
      toggleQuestions();
    }
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
      answerIndex: Number.isInteger(question.answerIndex) ? question.answerIndex : 0,
      answerText: question.answerText || ""
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

  const renderOptions = (row, type, options, answerIndex, answerText) => {
    const wrap = qs(".q-options", row);
    const gapWrap = qs(".q-gap", row);
    const answerSelect = qs(".q-answer", row);
    const answerWrap = qs(".q-answer-wrap", row);
    const fixed = type === "tfng";
    const optionList = options && options.length ? options : questionDefaults[type];

    if (type === "gap") {
      wrap.innerHTML = "";
      if (answerWrap) answerWrap.style.display = "none";
      if (gapWrap) {
        gapWrap.style.display = "block";
        const input = qs(".q-gap-answer", gapWrap);
        if (input) input.value = answerText || "";
      }
      return;
    }

    if (gapWrap) gapWrap.style.display = "none";
    if (answerWrap) answerWrap.style.display = "block";
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

    if (answerSelect) {
      answerSelect.innerHTML = optionList
        .map((opt, idx) => `<option value="${idx}">${opt}</option>`)
        .join("");
      answerSelect.value = Number.isInteger(answerIndex) ? String(answerIndex) : "0";
    }

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
            <option value="gap">Gap Filling</option>
          </select>
        </div>
        <div>
          <label>Question text</label>
          <input class="q-text" type="text" placeholder="Enter question or statement" />
        </div>
      </div>
      <div class="q-options"></div>
      <div class="q-gap" style="display:none">
        <label>Correct answer</label>
        <input class="q-gap-answer" type="text" placeholder="Enter correct word or phrase" />
      </div>
      <div class="row">
        <div class="q-answer-wrap">
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
    renderOptions(row, q.type, q.options, q.answerIndex, q.answerText);

    qs(".q-type", row).addEventListener("change", (e) => {
      const newType = e.target.value;
      renderOptions(row, newType, questionDefaults[newType], 0, "");
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
      if (type === "gap") {
        const answerText = (qs(".q-gap-answer", row)?.value || "").trim();
        return {
          id: row.dataset.qid || `q-${Date.now()}-${idx}`,
          type,
          text,
          answerText
        };
      }
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
    if (isReadingSection()) {
      questionsSection.style.display = "none";
      return;
    }
    const isMcq = (testTypeSelect || qs("#test-type")).value === "mcq";
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
        if (testSectionSelect) testSectionSelect.value = test.section;
        if (testTypeSelect) testTypeSelect.value = test.type;
        if (test.section === "reading" && Array.isArray(test.questions) && test.questions.some((q) => q.kind === "part")) {
          resetReadingParts();
          setReadingParts(test.questions);
          setQuestions([]);
          setEditorContent("test-passage", "");
        } else {
          setEditorContent("test-passage", test.passage || test.prompt || "");
          setQuestions(test.questions || []);
        }
        setEditorContent("test-rubric", test.rubric || "");
        toggleEditors();
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

    if (testTypeSelect) {
      testTypeSelect.addEventListener("change", toggleEditors);
    }
    if (testSectionSelect) {
      testSectionSelect.addEventListener("change", toggleEditors);
    }

    testForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      testMsg.style.display = "none";

      const idRaw = qs("#test-id").value.trim();
      const title = qs("#test-title").value.trim();
      const section = testSectionSelect ? testSectionSelect.value : qs("#test-section").value;
      const isReading = section === "reading";
      const type = isReading ? "mcq" : (testTypeSelect ? testTypeSelect.value : qs("#test-type").value);
      const passage = getEditorContent("test-passage");
      const rubric = getEditorContent("test-rubric");

      if (!title) {
        testMsg.textContent = "Title is required.";
        testMsg.style.display = "block";
        return;
      }

      let questions = [];
      if (isReading) {
        questions = collectReadingParts();
        const part1 = questions[0];
        const part2 = questions[1];
        const part3 = questions[2];
        const part4 = questions[3];
        const part5 = questions[4];
        const missing =
          !part1?.passage ||
          part1.gaps.some((g) => !g.answerText) ||
          part2.choices.some((c) => !c) ||
          part2.items.some((i) => !i) ||
          part2.answers.some((a) => a === null || a === undefined) ||
          part3.choices.some((c) => !c) ||
          part3.items.some((i) => !i) ||
          part3.answers.some((a) => a === null || a === undefined) ||
          !part4?.passage ||
          !part5?.passage;
        if (missing) {
          testMsg.textContent = "Please complete all Reading part fields and answers.";
          testMsg.style.display = "block";
          return;
        }
      } else if (type === "mcq") {
        questions = collectQuestions();
        if (!questions.length) {
          testMsg.textContent = "Please add at least one question.";
          testMsg.style.display = "block";
          return;
        }
        const emptyText = questions.some((q) => !q.text);
        const emptyOption = questions.some(
          (q) => q.type !== "gap" && q.options.some((o) => !o)
        );
        const emptyGap = questions.some((q) => q.type === "gap" && !q.answerText);
        if (emptyText || emptyOption || emptyGap) {
          testMsg.textContent = "Please fill all question texts and answers.";
          testMsg.style.display = "block";
          return;
        }
      }

      const payload = {
        title,
        section,
        type,
        passage: isReading ? "" : type === "mcq" ? passage : "",
        prompt: isReading ? "" : type !== "mcq" ? passage : "",
        questions: isReading ? questions : type === "mcq" ? questions : [],
        rubric
      };

      if (idRaw) {
        await apiRequest(`/tests/${idRaw}`, { method: "PUT", body: payload });
      } else {
        await apiRequest("/tests", { method: "POST", body: payload });
      }

      testForm.reset();
      setEditorContent("test-passage", "");
      setEditorContent("test-rubric", "");
      setQuestions([]);
      resetReadingParts();
      toggleEditors();
      await renderTests();
      testMsg.textContent = "Saved.";
      testMsg.style.display = "block";
    });

    qs("#test-clear").addEventListener("click", () => {
      testForm.reset();
      setEditorContent("test-passage", "");
      setEditorContent("test-rubric", "");
      setQuestions([]);
      resetReadingParts();
      toggleEditors();
    });
  }

  initEditors();
  await renderTests();
  setQuestions([]);
  resetReadingParts();
  toggleEditors();

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
        setEditorContent("grammar-content", lesson.content);
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
      const content = getEditorContent("grammar-content");

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
      setEditorContent("grammar-content", "");
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
  applyTheme(getPreferredTheme());
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
    case "score":
      await initScorePage();
      break;
    case "admin-hub":
      initAdminHubPage();
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
