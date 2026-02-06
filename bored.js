const WORDS = [
  "ABOUT",
  "MAKES",
  "WORKS",
  "ROBOT",
  "HAPTIC",
  "IDEAS",
  "INPUT",
  "LOOPS",
  "SPEED",
  "RACES",
  "BAKES",
];

const QUOTES = [
  "I grew up in Turkey for 14 years",
  "I moved to Fairfax, Virginia in 2017",
  "I was on Cartoon Network when I was 10",
  "I love table tennis",
  "I never miss a Formula 1 race",
  "I love basketball and soccer",
  "I love concerts and live music",
  "I enjoy baking and cooking when I need a reset",
  "I’m fascinated by drones and rocketry",
  "I enjoy photography and capturing small details",
  "I like building things that people actually use",
  "I learn best by prototyping and breaking things",
  "I care about clean experiments as much as clean code",
  "I enjoy turning messy data into clear insights",
  "I’m happiest when hardware, software, and humans meet",
  "I believe good engineering should feel intuitive",
  "I value curiosity more than credentials",
  "I prefer progress over perfection",
  "I enjoy explaining complex ideas simply",
  "I’m always working on the next version of myself",
];

const JOKES = [
  "Stay hungry, stay foolish.",
  "Simplicity is the ultimate sophistication.",
  "Make it work, then make it right, then make it fast.",
  "The best way to predict the future is to invent it.",
  "Curiosity is more important than knowledge.",
  "Done is better than perfect.",
  "Small steps every day still move you forward.",
  "Build things that matter.",
  "Measure twice, cut once.",
  "Good engineers ship.",
  "I have not failed. I've just found 10,000 ways that won't work.",
  "Engineering is just applied curiosity.",
  "Trust the process.",
  "Progress over perfection.",
  "Learn constantly or fall behind.",
  "Why do programmers prefer dark mode? Because light attracts bugs.",
  "I would tell you a UDP joke, but you might not get it.",
  "Why did the engineer bring a ladder? Because the problem was on another level.",
  "I'm not lazy, I'm on energy-saving mode.",
  "Debugging is like being the detective in a crime movie where you are also the criminal.",
  "I tried to be normal once. Worst two minutes of my life.",
  "My brain has too many tabs open.",
  "I speak fluent sarcasm and Python.",
  "Coffee first. Then science.",
  "I put the pro in procrastinate.",
  "Why don't robots ever panic? They have nerves of steel.",
  "Why was the math book sad? It had too many problems.",
  "Why did the physicist break up with reality? It was too relative.",
  "Engineers do it with precision.",
  "I thought about quitting engineering. Then I remembered I like eating.",
  "Running on caffeine and curiosity.",
  "Good ideas start on napkins.",
  "Failure is just data with feelings.",
  "Science doesn't care what you believe.",
  "Design is not how it looks, it's how it works.",
  "The details are not the details. They make the design.",
  "If at first you don't succeed, redefine success.",
  "Creativity is intelligence having fun.",
  "Work hard. Stay kind.",
  "I build things so I can break them properly.",
  "Why did the robot go to therapy? It had too many unresolved issues.",
  "I don't rise and grind. I calibrate.",
  "Somewhere, something incredible is waiting to be known.",
  "Turning coffee into code since forever.",
  "Always learning. Occasionally sleeping.",
  "Think twice. Code once.",
  "Life is short. Make cool stuff.",
  "Dad Joke of the Day loading...",
];

const wordleBoard = document.getElementById("wordle-board");
const wordleKeyboard = document.getElementById("wordle-keyboard");
const wordleStatus = document.getElementById("wordle-status");
const wordleReset = document.getElementById("wordle-reset");

let secretWord = "";
let currentGuess = "";
let guesses = [];
const maxGuesses = 5;
const wordLength = 5;
let keyboardState = {};

function pickWord() {
  secretWord = WORDS[Math.floor(Math.random() * WORDS.length)];
}

function buildBoard() {
  wordleBoard.innerHTML = "";
  for (let row = 0; row < maxGuesses; row += 1) {
    const rowEl = document.createElement("div");
    rowEl.className = "wordle-row";
    for (let col = 0; col < wordLength; col += 1) {
      const cell = document.createElement("div");
      cell.className = "wordle-cell";
      rowEl.appendChild(cell);
    }
    wordleBoard.appendChild(rowEl);
  }
}

