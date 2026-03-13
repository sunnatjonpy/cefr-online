const STORAGE_KEYS = {
  users: "cefr_users",
  currentUser: "cefr_current_user",
  tests: "cefr_tests",
  vocabSets: "cefr_vocab_sets",
  grammarLessons: "cefr_grammar_lessons",
  attempts: "cefr_attempts",
  seedDone: "cefr_seed_done"
};
const THEME_KEY = "cefr_theme";

const ADMIN_CREDENTIALS = {
  id: "admin-1",
  name: "CEFR Admin",
  email: "admin@cefr.uz",
  password: "Admin123!",
  role: "admin"
};

const SECTION_LABELS = {
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  speaking: "Speaking"
};

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

const load = (key, fallback) => {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const save = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const ensureAdminUser = () => {
  const users = load(STORAGE_KEYS.users, []);
  const exists = users.some((u) => u.email === ADMIN_CREDENTIALS.email);
  if (!exists) {
    users.push({
      id: ADMIN_CREDENTIALS.id,
      name: ADMIN_CREDENTIALS.name,
      email: ADMIN_CREDENTIALS.email,
      password: ADMIN_CREDENTIALS.password,
      role: "admin"
    });
    save(STORAGE_KEYS.users, users);
  }
};

const seedIfEmpty = () => {
  const seedFlag = localStorage.getItem(STORAGE_KEYS.seedDone);
  const hasData =
    localStorage.getItem(STORAGE_KEYS.tests) ||
    localStorage.getItem(STORAGE_KEYS.vocabSets) ||
    localStorage.getItem(STORAGE_KEYS.grammarLessons);

  if (seedFlag || hasData) {
    if (!seedFlag) localStorage.setItem(STORAGE_KEYS.seedDone, "1");
    ensureAdminUser();
    return;
  }

  const tests = [
    {
      id: "reading-1",
      section: "reading",
      title: "Test 1: Urban Rhythms",
      type: "mcq",
      passage:
        "Cities speak in patterns. From the early-morning bakery lines to the late-night tram bells, urban life is a layered rhythm of sound and light. Researchers who study walkable cities have found that people tend to cluster around short routes that offer predictable stops. This predictability lowers stress and makes streets feel safer. Yet, too much predictability can make city life feel monotonous, which is why planners add plazas, pocket parks, and art installations. These small surprises create micro-moments of attention. The best cities, therefore, feel both steady and alive, balancing routine with discovery.",
      questions: [
        {
          id: "r1-q1",
          text: "What is the main idea of the passage?",
          options: [
            "Cities should remove predictable routes to reduce stress.",
            "A balance of routine and surprise makes cities feel alive.",
            "Urban noise causes people to avoid public transport.",
            "Plazas are the only solution to city monotony."
          ],
          answerIndex: 1
        },
        {
          id: "r1-q2",
          text: "Why do planners add plazas and pocket parks?",
          options: [
            "To increase traffic congestion.",
            "To create unexpected moments of attention.",
            "To reduce pedestrian movement.",
            "To make cities more predictable."
          ],
          answerIndex: 1
        },
        {
          id: "r1-q3",
          text: "What effect does predictable routing have?",
          options: [
            "It raises stress levels.",
            "It makes streets feel safer.",
            "It removes the need for art.",
            "It increases monotony and risk."
          ],
          answerIndex: 1
        },
        {
          id: "r1-q4",
          text: "Which phrase best captures the author's view?",
          options: [
            "Routine is always harmful.",
            "Surprise should replace structure.",
            "Cities thrive on steady rhythms and discovery.",
            "Safety is unrelated to design."
          ],
          answerIndex: 2
        },
        {
          id: "r1-q5",
          text: "The passage implies that art installations are valuable because they:",
          options: [
            "block pedestrian flow.",
            "create micro-moments of attention.",
            "reduce maintenance costs.",
            "increase predictability."
          ],
          answerIndex: 1
        },
        {
          id: "r1-q6",
          text: "Which of the following is not mentioned as part of urban rhythm?",
          options: [
            "Bakery lines.",
            "Tram bells.",
            "Pocket parks.",
            "Mountain trails."
          ],
          answerIndex: 3
        },
        {
          id: "r1-q7",
          text: "What does the author say about predictability?",
          options: [
            "It always increases creativity.",
            "It lowers stress but can be monotonous.",
            "It is unrelated to safety.",
            "It replaces public plazas."
          ],
          answerIndex: 1
        },
        {
          id: "r1-q8",
          text: "The best cities are described as:",
          options: [
            "fully unpredictable.",
            "mostly quiet and empty.",
            "steady yet alive.",
            "built only around transport hubs."
          ],
          answerIndex: 2
        }
      ]
    },
    {
      id: "reading-2",
      section: "reading",
      title: "Test 2: The Memory of Ice",
      type: "mcq",
      passage:
        "Glaciers record the climate like pages in a book. Each winter adds a pale layer of snow, and each summer compresses it, trapping tiny bubbles of air. Scientists drill ice cores to read these layers, analyzing gases that reveal temperatures from thousands of years ago. Recently, researchers have noticed that the top layers melt more quickly, which blurs the most recent records. This does not erase the past, but it makes it harder to compare modern climate signals with older ones. Protecting polar regions, therefore, is not only about wildlife; it is also about preserving the planet's memory.",
      questions: [
        {
          id: "r2-q1",
          text: "What is the passage mainly about?",
          options: [
            "How glaciers help scientists read climate history.",
            "Why drilling ice cores is too expensive.",
            "The dangers of wildlife in polar regions.",
            "Why summer snow is always pale."
          ],
          answerIndex: 0
        },
        {
          id: "r2-q2",
          text: "What do trapped air bubbles reveal?",
          options: [
            "Glacier thickness.",
            "Ancient temperatures.",
            "Ocean salinity.",
            "Wind direction."
          ],
          answerIndex: 1
        },
        {
          id: "r2-q3",
          text: "What problem do researchers face recently?",
          options: [
            "The oldest layers are missing.",
            "Top layers melt, blurring recent records.",
            "Ice cores are too cold to read.",
            "Polar bears destroy equipment."
          ],
          answerIndex: 1
        },
        {
          id: "r2-q4",
          text: "Protecting polar regions helps because it:",
          options: [
            "removes climate signals.",
            "preserves the planet's memory.",
            "warms the oceans.",
            "increases snowfall."
          ],
          answerIndex: 1
        },
        {
          id: "r2-q5",
          text: "Which statement best matches the author's view?",
          options: [
            "Glaciers are only important for wildlife.",
            "Modern climate data is perfectly clear.",
            "Ice cores act as historical climate records.",
            "Snow layers disappear every winter."
          ],
          answerIndex: 2
        },
        {
          id: "r2-q6",
          text: "The passage implies that melting affects:",
          options: [
            "only deep ice layers.",
            "the readability of recent climate history.",
            "the existence of all ice cores.",
            "the number of winter storms."
          ],
          answerIndex: 1
        }
      ]
    },
    {
      id: "listening-1",
      section: "listening",
      title: "Test 1: Startup Culture",
      type: "mcq",
      passage:
        "Audio Script: A founder explains how small teams decide priorities. She says that weekly planning is only useful when it leads to quick experiments. Without experiments, meetings become noise. The team uses a simple rule: build, measure, learn. They keep a visible board of assumptions and update it every Friday.",
      questions: [
        {
          id: "l1-q1",
          text: "What does the founder say about weekly planning?",
          options: [
            "It is useless in all cases.",
            "It matters only when experiments follow.",
            "It should be replaced by monthly reviews.",
            "It should be done without metrics."
          ],
          answerIndex: 1
        },
        {
          id: "l1-q2",
          text: "What is the team's rule?",
          options: [
            "Pitch, hire, grow.",
            "Build, measure, learn.",
            "Plan, wait, decide.",
            "Design, debate, delay."
          ],
          answerIndex: 1
        },
        {
          id: "l1-q3",
          text: "Why are meetings a problem?",
          options: [
            "They cost too little.",
            "They create noise without experiments.",
            "They remove visibility.",
            "They prevent learning entirely."
          ],
          answerIndex: 1
        },
        {
          id: "l1-q4",
          text: "How often is the assumptions board updated?",
          options: [
            "Every Monday.",
            "Every Friday.",
            "Every quarter.",
            "Every year."
          ],
          answerIndex: 1
        }
      ]
    },
    {
      id: "listening-2",
      section: "listening",
      title: "Test 2: The Local Market",
      type: "mcq",
      passage:
        "Audio Script: A reporter describes a neighborhood market that opened at 6 a.m. Vendors arrange fruit by color to catch the eye. Shoppers say the market feels personal because the sellers remember their names. The reporter notes that small design details, like handwritten signs, make the space feel warm.",
      questions: [
        {
          id: "l2-q1",
          text: "What time does the market open?",
          options: ["6 a.m.", "8 a.m.", "10 a.m.", "Noon."],
          answerIndex: 0
        },
        {
          id: "l2-q2",
          text: "How do vendors arrange fruit?",
          options: ["By size", "By color", "By price", "By season"],
          answerIndex: 1
        },
        {
          id: "l2-q3",
          text: "Why do shoppers feel the market is personal?",
          options: [
            "The market is expensive.",
            "Sellers remember their names.",
            "There are many chains.",
            "There is a new building."
          ],
          answerIndex: 1
        },
        {
          id: "l2-q4",
          text: "What detail makes the space feel warm?",
          options: [
            "Handwritten signs.",
            "Bright neon lights.",
            "Large advertising screens.",
            "Silent aisles."
          ],
          answerIndex: 0
        }
      ]
    },
    {
      id: "writing-1",
      section: "writing",
      title: "Test 1: Problem-Solution Essay",
      type: "writing",
      prompt:
        "Many cities struggle with traffic congestion. Write an essay explaining two causes of congestion and two solutions. Support your ideas with examples.",
      rubric:
        "Evaluate your response on clarity, organization, vocabulary, and grammar."
    },
    {
      id: "writing-2",
      section: "writing",
      title: "Test 2: Comparative Report",
      type: "writing",
      prompt:
        "Compare two learning methods: online courses and in-person classes. Discuss advantages and disadvantages of each and recommend one for adult learners.",
      rubric:
        "Evaluate your response on task response, coherence, and lexical range."
    },
    {
      id: "speaking-1",
      section: "speaking",
      title: "Test 1: Personal Experience",
      type: "speaking",
      prompt:
        "Describe a challenging project you completed. Include what made it difficult, how you organized your time, and what you learned.",
      rubric:
        "Evaluate your response on fluency, pronunciation, vocabulary, and grammar."
    },
    {
      id: "speaking-2",
      section: "speaking",
      title: "Test 2: Future Trends",
      type: "speaking",
      prompt:
        "Talk about a future technology you think will change daily life. Explain why and how it might affect society.",
      rubric:
        "Evaluate your response on fluency, clarity, and idea development."
    }
  ];

  const vocabSets = [
    {
      id: "vocab-1",
      title: "Academic Verbs",
      level: "B2",
      words: [
        "analyze",
        "illustrate",
        "evaluate",
        "contrast",
        "synthesize",
        "interpret",
        "justify",
        "summarize",
        "predict",
        "clarify"
      ]
    },
    {
      id: "vocab-2",
      title: "Workplace Collaboration",
      level: "B1",
      words: [
        "align",
        "delegate",
        "brainstorm",
        "feedback",
        "milestone",
        "ownership",
        "deadline",
        "stakeholder",
        "iteration",
        "blocker"
      ]
    }
  ];

  const grammarLessons = [
    {
      id: "grammar-1",
      title: "Narrative Tenses",
      level: "B2",
      content:
        "Use past simple for main events and past continuous for background actions. Past perfect helps show an earlier past action. Example: 'I was walking home when I realized I had left my keys at work.'"
    },
    {
      id: "grammar-2",
      title: "Conditionals Overview",
      level: "B1",
      content:
        "Zero conditional for facts, first conditional for real future, second conditional for unreal present, third conditional for unreal past. Example: 'If I had studied, I would have passed.'"
    }
  ];

  const users = [
    {
      id: ADMIN_CREDENTIALS.id,
      name: ADMIN_CREDENTIALS.name,
      email: ADMIN_CREDENTIALS.email,
      password: ADMIN_CREDENTIALS.password,
      role: "admin"
    }
  ];

  save(STORAGE_KEYS.tests, tests);
  save(STORAGE_KEYS.vocabSets, vocabSets);
  save(STORAGE_KEYS.grammarLessons, grammarLessons);
  save(STORAGE_KEYS.users, users);
  save(STORAGE_KEYS.attempts, []);
  localStorage.setItem(STORAGE_KEYS.seedDone, "1");
};
const getCurrentUser = () => load(STORAGE_KEYS.currentUser, null);

const setCurrentUser = (user) => {
  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
    return;
  }
  save(STORAGE_KEYS.currentUser, user);
};

