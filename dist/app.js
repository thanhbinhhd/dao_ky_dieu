const STORAGE_KEY = "daoKyDieuProgress_v1";
const WORLDS = [
  { name: "Vườn Mầm Non", range: "3 tuổi", icon: "🌱", color: "#62c896", subtitle: "Nhìn và nhận biết" },
  { name: "Rừng Sắc Màu", range: "4 tuổi", icon: "🎨", color: "#5ba9e8", subtitle: "Từ và số quanh em" },
  { name: "Vịnh Tò Mò", range: "5 tuổi", icon: "🔎", color: "#a68be8", subtitle: "Ghép âm và tính nhẩm" },
  { name: "Đỉnh Cầu Vồng", range: "6 tuổi", icon: "🌈", color: "#f48fab", subtitle: "Sẵn sàng vào lớp Một" }
];

const LEVEL_NAMES = [
  "Chào bạn mới", "Màu xinh xắn", "Một và nhiều", "Con vật thân quen", "Hình gì đây?", "Khu vườn nhỏ",
  "Số quanh em", "Bữa sáng vui", "Ai ở đâu?", "Đếm thật khéo", "Màu bằng tiếng Anh", "Phiên chợ nhỏ",
  "Âm đầu tiên", "Cộng thêm một", "So sánh vui", "My little world", "Trừ đi một", "Bí mật chữ cái",
  "Vần thật vui", "Toán trong 20", "A happy day", "Câu nào đúng?", "Thám tử con số", "Kho báu tri thức"
];

const state = loadState();
let currentLevel = 1;
let session = null;
let toastTimer;

function defaultState() {
  return { name: "bé con", unlocked: 1, results: {}, streak: 1, lastPlay: null, sound: true, autoSpeak: true, totalAnswers: 0, totalCorrect: 0 };
}

