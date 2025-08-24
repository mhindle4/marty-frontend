
// Breakout – plain Canvas (no libs). Desktop + mobile friendly.
// Controls: Mouse / Touch drag, or Arrow keys / A-D.

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const restartBtn = document.getElementById("restart");

const W = canvas.width;
const H = canvas.height;

// Colors to match your site
const COLOR_BG = "#111417";
const COLOR_PADDLE = "#45a29e";
const COLOR_BALL = "#66fcf1";
const COLOR_BRICK = "#0e6655";
const COLOR_TEXT = "#eaf0f1";

// Game objects
let paddle, ball, bricks, score, lives, running, keys = {};

// Brick layout
const COLS = 10;
const ROWS = 6;
const BRICK_W = 70;       // brick width
const BRICK_H = 22;       // brick height
const BRICK_GAP = 6;      // gap
const OFFSET_X = 15;      // left margin
const OFFSET_Y = 70;      // top margin

function resetLevel() {
  bricks = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      bricks.push({
        x: OFFSET_X + c * (BRICK_W + BRICK_GAP),
        y: OFFSET_Y + r * (BRICK_H + BRICK_GAP),
        hit: false,
        hp: 1 + Math.floor(r / 2), // top rows slightly stronger
      });
    }
  }
}

function resetAll() {
  score = 0;
  lives = 3;
  paddle = { w: 120, h: 12, x: W / 2 - 60, y: H - 40, speed: 9 };
  ball = { x: W / 2, y: H / 2 + 60, r: 8, vx: 4, vy: -4, speedInc: 0.08 };
  resetLevel();
  running = true;
  updateHUD();
}

function updateHUD() {
  scoreEl.textContent = `Score: ${score}`;
  livesEl.textContent = `Lives: ${lives}`;
}

function drawBG() {
  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, W, H);
}

function drawPaddle() {
  ctx.fillStyle = COLOR_PADDLE;
  ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fillStyle = COLOR_BALL;
  ctx.fill();
}

function drawBricks() {
  for (const b of bricks) {
    if (b.hit) continue;
    ctx.fillStyle = COLOR_BRICK;
    ctx.fillRect(b.x, b.y, BRICK_W, BRICK_H);
  }
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function updatePaddle() {
  if (keys["ArrowLeft"] || keys["a"] || keys["A"]) paddle.x -= paddle.speed;
  if (keys["ArrowRight"]|| keys["d"] || keys["D"]) paddle.x += paddle.speed;
  paddle.x = clamp(paddle.x, 0, W - paddle.w);
}

function updateBall() {
  ball.x += ball.vx;
  ball.y += ball.vy;

  // walls
  if (ball.x < ball.r || ball.x > W - ball.r) ball.vx *= -1;
  if (ball.y < ball.r) ball.vy *= -1;

  // paddle
  if (ball.y + ball.r >= paddle.y &&
      ball.x >= paddle.x &&
      ball.x <= paddle.x + paddle.w &&
      ball.vy > 0) {
    // reflect and angle based on where it hits the paddle
    const hitPos = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2); // -1..1
    ball.vy *= -1;
    ball.vx = hitPos * 6;
    // ramp up difficulty slightly
    ball.vx += Math.sign(ball.vx) * ball.speedInc;
    ball.vy -= ball.speedInc;
  }

  // bricks
  for (const b of bricks) {
    if (b.hit) continue;
    if (ball.x > b.x && ball.x < b.x + BRICK_W &&
        ball.y - ball.r < b.y + BRICK_H &&
        ball.y + ball.r > b.y) {
      // basic vertical bounce
      ball.vy *= -1;
      b.hp--;
      if (b.hp <= 0) {
        b.hit = true;
        score += 10;
        updateHUD();
      }
      break;
    }
  }

  // lose life
  if (ball.y - ball.r > H) {
    lives--;
    updateHUD();
    if (lives <= 0) {
      running = false;
      showGameOver();
    } else {
      // reset ball to paddle
      ball.x = paddle.x + paddle.w / 2;
      ball.y = paddle.y - 20;
      ball.vx = 4 * (Math.random() > 0.5 ? 1 : -1);
      ball.vy = -4;
    }
  }

  // win (all bricks hit)
  if (bricks.every(b => b.hit)) {
    running = false;
    showWin();
  }
}

function showGameOver() {
  drawOverlay(`Game Over\nScore: ${score}\nClick or press R to restart`);
}

function showWin() {
  drawOverlay(`You Win!\nScore: ${score}\nClick or press R for next round`);
}

function drawOverlay(text) {
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = COLOR_TEXT;
  ctx.textAlign = "center";
  ctx.font = "bold 36px system-ui, Arial";
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    ctx.fillText(line, W / 2, H / 2 + i * 42);
  });
}

function loop() {
  drawBG();
  drawBricks();
  drawPaddle();
  drawBall();

  if (running) {
    updatePaddle();
    updateBall();
    requestAnimationFrame(loop);
  } else {
    // still update paddle for mouse move feel
    updatePaddle();
    requestAnimationFrame(loop);
  }
}

// Mouse / touch move paddle
let dragging = false;

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  paddle.x = clamp(x - paddle.w / 2, 0, W - paddle.w);
});

canvas.addEventListener("mousedown", () => dragging = true);
canvas.addEventListener("mouseup",   () => dragging = false);

canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  dragging = true;
}, { passive: false });

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const t = e.touches[0];
  const x = t.clientX - rect.left;
  paddle.x = clamp(x - paddle.w / 2, 0, W - paddle.w);
}, { passive: false });

canvas.addEventListener("touchend", () => dragging = false);

// Keyboard
document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (e.key === "r" || e.key === "R") {
    resetAll();
  }
});
document.addEventListener("keyup",   (e) => keys[e.key] = false);

// Restart button
restartBtn.addEventListener("click", resetAll);

// Boot
resetAll();
loop();