const login = (email, password) => {
  if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
    ensureAdminUser();
    setCurrentUser({
      id: ADMIN_CREDENTIALS.id,
      name: ADMIN_CREDENTIALS.name,
      email: ADMIN_CREDENTIALS.email,
      role: "admin"
    });
    return { ok: true };
  }

  const users = load(STORAGE_KEYS.users, []);
  const user = users.find(
    (u) => u.email === email && u.password === password && u.role === "user"
  );

  if (!user) {
    return { ok: false, error: "Invalid credentials." };
  }

  setCurrentUser({ id: user.id, name: user.name, email: user.email, role: user.role });
  return { ok: true };
};

const signup = (form) => {
  const users = load(STORAGE_KEYS.users, []);
  const emailTaken =
    users.some((u) => u.email === form.email) || form.email === ADMIN_CREDENTIALS.email;

  if (emailTaken) {
    return { ok: false, error: "Email already exists." };
  }

  const newUser = {
    id: `user-${Date.now()}`,
    name: form.name,
    email: form.email,
    password: form.password,
    role: "user"
  };

  users.push(newUser);
  save(STORAGE_KEYS.users, users);
  setCurrentUser({ id: newUser.id, name: newUser.name, email: newUser.email, role: "user" });
  return { ok: true };
};

const logout = () => {
  setCurrentUser(null);
  window.location.href = "index.html";
};

