let state = {
  isRunning: false,
  isFocus: true,
  timeLeft: 1500,
  focusTime: 1500,
  breakTime: 300,
  endTime: null,
  sound: "sounds/bell.mp3"
};

// ================= LOAD STATE =================
browser.storage.local.get("pomodoroState").then(res => {
  if (res.pomodoroState) {
    state = res.pomodoroState;
  }
});

function saveState() {
  browser.storage.local.set({ pomodoroState: state });
}

// ================= SOUND =================
function playSound() {
  let audio = new Audio(browser.runtime.getURL(state.sound));
  audio.play().catch(e => console.log("Audio error:", e));
}

// ================= TIMER CONTROL =================
function startTimer() {
  state.isRunning = true;
  state.endTime = Date.now() + state.timeLeft * 1000;
  saveState();
}

function pauseTimer() {
  state.isRunning = false;

  if (state.endTime) {
    state.timeLeft = Math.max(0, Math.floor((state.endTime - Date.now()) / 1000));
  }

  saveState();
}

function resetTimer() {
  state.isRunning = false;
  state.isFocus = true;
  state.timeLeft = state.focusTime;
  state.endTime = null;
  saveState();
}

function skipTimer() {
  state.isFocus = !state.isFocus;
  state.timeLeft = state.isFocus ? state.focusTime : state.breakTime;
  state.endTime = Date.now() + state.timeLeft * 1000;
  saveState();
}

// ================= CORE TIMER LOOP =================
let lastTrigger = false;

setInterval(() => {
  if (!state.isRunning) return;

  let remaining = Math.floor((state.endTime - Date.now()) / 1000);

  if (remaining <= 0 && !lastTrigger) {

    lastTrigger = true;

    console.log("Timer finished → playing sound");

    playSound();

    // Switch mode
    state.isFocus = !state.isFocus;
    state.timeLeft = state.isFocus ? state.focusTime : state.breakTime;
    state.endTime = Date.now() + state.timeLeft * 1000;

  } else if (remaining > 0) {
    lastTrigger = false;
    state.timeLeft = remaining;
  }

  saveState();

}, 500);

// ================= BADGE =================
function updateBadge() {
  if (!state.isRunning) {
    browser.browserAction.setBadgeText({ text: "" });
    return;
  }

  let minutes = Math.floor(state.timeLeft / 60);

  browser.browserAction.setBadgeText({ text: minutes.toString() });

  browser.browserAction.setBadgeBackgroundColor({
    color: state.isFocus ? "#F0C38E" : "#48426D"
  });
}

setInterval(updateBadge, 1000);

// ================= MESSAGE HANDLER =================
browser.runtime.onMessage.addListener((msg) => {

  if (msg.type === "START") startTimer();
  if (msg.type === "PAUSE") pauseTimer();
  if (msg.type === "RESET") resetTimer();
  if (msg.type === "SKIP") skipTimer();

  if (msg.type === "SET_TIMES") {
    state.focusTime = msg.focus;
    state.breakTime = msg.break;

    if (!state.isRunning) {
      state.timeLeft = state.isFocus ? state.focusTime : state.breakTime;
    }

    saveState();
  }

  if (msg.type === "SET_SOUND") {
    state.sound = msg.sound;
    saveState();
  }

  if (msg.type === "GET_STATE") {
    return Promise.resolve(state);
  }
});
