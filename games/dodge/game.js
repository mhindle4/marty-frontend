// Simple “Dodge” – avoid falling blocks, score for each second survived.

console.log("Dodge game script loaded!");  // ✅ Debug check

const GAME_MARGIN_TOP = 56; // reserve space for nav
const BG = [11, 12, 16];

kaboom({
  global: true,
  canvas: document.getElementById("game"),
  background: BG,
  width: window.innerWidth,
  height: window.innerHeight - GAME_MARGIN_TOP,
});

// Colors (match your site)
const C_PLAYER = color(69, 162, 158);
const C_BLOCK  = color(14, 102, 85);
const C_TEXT   = color(230, 240, 241);

// Player
const SPEED = 420;
const player = add([
  pos(width() / 2, height() - 90),
  rect(32, 32),
  anchor("center"),      // ✅ replaced origin() with anchor()
  C_PLAYER,
  area(),
  "player",
]);

// Score UI
let score = 0;
const scoreText = add([
  text("Score: 0", { size: 28, font: "sink" }),
  pos(16, 12),
  fixed(),
  { update() { this.color = C_TEXT; } },
]);

// Spawn blocks
function spawnBlock() {
  const w = rand(24, 64);
  const x = rand(w + 8, width() - (w + 8));
  const speed = rand(180, 380);
  add([
    pos(x, -40),
    rect(w, 22),
    C_BLOCK,
    outline(2, rgb(20, 30, 30)),
    area(),
    move(DOWN, speed),
    offscreen({ destroy: true }),
    "block",
  ]);
}
loop(0.75, spawnBlock);

// Keyboard movement
onUpdate(() => {
  let vx = 0, vy = 0;
  if (isKeyDown("left") || isKeyDown("a"))  vx -= SPEED;
  if (isKeyDown("right")|| isKeyDown("d"))  vx += SPEED;
  if (isKeyDown("up")   || isKeyDown("w"))  vy -= SPEED;
  if (isKeyDown("down") || isKeyDown("s"))  vy += SPEED;
  player.move(vx, vy);

  // Clamp inside canvas
  player.pos.x = clamp(player.pos.x, 16, width() - 16);
  player.pos.y = clamp(player.pos.y, 16, height() - 16);
});

// Passive score tick (every second)
loop(1, () => {
  score++;
  scoreText.text = `Score: ${score}`;
});

// Collision = game over
player.onCollide("block", () => {
  add([
    rect(width(), height()),
    pos(0, 0),
    color(0, 0, 0),
    opacity(0),
    {
      add() { this.t = 0; },
      update() { this.t += dt(); this.opacity = Math.min(0.5, this.t * 0.8); },
    },
  ]);

  add([
    text(`Game Over\nScore: ${score}\nPress R to restart`, { size: 40, align: "center", lineSpacing: 10 }),
    pos(width() / 2, height() / 2),
    anchor("center"),
    { color: C_TEXT },
  ]);

  every("block", (b) => destroy(b));
  player.destroy();

  onKeyPress("r", () => location.reload());
});

// Scene/bootstrap
scene("main", () => {});
go("main");

// Resize handling (reload is simplest to keep canvas sizing correct)
window.addEventListener("resize", () => {
  location.reload();
});

/* -------------------------------
   Mobile joystick (touch)
--------------------------------*/
const pad   = document.getElementById("pad");
const stick = document.getElementById("stick");
const center = { x: 60, y: 60 }; // pad size 120x120
let activeTouch = null;

function setStick(dx, dy) {
  const max = 40; // travel radius
  const len = Math.min(Math.hypot(dx, dy), max);
  const ang = Math.atan2(dy, dx);
  const x = center.x + Math.cos(ang) * len;
  const y = center.y + Math.sin(ang) * len;
  stick.style.left = x + "px";
  stick.style.top  = y + "px";
}

function resetStick() {
  stick.style.left = "50%";
  stick.style.top  = "50%";
}

function applyJoystick(dx, dy) {
  const dead = 10;
  if (Math.abs(dx) < dead && Math.abs(dy) < dead) return;
  const nx = dx / 40, ny = dy / 40; // -1..1
  player.move(nx * SPEED, ny * SPEED);
  // Clamp inside canvas
  player.pos.x = clamp(player.pos.x, 16, width() - 16);
  player.pos.y = clamp(player.pos.y, 16, height() - 16);
}

pad.addEventListener("touchstart", (e) => {
  activeTouch = e.changedTouches[0].identifier;
});
pad.addEventListener("touchmove", (e) => {
  const t = Array.from(e.changedTouches).find(t => t.identifier === activeTouch);
  if (!t) return;
  const rect = pad.getBoundingClientRect();
  const dx = (t.clientX - rect.left) - center.x;
  const dy = (t.clientY - rect.top)  - center.y;
  setStick(dx, dy);
  applyJoystick(dx, dy);
}, { passive: false });

function endTouch(e) {
  const t = Array.from(e.changedTouches).find(t => t.identifier === activeTouch);
  if (!t) return;
  activeTouch = null;
  resetStick();
}
pad.addEventListener("touchend", endTouch);
pad.addEventListener("touchcancel", endTouch);

// Optional: hide joystick on desktop (keep it visible on touch devices)
if (!("ontouchstart" in window)) {
  pad.style.display = "none";
}