const requireAuth = () => {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "index.html";
    return null;
  }
  return user;
};

const requireAdmin = () => {
  const user = requireAuth();
  if (!user || user.role !== "admin") {
    window.location.href = "dashboard.html";
    return null;
  }
  return user;
};

const listTests = (section) => {
  const tests = load(STORAGE_KEYS.tests, []);
  if (!section) return tests;
  return tests.filter((t) => t.section === section);
};

const getTestById = (id) => {
  const tests = load(STORAGE_KEYS.tests, []);
  return tests.find((t) => t.id === id);
};

const upsertTest = (test) => {
  const tests = load(STORAGE_KEYS.tests, []);
  const idx = tests.findIndex((t) => t.id === test.id);
  if (idx >= 0) {
    tests[idx] = test;
  } else {
    tests.push(test);
  }
  save(STORAGE_KEYS.tests, tests);
};

const deleteTest = (id) => {
  const tests = load(STORAGE_KEYS.tests, []);
  save(
    STORAGE_KEYS.tests,
    tests.filter((t) => t.id !== id)
  );
};

const listVocabSets = () => load(STORAGE_KEYS.vocabSets, []);
const upsertVocabSet = (set) => {
  const sets = load(STORAGE_KEYS.vocabSets, []);
  const idx = sets.findIndex((s) => s.id === set.id);
  if (idx >= 0) sets[idx] = set;
  else sets.push(set);
  save(STORAGE_KEYS.vocabSets, sets);
};
const deleteVocabSet = (id) => {
  const sets = load(STORAGE_KEYS.vocabSets, []);
  save(
    STORAGE_KEYS.vocabSets,
    sets.filter((s) => s.id !== id)
  );
};