function loadState() {
  try { return { ...defaultState(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") }; }
  catch { return defaultState(); }
}

function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); renderHeader(); }

function updateStreak() {
  const today = new Date();
  const key = `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;
  if (!state.lastPlay) { state.lastPlay = key; return; }
  if (state.lastPlay === key) return;
  const previous = new Date(state.lastPlay.replaceAll("-", "/"));
  const diff = Math.round((new Date(today.getFullYear(), today.getMonth(), today.getDate()) - previous) / 86400000);
  state.streak = diff === 1 ? state.streak + 1 : 1;
  state.lastPlay = key;
}

function totalStars() { return Object.values(state.results).reduce((sum, item) => sum + (item.stars || 0), 0); }

function renderHeader() {
  document.getElementById("childName").textContent = state.name || "bé con";
  document.getElementById("starCount").textContent = totalStars();
  document.getElementById("streakCount").textContent = state.streak;
  document.getElementById("soundToggle").textContent = state.sound ? "🔊" : "🔇";
  document.getElementById("soundToggle").setAttribute("aria-label", state.sound ? "Tắt âm thanh" : "Bật âm thanh");
  document.getElementById("todayHint").textContent = state.unlocked > 24 ? "Bé đã khám phá cả hòn đảo! Chơi lại để lấy đủ sao nhé." : `Cùng Cáo Cam chinh phục level ${state.unlocked} nhé!`;
}

function renderRoadmap() {
  const map = document.getElementById("roadmap");
  map.innerHTML = WORLDS.map((world, worldIndex) => {
    const start = worldIndex * 6 + 1;
    const levels = Array.from({ length: 6 }, (_, i) => start + i).map(level => {
      const result = state.results[level];
      const locked = level > state.unlocked;
      const current = level === state.unlocked && level <= 24;
      const classes = ["level-node", locked ? "locked" : "", current ? "current" : ""].join(" ");
      const icon = locked ? "🔒" : result ? "✓" : world.icon;
      const stars = result ? `<span class="node-stars">${"★".repeat(result.stars)}${"☆".repeat(3-result.stars)}</span>` : "";
      return `<div class="level-row"><button class="${classes}" data-level="${level}" ${locked ? "disabled" : ""} aria-label="Level ${level}: ${LEVEL_NAMES[level-1]}${locked ? ", chưa mở" : ""}"><b>${level}</b><span class="node-icon">${icon}</span>${stars}</button><div class="level-label"><b>${LEVEL_NAMES[level-1]}</b>${getLevelSkill(level)}</div></div>`;
    }).join("");
    return `<section class="world" style="--world-color:${world.color}"><div class="world-title"><span>${world.icon}</span><b>${world.name}</b><small>${world.range} · ${world.subtitle}</small></div>${levels}</section>`;
  }).join("");
  map.querySelectorAll(".level-node:not(:disabled)").forEach(button => button.addEventListener("click", () => startLevel(Number(button.dataset.level))));
}

function getLevelSkill(level) {
  if (level <= 6) return "Nhận biết bằng hình ảnh";
  if (level <= 12) return "Đếm và gọi tên";
  if (level <= 18) return "Ghép âm, cộng trừ";
  return "Tư duy sẵn sàng lớp Một";
}

function renderBadges() {
  const badges = [
    { icon: "🌱", name: "Mầm xanh", earned: state.unlocked > 6 },
    { icon: "🎨", name: "Họa sĩ nhí", earned: state.unlocked > 12 },
    { icon: "🔎", name: "Nhà tò mò", earned: state.unlocked > 18 },
    { icon: "🏆", name: "Siêu khám phá", earned: state.unlocked > 24 }
  ];
  document.getElementById("badgeShelf").innerHTML = badges.map(b => `<div class="badge ${b.earned ? "earned" : ""}"><span>${b.earned ? b.icon : "🔒"}</span><b>${b.name}</b></div>`).join("");
}

const baseQuestions = {
  0: {
    vi: [
      ["Đâu là quả táo?", "🍎", ["🍎 Táo", "🍌 Chuối", "🐟 Cá", "🚗 Xe"], 0],
      ["Đâu là con mèo?", "🐱", ["🐶 Chó", "🐱 Mèo", "🐰 Thỏ", "🐥 Gà"], 1],
      ["Màu nào giống mặt trời?", "☀️", ["🔵 Xanh", "🟡 Vàng", "🟢 Lá", "🟣 Tím"], 1],
      ["Đâu là hình tròn?", "⚪", ["⭐", "🔺", "⚪", "🟦"], 2],
      ["Con nào sống dưới nước?", "🌊", ["🐟 Cá", "🐈 Mèo", "🐔 Gà", "🦋 Bướm"], 0]
    ],
    en: [
      ["Which one is a cat?", "🐱", ["🐶 Dog", "🐱 Cat", "🐟 Fish", "🐰 Bunny"], 1],
      ["Find the color red.", "🍓", ["🟢 Green", "🔴 Red", "🔵 Blue", "🟡 Yellow"], 1],
      ["Which one is an apple?", "🍎", ["🍌 Banana", "🍎 Apple", "🥕 Carrot", "🍇 Grapes"], 1]
    ],
    math: [
      ["Có mấy quả táo?", "🍎 🍎", ["1", "2", "3", "4"], 1],
      ["Số nào là số 3?", "● ● ●", ["1", "2", "3", "5"], 2],
      ["1 thêm 1 là mấy?", "⭐ + ⭐", ["1", "2", "3", "4"], 1]
    ]
  },
  1: {
    vi: [
      ["Từ nào bắt đầu bằng âm B?", "B b", ["Bé", "Cá", "Gà", "Mèo"], 0],
      ["Đâu là đồ dùng để uống nước?", "🥛", ["Cốc", "Mũ", "Giày", "Bóng"], 0],
      ["Con nào có thể bay?", "☁️", ["🐘 Voi", "🐟 Cá", "🐦 Chim", "🐈 Mèo"], 2],
      ["Quả nào màu vàng?", "🟡", ["🍌 Chuối", "🍓 Dâu", "🍇 Nho", "🥝 Kiwi"], 0]
    ],
    en: [
      ["What color is the leaf?", "🍃", ["Red", "Green", "Blue", "Pink"], 1],
      ["Which one means ‘chó’?", "🐶", ["Cat", "Dog", "Fish", "Bird"], 1],
      ["Find number five.", "5", ["Three", "Five", "One", "Two"], 1],
      ["Which one is big?", "🐘", ["🐜 Ant", "🐘 Elephant", "🐞 Bug", "🐝 Bee"], 1]
    ],
    math: [
      ["Có mấy ngôi sao?", "⭐ ⭐ ⭐ ⭐", ["3", "4", "5", "6"], 1],
      ["2 cộng 1 bằng mấy?", "2 + 1", ["2", "3", "4", "5"], 1],
      ["5 bớt 1 còn mấy?", "5 − 1", ["3", "4", "5", "6"], 1],
      ["Số nào lớn hơn?", "3  ·  7", ["3", "7", "Bằng nhau", "0"], 1]
    ]
  },
  2: {
    vi: [
      ["Chữ nào đứng đầu từ ‘Mèo’?", "🐱", ["M", "N", "B", "C"], 0],
      ["Từ nào cùng vần với ‘cá’?", "CÁ", ["lá", "bé", "to", "mẹ"], 0],
      ["Điền chữ còn thiếu: _é", "👶", ["b", "c", "m", "n"], 0],
      ["Đâu là một câu đầy đủ?", "💬", ["Bé ăn cơm.", "Ăn thật", "Cái bàn và", "Đang vui"], 0]
    ],
    en: [
      ["Complete: This is a ___.", "🐱", ["cat", "dog", "bird", "fish"], 0],
      ["What color is the sky?", "🌤️", ["Blue", "Green", "Red", "Black"], 0],
      ["Which word means ‘mẹ’?", "👩", ["Dad", "Mom", "Baby", "Friend"], 1],
      ["Choose the happy face.", "HAPPY", ["😢 Sad", "😄 Happy", "😠 Angry", "😴 Sleepy"], 1]
    ],
    math: [
      ["4 cộng 3 bằng mấy?", "4 + 3", ["6", "7", "8", "9"], 1],
      ["8 bớt 2 còn mấy?", "8 − 2", ["5", "6", "7", "8"], 1],
      ["Điền số còn thiếu: 3, 4, __, 6", "3 · 4 · ? · 6", ["2", "5", "7", "8"], 1],
      ["Bên nào có nhiều hơn?", "🍓🍓🍓  |  🍓🍓", ["Bên trái", "Bên phải", "Bằng nhau", "Không biết"], 0]
    ]
  },
  3: {
    vi: [
      ["Từ nào cùng vần với ‘mây’?", "☁️ MÂY", ["cây", "mèo", "mưa", "nắng"], 0],
      ["Điền từ đúng: Bé ___ sách.", "📖", ["đọc", "ăn", "ngủ", "bay"], 0],
      ["Từ nào chỉ một hoạt động?", "🏃", ["chạy", "cái bàn", "màu đỏ", "con mèo"], 0],
      ["Sắp xếp nào tạo thành câu đúng?", "💬", ["Bé rất vui.", "Vui bé rất.", "Rất vui bé.", "Vui rất bé."], 0]
    ],
    en: [
      ["Complete: I ___ an apple.", "🍎", ["eat", "sleep", "fly", "swim"], 0],
      ["How are you?", "😄", ["I am happy.", "It is blue.", "I have two.", "This is a cat."], 0],
      ["Choose the opposite of ‘big’.", "↔️", ["small", "tall", "fast", "red"], 0],
      ["Which sentence matches?", "🐶⚽", ["The dog has a ball.", "The cat is sleeping.", "The bird can swim.", "The fish is red."], 0]
    ],
    math: [
      ["9 cộng 5 bằng mấy?", "9 + 5", ["12", "13", "14", "15"], 2],
      ["15 bớt 6 còn mấy?", "15 − 6", ["7", "8", "9", "10"], 2],
      ["Số nào còn thiếu: 2, 4, 6, __", "2 · 4 · 6 · ?", ["7", "8", "9", "10"], 1],
      ["Lan có 7 quả, mẹ cho thêm 3. Lan có mấy quả?", "🍊 + 🍊", ["9", "10", "11", "12"], 1]
    ]
  }
};

function makeQuestions(level) {
  const tier = Math.min(3, Math.floor((level - 1) / 6));
  const bank = baseQuestions[tier];
  const desired = ["vi", "en", "math", "vi", level % 2 ? "math" : "en"];
  const used = new Set();
  return desired.map((subject, index) => {
    const list = bank[subject];
    let pickIndex = (level * 2 + index) % list.length;
    while (used.has(`${subject}-${pickIndex}`)) pickIndex = (pickIndex + 1) % list.length;
    used.add(`${subject}-${pickIndex}`);
    const [text, visual, answers, correct] = list[pickIndex];
    return { subject, text, visual, answers: shuffleAnswers(answers, correct), language: subject === "en" ? "en-US" : "vi-VN" };
  });
}

function shuffleAnswers(answers, correctIndex) {
  const rows = answers.map((label, index) => ({ label, correct: index === correctIndex }));
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }
  return rows;
}

function startLevel(level) {
  currentLevel = level;
  const questions = makeQuestions(level);
  session = { questions, index: 0, correct: 0, started: Date.now(), questionStarted: Date.now(), times: [], answered: false };
  const world = WORLDS[Math.floor((level - 1) / 6)];
  document.getElementById("gameWorld").textContent = `${world.icon} ${world.name.toUpperCase()} · ${world.range}`;
  document.getElementById("gameLevel").textContent = `Level ${level} — ${LEVEL_NAMES[level-1]}`;
  document.getElementById("gameDialog").showModal();
  renderQuestion();
}

function renderQuestion() {
  const q = session.questions[session.index];
  session.answered = false;
  session.questionStarted = Date.now();
  const subjectNames = { vi: "TIẾNG VIỆT", en: "ENGLISH", math: "TOÁN VUI" };
  const subjectColors = { vi: "#f48fab", en: "#5ba9e8", math: "#a68be8" };
  const tag = document.getElementById("subjectTag");
  tag.textContent = subjectNames[q.subject]; tag.style.background = subjectColors[q.subject];
  document.getElementById("questionVisual").textContent = q.visual;
  document.getElementById("questionText").textContent = q.text;
  document.getElementById("questionCount").textContent = `${session.index + 1}/5`;
  document.getElementById("progressBar").style.width = `${session.index * 20}%`;
  document.getElementById("feedback").textContent = "";
  document.getElementById("progressDots").innerHTML = Array.from({length:5}, (_, i) => `<i class="q-dot ${i < session.index ? "done" : i === session.index ? "current" : ""}"></i>`).join("");
  const answers = document.getElementById("answers");
  answers.innerHTML = q.answers.map((a, i) => `<button class="answer-btn" data-index="${i}">${a.label}</button>`).join("");
  answers.querySelectorAll("button").forEach(button => button.addEventListener("click", () => chooseAnswer(Number(button.dataset.index))));
  if (state.autoSpeak && state.sound) setTimeout(speakCurrent, 250);
}

function chooseAnswer(index) {
  if (session.answered) return;
  session.answered = true;
  const q = session.questions[session.index];
  const selected = q.answers[index];
  const buttons = [...document.querySelectorAll(".answer-btn")];
  buttons.forEach(b => b.disabled = true);
  session.times.push((Date.now() - session.questionStarted) / 1000);
  if (selected.correct) {
    session.correct++;
    buttons[index].classList.add("correct");
    showFeedback(["Chính xác! Tuyệt lắm! ✨", "Giỏi quá! 🌟", "Đúng rồi! Bé thật tinh mắt! 🎉"][session.index % 3], true);
  } else {
    buttons[index].classList.add("wrong");
    const rightIndex = q.answers.findIndex(a => a.correct);
    buttons[rightIndex].classList.add("correct");
    showFeedback("Gần đúng rồi! Mình nhớ đáp án này nhé 💛", false);
  }
  setTimeout(() => {
    session.index++;
    if (session.index < 5) renderQuestion(); else finishLevel();
  }, 1050);
}

function showFeedback(message, correct) {
  const el = document.getElementById("feedback");
  el.textContent = message; el.style.color = correct ? "var(--green)" : "var(--orange-dark)";
  if (state.sound) speak(message.replace(/[✨🌟🎉💛]/gu, ""), "vi-VN", 1.02);
}

function speakCurrent() {
  if (!session || !state.sound) return;
  const q = session.questions[session.index];
  speak(q.text, q.language, q.subject === "en" ? .82 : .9);
}

function speak(text, lang, rate) {
  if (!("speechSynthesis" in window)) { showToast("Trình duyệt này chưa hỗ trợ đọc câu hỏi."); return; }
  speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang; utter.rate = rate; utter.pitch = 1.08;
  speechSynthesis.speak(utter);
}

function finishLevel() {
  document.getElementById("gameDialog").close();
  const average = session.times.reduce((a,b) => a+b,0) / session.times.length;
  const correct = session.correct;
  let stars = 1;
  if (correct === 5 && average <= 12) stars = 3;
  else if (correct >= 4 || (correct === 3 && average <= 12)) stars = 2;
  const passed = correct >= 3;
  const previous = state.results[currentLevel]?.stars || 0;
  if (passed) {
    state.results[currentLevel] = { stars: Math.max(previous, stars), correct, average: Math.round(average), playedAt: Date.now() };
    state.unlocked = Math.max(state.unlocked, Math.min(25, currentLevel + 1));
  }
  state.totalAnswers += 5; state.totalCorrect += correct;
  updateStreak(); saveState(); renderRoadmap(); renderBadges();
  document.getElementById("resultTitle").textContent = correct === 5 ? "Xuất sắc!" : passed ? "Giỏi lắm!" : "Cố thêm chút nữa!";
  document.getElementById("resultMessage").textContent = passed ? "Bé đã mở thêm một chặng mới trên đảo!" : "Mình thử lại để tìm đúng 3 câu nhé. Cáo Cam tin bé làm được!";
  document.getElementById("resultStars").textContent = "★".repeat(stars) + "☆".repeat(3-stars);
  document.getElementById("correctResult").textContent = `${correct}/5`;
  document.getElementById("timeResult").textContent = `${Math.round(average)} giây`;
  document.getElementById("rewardResult").textContent = passed ? `+${Math.max(0, stars-previous)} sao` : "Luyện tập";
  document.getElementById("nextLevel").textContent = passed && currentLevel < 24 ? "Level tiếp theo →" : passed ? "Về bản đồ →" : "Thử lại →";
  document.getElementById("resultDialog").showModal();
  if (passed) launchConfetti();
}

function renderParent() {
  document.getElementById("nameInput").value = state.name === "bé con" ? "" : state.name;
  document.getElementById("autoSpeak").checked = state.autoSpeak;
  const completed = Object.keys(state.results).length;
  const accuracy = state.totalAnswers ? Math.round(state.totalCorrect / state.totalAnswers * 100) : 0;
  document.getElementById("parentSummary").innerHTML = `<div class="summary-tile"><b>${completed}/24</b><small>level đã hoàn thành</small></div><div class="summary-tile"><b>${totalStars()}</b><small>ngôi sao đã nhận</small></div><div class="summary-tile"><b>${accuracy}%</b><small>tỷ lệ trả lời đúng</small></div>`;
}

function launchConfetti() {
  const root = document.getElementById("confetti");
  const colors = ["#ff8b4a", "#ffd95a", "#62c896", "#5ba9e8", "#f48fab"];
  root.innerHTML = Array.from({length: 60}, (_, i) => `<i class="confetti-piece" style="left:${Math.random()*100}%;background:${colors[i%colors.length]};animation-delay:${Math.random()*.6}s;transform:rotate(${Math.random()*180}deg)"></i>`).join("");
  setTimeout(() => root.innerHTML = "", 3200);
}

function showToast(message) {
  const toast = document.getElementById("toast"); toast.textContent = message; toast.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

document.getElementById("soundToggle").addEventListener("click", () => { state.sound = !state.sound; if (!state.sound && "speechSynthesis" in window) speechSynthesis.cancel(); saveState(); showToast(state.sound ? "Đã bật âm thanh" : "Đã tắt âm thanh"); });
document.getElementById("openParent").addEventListener("click", () => { renderParent(); document.getElementById("parentDialog").showModal(); });
document.getElementById("saveName").addEventListener("click", () => { state.name = document.getElementById("nameInput").value.trim() || "bé con"; saveState(); showToast("Đã lưu tên của bé!"); });
document.getElementById("autoSpeak").addEventListener("change", e => { state.autoSpeak = e.target.checked; saveState(); });
document.getElementById("resetProgress").addEventListener("click", () => { if (confirm("Ba mẹ muốn xóa toàn bộ sao, level và thành tích của bé?")) { localStorage.removeItem(STORAGE_KEY); location.reload(); } });
document.getElementById("privacyInfo").addEventListener("click", () => showToast("Không cần tài khoản. Dữ liệu chỉ nằm trong trình duyệt này."));
document.getElementById("closeGame").addEventListener("click", () => { if (confirm("Bé muốn về lại bản đồ? Level này chưa được lưu đâu nhé.")) { if ("speechSynthesis" in window) speechSynthesis.cancel(); document.getElementById("gameDialog").close(); } });
document.getElementById("speakQuestion").addEventListener("click", () => { if (!state.sound) { state.sound = true; saveState(); } speakCurrent(); });
document.getElementById("closeResult").addEventListener("click", () => document.getElementById("resultDialog").close());
document.getElementById("replayLevel").addEventListener("click", () => { document.getElementById("resultDialog").close(); startLevel(currentLevel); });
document.getElementById("nextLevel").addEventListener("click", () => {
  const passed = session.correct >= 3;
  document.getElementById("resultDialog").close();
  if (!passed) startLevel(currentLevel);
  else if (currentLevel < 24) startLevel(currentLevel + 1);
  else document.getElementById("roadmapTitle").scrollIntoView({behavior:"smooth"});
});

updateStreak(); saveState(); renderRoadmap(); renderBadges();