function buildKeyboard() {
  const keys = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACK"],
  ];
  wordleKeyboard.innerHTML = "";
  keys.forEach((row) => {
    const rowEl = document.createElement("div");
    rowEl.className = "keyboard-row";
    row.forEach((key) => {
      const btn = document.createElement("button");
      btn.className = "key";
      btn.textContent = key === "BACK" ? "Back" : key;
      btn.addEventListener("click", () => handleKey(key));
      rowEl.appendChild(btn);
    });
    wordleKeyboard.appendChild(rowEl);
  });
}

function handleKey(key) {
  if (guesses.length >= maxGuesses) {
    return;
  }

  if (key === "ENTER") {
    submitGuess();
    return;
  }
  if (key === "BACK") {
    currentGuess = currentGuess.slice(0, -1);
    renderCurrentGuess();
    return;
  }

  if (/^[A-Z]$/.test(key) && currentGuess.length < wordLength) {
    currentGuess += key;
    renderCurrentGuess();
  }
}

function renderCurrentGuess() {
  const row = wordleBoard.children[guesses.length];
  if (!row) return;
  [...row.children].forEach((cell, idx) => {
    cell.textContent = currentGuess[idx] || "";
  });
}

function colorGuess(guess) {
  const result = new Array(guess.length).fill("absent");
  const wordChars = secretWord.split("");
  const used = new Array(wordChars.length).fill(false);

  for (let i = 0; i < guess.length; i += 1) {
    if (guess[i] === wordChars[i]) {
      result[i] = "correct";
      used[i] = true;
    }
  }

  for (let i = 0; i < guess.length; i += 1) {
    if (result[i] === "correct") continue;
    const idx = wordChars.findIndex((ch, index) => ch === guess[i] && !used[index]);
    if (idx !== -1) {
      result[i] = "present";
      used[idx] = true;
    }
  }

  return result;
}

function updateKeyboard(guess, colors) {
  for (let i = 0; i < guess.length; i += 1) {
    const letter = guess[i];
    const status = colors[i];
    const priority = { correct: 3, present: 2, absent: 1 };
    const current = keyboardState[letter];
    if (!current || priority[status] > priority[current]) {
      keyboardState[letter] = status;
    }
  }

  const keyButtons = wordleKeyboard.querySelectorAll(".key");
  keyButtons.forEach((btn) => {
    const letter = btn.textContent === "Back" ? "BACK" : btn.textContent;
    if (!keyboardState[letter]) return;
    btn.classList.remove("correct", "present", "absent");
    btn.classList.add(keyboardState[letter]);
  });
}

function submitGuess() {
  if (currentGuess.length !== wordLength) {
    wordleStatus.textContent = `Word length is ${wordLength}. Keep going.`;
    return;
  }

  const guess = currentGuess;
  const colors = colorGuess(guess);
  const row = wordleBoard.children[guesses.length];
  [...row.children].forEach((cell, idx) => {
    cell.textContent = guess[idx];
    cell.classList.add(colors[idx]);
  });
  updateKeyboard(guess, colors);

  guesses.push(guess);
  currentGuess = "";

  if (guess === secretWord) {
    wordleStatus.textContent = "You got it! New word?";
    return;
  }

  if (guesses.length >= maxGuesses) {
    wordleStatus.textContent = `Out of tries. Word was ${secretWord}.`;
  } else {
    wordleStatus.textContent = "Keep going.";
  }
}

function resetWordle() {
  pickWord();
  guesses = [];
  currentGuess = "";
  keyboardState = {};
  wordleStatus.textContent = "";
  buildBoard();
  buildKeyboard();
}

wordleReset.addEventListener("click", resetWordle);

document.addEventListener("keydown", (event) => {
  if (document.activeElement && document.activeElement.tagName === "INPUT") return;
  const key = event.key.toUpperCase();
  if (key === "BACKSPACE") {
    handleKey("BACK");
  } else if (key === "ENTER") {
    handleKey("ENTER");
  } else if (/^[A-Z]$/.test(key)) {
    handleKey(key);
  }
});

resetWordle();

// Snake game
const snakeCanvas = document.getElementById("snake-canvas");
const snakeStatus = document.getElementById("snake-status");
const snakeQuote = document.getElementById("snake-quote");
const snakeScoreEl = document.getElementById("snake-score");
const snakeReset = document.getElementById("snake-reset");