const listGrammarLessons = () => load(STORAGE_KEYS.grammarLessons, []);
const upsertGrammarLesson = (lesson) => {
  const lessons = load(STORAGE_KEYS.grammarLessons, []);
  const idx = lessons.findIndex((l) => l.id === lesson.id);
  if (idx >= 0) lessons[idx] = lesson;
  else lessons.push(lesson);
  save(STORAGE_KEYS.grammarLessons, lessons);
};
const deleteGrammarLesson = (id) => {
  const lessons = load(STORAGE_KEYS.grammarLessons, []);
  save(
    STORAGE_KEYS.grammarLessons,
    lessons.filter((l) => l.id !== id)
  );
};

const saveAttempt = (attempt) => {
  const attempts = load(STORAGE_KEYS.attempts, []);
  attempts.push(attempt);
  save(STORAGE_KEYS.attempts, attempts);
};

const listAttemptsByUser = (userId) => {
  const attempts = load(STORAGE_KEYS.attempts, []);
  return attempts.filter((a) => a.userId === userId);
};

const getParam = (name) => new URLSearchParams(window.location.search).get(name);

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

const renderHeader = () => {
  const container = qs("#site-header");
  if (!container) return;
  const user = getCurrentUser();
  const isAdmin = user && user.role === "admin";

  container.innerHTML = `
    <nav class="nav">
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
      <div class="nav-links">
        <a href="dashboard.html">Dashboard</a>
        <a href="mock.html">Take a Mock</a>
        <a href="vocabulary.html">Vocabulary</a>
        <a href="grammar.html">Grammar</a>
        <a href="tutorials.html">Tutorials</a>
        ${isAdmin ? '<a href="admin.html">Admin</a>' : ""}
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
        ${user ? '<button class="btn btn-outline" id="logout-btn">Logout</button>' : '<a class="btn btn-outline" href="index.html">Login</a>'}
      </div>
    </nav>
  `;

  const logoutBtn = qs("#logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  applyTheme(getPreferredTheme());
  qsa(".theme-toggle-input").forEach((input) => {
    input.addEventListener("change", (event) => {
      const next = event.target.checked ? "dark" : "light";
      applyTheme(next);
    });
  });
};
const initLoginPage = () => {
  const user = getCurrentUser();
  if (user) {
    window.location.href = "dashboard.html";
    return;
  }

  const form = qs("#login-form");
  const msg = qs("#login-msg");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = qs("#email").value.trim();
    const password = qs("#password").value.trim();
    const result = login(email, password);
    if (!result.ok) {
      msg.textContent = result.error || "Login failed.";
      msg.style.display = "block";
      return;
    }
    window.location.href = "dashboard.html";
  });
};

