// ================= ELEMENTS =================
const timerDisplay = document.getElementById("timer");

const focusSlider = document.getElementById("focusTime");
const breakSlider = document.getElementById("breakTime");

const focusLabel = document.getElementById("focusLabel");
const breakLabel = document.getElementById("breakLabel");

const startPauseBtn = document.getElementById("startPause");
const resetBtn = document.getElementById("reset");
const skipBtn = document.getElementById("skip");

const soundSelect = document.getElementById("soundSelect");
const customSoundInput = document.getElementById("customSound");

// Progress ring
const progressCircle = document.querySelector(".progress");
const radius = 75;
const circumference = 2 * Math.PI * radius;

progressCircle.style.strokeDasharray = circumference;

// ================= HELPERS =================
function formatTime(sec) {
  let m = Math.floor(sec / 60);
  let s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function updateLabels() {
  focusLabel.textContent = focusSlider.value + " min";
  breakLabel.textContent = breakSlider.value + " min";
}

// 🔥 CORE FIX: update ring from background state
function updateRing(timeLeft, totalTime) {
  let progress = timeLeft / totalTime;
  let offset = circumference * (1 - progress);
  progressCircle.style.strokeDashoffset = offset;
}

// ================= SYNC UI =================
async function syncUI() {
  let state = await browser.runtime.sendMessage({ type: "GET_STATE" });

  // Timer text
  timerDisplay.textContent = formatTime(state.timeLeft);

  // Button state
  startPauseBtn.textContent = state.isRunning ? "⏸" : "▶";

  // Sliders
  focusSlider.value = state.focusTime / 60;
  breakSlider.value = state.breakTime / 60;

  updateLabels();

  // 🔥 IMPORTANT: determine correct total time
  let totalTime = state.isFocus ? state.focusTime : state.breakTime;

  updateRing(state.timeLeft, totalTime);

  // Sound sync
  if (state.sound) {
    soundSelect.value = state.sound;
  }
}

// Keep updating UI
setInterval(syncUI, 1000);

// ================= CONTROLS =================
startPauseBtn.addEventListener("click", async () => {
  let state = await browser.runtime.sendMessage({ type: "GET_STATE" });

  if (state.isRunning) {
    browser.runtime.sendMessage({ type: "PAUSE" });
  } else {
    browser.runtime.sendMessage({ type: "START" });
  }
});

resetBtn.addEventListener("click", () => {
  browser.runtime.sendMessage({ type: "RESET" });
});

skipBtn.addEventListener("click", () => {
  browser.runtime.sendMessage({ type: "SKIP" });
});

// ================= SLIDERS =================
focusSlider.addEventListener("input", () => {
  updateLabels();

  browser.runtime.sendMessage({
    type: "SET_TIMES",
    focus: focusSlider.value * 60,
    break: breakSlider.value * 60
  });
});

breakSlider.addEventListener("input", () => {
  updateLabels();

  browser.runtime.sendMessage({
    type: "SET_TIMES",
    focus: focusSlider.value * 60,
    break: breakSlider.value * 60
  });
});

// ================= SOUND =================
soundSelect.addEventListener("change", () => {
  if (soundSelect.value === "custom") {
    customSoundInput.click();
  } else {
    browser.runtime.sendMessage({
      type: "SET_SOUND",
      sound: soundSelect.value
    });
  }
});

customSoundInput.addEventListener("change", (e) => {
  const file = e.target.files[0];

  if (file) {
    let customOption = soundSelect.querySelector('option[value="custom"]');
    customOption.textContent = "Custom ✓";
    soundSelect.value = "custom";
  }
});

// ================= INIT =================
syncUI();
updateLabels();