const ctx = snakeCanvas.getContext("2d");
const gridSize = 20;
const tileCount = snakeCanvas.width / gridSize;
let snake = [{ x: 10, y: 10 }];
let food = { x: 5, y: 5 };
let direction = { x: 0, y: 0 };
let nextDirection = { x: 0, y: 0 };
let running = false;
let score = 0;
let snakeInterval = null;
let gameOver = false;

function randomFood() {
  let pos = { x: 0, y: 0 };
  do {
    pos = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount),
    };
  } while (snake.some((seg) => seg.x === pos.x && seg.y === pos.y));
  food = pos;
}

function resetSnake() {
  snake = [{ x: 10, y: 10 }];
  direction = { x: 0, y: 0 };
  nextDirection = { x: 0, y: 0 };
  running = false;
  gameOver = false;
  score = 0;
  snakeScoreEl.textContent = "0";
  snakeStatus.textContent = "Press any arrow key to start.";
  snakeQuote.textContent = "Ready to chase the next idea.";
  randomFood();
  drawSnake();
}

function startSnake() {
  if (running) return;
  if (gameOver) return;
  running = true;
  snakeStatus.textContent = "Go!";
  if (snakeInterval) clearInterval(snakeInterval);
  snakeInterval = setInterval(stepSnake, 110);
}

function drawCell(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * gridSize, y * gridSize, gridSize - 1, gridSize - 1);
}

function drawSnake() {
  ctx.clearRect(0, 0, snakeCanvas.width, snakeCanvas.height);
  drawCell(food.x, food.y, "#2f5d9f");
  snake.forEach((seg, idx) => {
    drawCell(seg.x, seg.y, idx === 0 ? "#0f2f5a" : "#6fa0ff");
  });
}

function stepSnake() {
  direction = nextDirection;
  if (direction.x === 0 && direction.y === 0) return;

  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

  if (
    head.x < 0 ||
    head.y < 0 ||
    head.x >= tileCount ||
    head.y >= tileCount ||
    snake.some((seg) => seg.x === head.x && seg.y === head.y)
  ) {
    running = false;
    gameOver = true;
    clearInterval(snakeInterval);
    snakeStatus.textContent = "Game over. Press New Game to restart.";
    snakeQuote.textContent = getQuote();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 1;
    snakeScoreEl.textContent = String(score);
    snakeQuote.textContent = getQuote();
    randomFood();
  } else {
    snake.pop();
  }

  drawSnake();
}

function handleSnakeKey(key) {
  if (gameOver) return;
  if (key === "ArrowUp" || key === "W") {
    if (direction.y !== 1) nextDirection = { x: 0, y: -1 };
  } else if (key === "ArrowDown" || key === "S") {
    if (direction.y !== -1) nextDirection = { x: 0, y: 1 };
  } else if (key === "ArrowLeft" || key === "A") {
    if (direction.x !== 1) nextDirection = { x: -1, y: 0 };
  } else if (key === "ArrowRight" || key === "D") {
    if (direction.x !== -1) nextDirection = { x: 1, y: 0 };
  } else {
    return;
  }
  startSnake();
}

snakeReset.addEventListener("click", resetSnake);

document.addEventListener("keydown", (event) => {
  handleSnakeKey(event.key.toUpperCase());
});

resetSnake();

// Button press animation
document.querySelectorAll(".button.secondary").forEach((btn) => {
  btn.addEventListener("click", () => {
    btn.classList.add("clicked");
    window.setTimeout(() => btn.classList.remove("clicked"), 180);
  });
});

// Joke bar
const jokeBar = document.getElementById("joke-bar");
const jokePreview = document.getElementById("joke-preview");
const jokeNext = document.getElementById("joke-next");
let jokeIndex = 0;

function nextJoke() {
  jokeIndex = (jokeIndex + 1) % JOKES.length;
  const text = JOKES[jokeIndex];
  jokeBar.textContent = text;
  jokePreview.textContent = text;
  jokeBar.classList.remove("show");
  void jokeBar.offsetWidth;
  jokeBar.classList.add("show");
}

jokeNext.addEventListener("click", nextJoke);

function rotateJokes() {
  nextJoke();
  setInterval(nextJoke, 8000);
}

rotateJokes();