const initSignupPage = () => {
  const user = getCurrentUser();
  if (user) {
    window.location.href = "dashboard.html";
    return;
  }

  const form = qs("#signup-form");
  const msg = qs("#signup-msg");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = qs("#name").value.trim();
    const email = qs("#email").value.trim();
    const password = qs("#password").value.trim();
    const result = signup({ name, email, password });
    if (!result.ok) {
      msg.textContent = result.error || "Signup failed.";
      msg.style.display = "block";
      return;
    }
    window.location.href = "dashboard.html";
  });
};

const initDashboardPage = () => {
  const user = requireAuth();
  if (!user) return;

  const nameEl = qs("#user-name");
  if (nameEl) nameEl.textContent = user.name;

  qsa("[data-role='admin-only']").forEach((el) => {
    el.style.display = user.role === "admin" ? "block" : "none";
  });

  const attempts = listAttemptsByUser(user.id);
  const list = qs("#recent-attempts");
  if (list) {
    if (attempts.length === 0) {
      list.innerHTML = '<div class="notice">No attempts yet. Start a mock test to see progress.</div>';
    } else {
      const items = attempts
        .slice(-4)
        .reverse()
        .map((a) => {
          const test = getTestById(a.testId);
          return `
            <div class="list-item">
              <strong>${test ? test.title : "Mock Test"}</strong>
              <span class="badge">${SECTION_LABELS[a.section] || a.section}</span>
              <span>Score: ${a.score ?? "Self"}</span>
              <span>${formatDate(a.createdAt)}</span>
            </div>
          `;
        })
        .join("");
      list.innerHTML = items;
    }
  }
};

const initSectionPage = () => {
  const user = requireAuth();
  if (!user) return;

  const section = getParam("section") || "reading";
  const header = qs("#section-title");
  if (header) header.textContent = `${SECTION_LABELS[section] || section} Tests`;

  const grid = qs("#tests-grid");
  const tests = listTests(section);
  if (grid) {
    if (tests.length === 0) {
      grid.innerHTML = '<div class="notice">No tests available yet. Ask an admin to add more.</div>';
      return;
    }
    grid.innerHTML = tests
      .map(
        (t, idx) => `
        <a class="card" href="test.html?section=${section}&id=${t.id}" style="--delay:${idx * 0.05}s">
          <span class="tag">${SECTION_LABELS[section]}</span>
          <h3>${t.title}</h3>
          <p>${t.type === "mcq" ? "Multiple choice" : "Performance prompt"}</p>
          <span class="chip">Start Test</span>
          <span class="accent"></span>
        </a>
      `
      )
      .join("");
  }
};

const initTestPage = () => {
  const user = requireAuth();
  if (!user) return;

  const testId = getParam("id");
  const test = getTestById(testId);
  const container = qs("#test-container");

  if (!test || !container) {
    if (container) container.innerHTML = '<div class="notice">Test not found.</div>';
    return;
  }

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
      test.questions
        .map(
          (q, idx) => `
        <div class="list-item">
          <strong>Q${idx + 1}. ${q.text}</strong>
          ${q.options
            .map(
              (opt, optIdx) => `
              <label>
                <input type="radio" name="${q.id}" value="${optIdx}" /> ${opt}
              </label>
            `
            )
            .join("")}
        </div>
      `
        )
        .join("") +
      '<button class="btn btn-primary" type="submit">Submit Answers</button>';

    form.addEventListener("submit", (e) => {
      e.preventDefault();
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
      saveAttempt({
        id: `attempt-${Date.now()}`,
        userId: user.id,
        testId: test.id,
        section: test.section,
        type: test.type,
        score,
        answers,
        createdAt: new Date().toISOString()
      });

      msg.textContent = `Saved! Your score is ${score}.`;
      msg.style.display = "block";
      form.reset();
    });
  } else {
    form.innerHTML = `
      <label>Your response</label>
      <textarea id="response" placeholder="Write or outline your answer..."></textarea>
      <label>Self-score (0-30)</label>
      <input type="number" id="self-score" min="0" max="30" value="20" />
      <button class="btn btn-primary" type="submit">Save Attempt</button>
    `;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const response = qs("#response").value.trim();
      const score = Number(qs("#self-score").value || 0);

      saveAttempt({
        id: `attempt-${Date.now()}`,
        userId: user.id,
        testId: test.id,
        section: test.section,
        type: test.type,
        score,
        response,
        createdAt: new Date().toISOString()
      });

      msg.textContent = "Saved! Your response has been recorded.";
      msg.style.display = "block";
      form.reset();
    });
  }
};

const initVocabularyPage = () => {
  const user = requireAuth();
  if (!user) return;
  const list = qs("#vocab-list");
  const sets = listVocabSets();
  if (!list) return;

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
};

const initGrammarPage = () => {
  const user = requireAuth();
  if (!user) return;
  const list = qs("#grammar-list");
  const lessons = listGrammarLessons();
  if (!list) return;

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
};

const initTutorialsPage = () => {
  const user = requireAuth();
  if (!user) return;
};

const initProfilePage = () => {
  const user = requireAuth();
  if (!user) return;

  const nameEl = qs("#profile-name");
  const emailEl = qs("#profile-email");
  if (nameEl) nameEl.textContent = user.name;
  if (emailEl) emailEl.textContent = user.email;

  const list = qs("#attempts-list");
  if (!list) return;
  const attempts = listAttemptsByUser(user.id).reverse();

  if (attempts.length === 0) {
    list.innerHTML = '<div class="notice">No attempts yet.</div>';
    return;
  }

  list.innerHTML = attempts
    .map((a) => {
      const test = getTestById(a.testId);
      return `
        <div class="list-item">
          <strong>${test ? test.title : "Mock Test"}</strong>
          <span class="badge">${SECTION_LABELS[a.section] || a.section}</span>
          <span>Score: ${a.score ?? "Self"}</span>
          <span>${formatDate(a.createdAt)}</span>
        </div>
      `;
    })
    .join("");
};

const initAdminPage = () => {
  const user = requireAdmin();
  if (!user) return;

  const usersTable = qs("#users-table");
  const users = load(STORAGE_KEYS.users, []);
  if (usersTable) {
    usersTable.innerHTML = users
      .map(
        (u) => `
        <tr>
          <td>${u.name}</td>
          <td>${u.email}</td>
          <td>${u.role}</td>
        </tr>
      `
      )
      .join("");
  }

  const testForm = qs("#test-form");
  const testMsg = qs("#test-msg");
  const testList = qs("#test-list");

  const renderTests = () => {
    const tests = listTests();
    if (!testList) return;
    testList.innerHTML = tests
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
        const id = btn.dataset.editTest;
        const test = getTestById(id);
        if (!test) return;
        qs("#test-id").value = test.id;
        qs("#test-title").value = test.title;
        qs("#test-section").value = test.section;
        qs("#test-type").value = test.type;
        qs("#test-passage").value = test.passage || test.prompt || "";
        qs("#test-questions").value =
          test.questions && test.questions.length ? JSON.stringify(test.questions, null, 2) : "";
      });
    });

    qsa("[data-delete-test]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.deleteTest;
        deleteTest(id);
        renderTests();
      });
    });
  };

  if (testForm) {
    testForm.addEventListener("submit", (e) => {
      e.preventDefault();
      testMsg.style.display = "none";

      const idRaw = qs("#test-id").value.trim();
      const title = qs("#test-title").value.trim();
      const section = qs("#test-section").value;
      const type = qs("#test-type").value;
      const passage = qs("#test-passage").value.trim();
      const questionsRaw = qs("#test-questions").value.trim();

      if (!title) {
        testMsg.textContent = "Title is required.";
        testMsg.style.display = "block";
        return;
      }

      let questions = [];
      if (type === "mcq") {
        if (!questionsRaw) {
          testMsg.textContent = "Questions JSON is required for MCQ tests.";
          testMsg.style.display = "block";
          return;
        }
        try {
          questions = JSON.parse(questionsRaw);
        } catch {
          testMsg.textContent = "Invalid JSON format.";
          testMsg.style.display = "block";
          return;
        }
      }

      const testId = idRaw || `${section}-${Date.now()}`;
      const test = {
        id: testId,
        section,
        title,
        type,
        passage: type === "mcq" ? passage : "",
        prompt: type !== "mcq" ? passage : "",
        questions: type === "mcq" ? questions : []
      };

      upsertTest(test);
      testForm.reset();
      renderTests();
      testMsg.textContent = "Saved.";
      testMsg.style.display = "block";
    });

    qs("#test-clear").addEventListener("click", () => testForm.reset());
  }

  renderTests();

  const vocabForm = qs("#vocab-form");
  const vocabList = qs("#vocab-admin-list");
  const vocabMsg = qs("#vocab-msg");

  const renderVocab = () => {
    const sets = listVocabSets();
    if (!vocabList) return;
    vocabList.innerHTML = sets
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
        const id = btn.dataset.editVocab;
        const set = listVocabSets().find((v) => v.id === id);
        if (!set) return;
        qs("#vocab-id").value = set.id;
        qs("#vocab-title").value = set.title;
        qs("#vocab-level").value = set.level;
        qs("#vocab-words").value = set.words.join(", ");
      });
    });

    qsa("[data-delete-vocab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        deleteVocabSet(btn.dataset.deleteVocab);
        renderVocab();
      });
    });
  };

  if (vocabForm) {
    vocabForm.addEventListener("submit", (e) => {
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
      const id = idRaw || `vocab-${Date.now()}`;
      upsertVocabSet({ id, title, level, words });
      vocabForm.reset();
      renderVocab();
      vocabMsg.textContent = "Saved.";
      vocabMsg.style.display = "block";
    });
  }

  renderVocab();

  const grammarForm = qs("#grammar-form");
  const grammarList = qs("#grammar-admin-list");
  const grammarMsg = qs("#grammar-msg");

  const renderGrammar = () => {
    const lessons = listGrammarLessons();
    if (!grammarList) return;
    grammarList.innerHTML = lessons
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
        const id = btn.dataset.editGrammar;
        const lesson = listGrammarLessons().find((g) => g.id === id);
        if (!lesson) return;
        qs("#grammar-id").value = lesson.id;
        qs("#grammar-title").value = lesson.title;
        qs("#grammar-level").value = lesson.level;
        qs("#grammar-content").value = lesson.content;
      });
    });

    qsa("[data-delete-grammar]").forEach((btn) => {
      btn.addEventListener("click", () => {
        deleteGrammarLesson(btn.dataset.deleteGrammar);
        renderGrammar();
      });
    });
  };

  if (grammarForm) {
    grammarForm.addEventListener("submit", (e) => {
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

      const id = idRaw || `grammar-${Date.now()}`;
      upsertGrammarLesson({ id, title, level, content });
      grammarForm.reset();
      renderGrammar();
      grammarMsg.textContent = "Saved.";
      grammarMsg.style.display = "block";
    });
  }

  renderGrammar();
};

const initMockPage = () => {
  const user = requireAuth();
  if (!user) return;
};

const initPage = () => {
  seedIfEmpty();
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
      initDashboardPage();
      break;
    case "mock":
      initMockPage();
      break;
    case "section":
      initSectionPage();
      break;
    case "test":
      initTestPage();
      break;
    case "vocabulary":
      initVocabularyPage();
      break;
    case "grammar":
      initGrammarPage();
      break;
    case "tutorials":
      initTutorialsPage();
      break;
    case "profile":
      initProfilePage();
      break;
    case "admin":
      initAdminPage();
      break;
    default:
      break;
  }
};

document.addEventListener("DOMContentLoaded", initPage);

