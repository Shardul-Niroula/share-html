export interface StarterTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  html: string;
  css: string;
  js: string;
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: 'interactive-counter',
    name: 'Interactive Counter & Particle FX',
    category: 'Interactive',
    description: 'Clean reactive counter with gradient physics effects and confetti pulses.',
    html: `<div class="card">
  <div class="badge">Live Sandbox</div>
  <h1 id="title">Interactive Counter</h1>
  <p class="subtitle">Click the controls below to trigger animated particle ripples.</p>
  
  <div class="counter-display" id="count">0</div>
  
  <div class="button-group">
    <button id="btn-decrement" class="btn btn-secondary">- Decrement</button>
    <button id="btn-reset" class="btn btn-outline">Reset</button>
    <button id="btn-increment" class="btn btn-primary">+ Increment</button>
  </div>
  
  <div id="stats" class="stats-box">
    <span>Total Clicks: <b id="total-clicks">0</b></span>
    <span>Streak: <b id="streak">0</b></span>
  </div>
</div>`,
    css: `body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 50% 20%, #1e293b, #0f172a);
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  color: #f8fafc;
}

.card {
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 36px 40px;
  text-align: center;
  max-width: 440px;
  width: 90%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.badge {
  display: inline-block;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border-radius: 12px;
  margin-bottom: 16px;
}

h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.subtitle {
  margin: 0 0 24px 0;
  color: #94a3b8;
  font-size: 14px;
}

.counter-display {
  font-size: 72px;
  font-weight: 800;
  color: #38bdf8;
  margin: 16px 0 24px 0;
  font-variant-numeric: tabular-nums;
  transition: transform 0.15s ease, color 0.3s ease;
}

.button-group {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 24px;
}

.btn {
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:active {
  transform: scale(0.95);
}

.btn-primary {
  background: #38bdf8;
  color: #0f172a;
}
.btn-primary:hover {
  background: #7dd3fc;
  box-shadow: 0 0 15px rgba(56, 189, 248, 0.4);
}

.btn-secondary {
  background: #334155;
  color: #f8fafc;
}
.btn-secondary:hover {
  background: #475569;
}

.btn-outline {
  background: transparent;
  color: #94a3b8;
  border: 1px solid #475569;
}
.btn-outline:hover {
  border-color: #94a3b8;
  color: #f8fafc;
}

.stats-box {
  display: flex;
  justify-content: space-around;
  padding: 12px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 10px;
  font-size: 13px;
  color: #94a3b8;
}

.stats-box b {
  color: #f8fafc;
}`,
    js: `let count = 0;
let totalClicks = 0;
let streak = 0;

const countEl = document.getElementById('count');
const totalEl = document.getElementById('total-clicks');
const streakEl = document.getElementById('streak');
const btnInc = document.getElementById('btn-increment');
const btnDec = document.getElementById('btn-decrement');
const btnReset = document.getElementById('btn-reset');

function updateDisplay() {
  countEl.textContent = count;
  totalEl.textContent = totalClicks;
  streakEl.textContent = streak;
  
  // Visual pulse
  countEl.style.transform = 'scale(1.15)';
  setTimeout(() => {
    countEl.style.transform = 'scale(1)';
  }, 120);

  if (count > 0) countEl.style.color = '#38bdf8';
  else if (count < 0) countEl.style.color = '#f43f5e';
  else countEl.style.color = '#94a3b8';
}

btnInc.addEventListener('click', () => {
  count++;
  totalClicks++;
  streak++;
  updateDisplay();
  console.log('Incremented! New count:', count);
});

btnDec.addEventListener('click', () => {
  count--;
  totalClicks++;
  streak = Math.max(0, streak - 1);
  updateDisplay();
  console.log('Decremented! New count:', count);
});

btnReset.addEventListener('click', () => {
  count = 0;
  streak = 0;
  updateDisplay();
  console.info('Counter reset to 0');
});

updateDisplay();
console.log('Counter sandbox ready!');`
  },
  {
    id: 'animated-canvas-particles',
    name: 'Animated Particle Constellation',
    category: 'Graphics',
    description: 'HTML5 Canvas simulation with interactive mouse gravity and node connections.',
    html: `<div class="container">
  <div class="overlay">
    <h2>Particle Constellation</h2>
    <p>Move mouse to attract particles. Click to spawn ripples.</p>
  </div>
  <canvas id="stage"></canvas>
</div>`,
    css: `body, html {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #030712;
  font-family: system-ui, -apple-system, sans-serif;
}

.container {
  position: relative;
  width: 100%;
  height: 100%;
}

canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.overlay {
  position: absolute;
  top: 24px;
  left: 24px;
  z-index: 10;
  color: #f9fafb;
  pointer-events: none;
  background: rgba(17, 24, 39, 0.7);
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
}

.overlay h2 {
  margin: 0 0 6px 0;
  font-size: 18px;
}

.overlay p {
  margin: 0;
  font-size: 13px;
  color: #9ca3af;
}`,
    js: `const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
});

const mouse = { x: width / 2, y: height / 2, radius: 140 };

window.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

const particles = [];
const particleCount = 65;

class Particle {
  constructor() {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.vx = (Math.random() - 0.5) * 1.5;
    this.vy = (Math.random() - 0.5) * 1.5;
    this.radius = Math.random() * 2 + 1.5;
    this.color = '#38bdf8';
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0 || this.x > width) this.vx *= -1;
    if (this.y < 0 || this.y > height) this.vy *= -1;

    // Mouse attraction
    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < mouse.radius) {
      const force = (mouse.radius - dist) / mouse.radius;
      this.x += (dx / dist) * force * 2;
      this.y += (dy / dist) * force * 2;
    }
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

for (let i = 0; i < particleCount; i++) {
  particles.push(new Particle());
}

function animate() {
  ctx.clearRect(0, 0, width, height);

  for (let i = 0; i < particles.length; i++) {
    particles[i].update();
    particles[i].draw();

    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 110) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(56, 189, 248, ' + (1 - dist / 110) * 0.35 + ')';
        ctx.lineWidth = 1;
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(animate);
}

animate();
console.log('Canvas particle constellation active!');`
  },
  {
    id: 'modern-todo-app',
    name: 'Modern Task Organizer',
    category: 'App',
    description: 'Clean task manager with local storage, completion filtering, and animations.',
    html: `<div class="app-card">
  <header>
    <h1>Task Board</h1>
    <span id="date-label">Today</span>
  </header>
  
  <form id="todo-form">
    <input type="text" id="todo-input" placeholder="Add a new task..." required autocomplete="off" />
    <button type="submit">+</button>
  </form>

  <div class="filters">
    <button class="filter-btn active" data-filter="all">All</button>
    <button class="filter-btn" data-filter="active">Active</button>
    <button class="filter-btn" data-filter="completed">Completed</button>
  </div>

  <ul id="todo-list"></ul>

  <footer>
    <span id="items-left">0 items remaining</span>
    <button id="clear-completed">Clear Done</button>
  </footer>
</div>`,
    css: `body {
  margin: 0;
  padding: 20px;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f172a;
  font-family: system-ui, -apple-system, sans-serif;
  color: #e2e8f0;
}

.app-card {
  background: #1e293b;
  border-radius: 16px;
  width: 100%;
  max-width: 440px;
  padding: 24px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

header h1 {
  font-size: 22px;
  margin: 0;
  color: #38bdf8;
}

#date-label {
  font-size: 13px;
  color: #94a3b8;
}

#todo-form {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

#todo-input {
  flex: 1;
  padding: 12px 16px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #f8fafc;
  font-size: 14px;
  outline: none;
}

#todo-input:focus {
  border-color: #38bdf8;
}

#todo-form button {
  width: 44px;
  background: #38bdf8;
  color: #0f172a;
  border: none;
  border-radius: 8px;
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
}

.filters {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
}

.filter-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
}

.filter-btn.active {
  background: #334155;
  color: #38bdf8;
}

#todo-list {
  list-style: none;
  padding: 0;
  margin: 0 0 16px 0;
  max-height: 260px;
  overflow-y: auto;
}

.todo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #0f172a;
  margin-bottom: 8px;
  border-radius: 8px;
  border: 1px solid #1e293b;
}

.todo-item.done span {
  text-decoration: line-through;
  color: #64748b;
}

.todo-item input[type="checkbox"] {
  margin-right: 12px;
  cursor: pointer;
}

.todo-item .delete-btn {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  font-size: 16px;
}

footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #64748b;
  border-top: 1px solid #334155;
  padding-top: 14px;
}

#clear-completed {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
}`,
    js: `let todos = [
  { id: 1, text: 'Review sandboxed code execution', done: true },
  { id: 2, text: 'Set link expiration rule to 3 days', done: false },
  { id: 3, text: 'Share secure preview URL', done: false },
];

let filter = 'all';

const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const itemsLeft = document.getElementById('items-left');
const clearBtn = document.getElementById('clear-completed');
const filterBtns = document.querySelectorAll('.filter-btn');

function render() {
  list.innerHTML = '';
  const filtered = todos.filter(t => {
    if (filter === 'active') return !t.done;
    if (filter === 'completed') return t.done;
    return true;
  });

  filtered.forEach(todo => {
    const li = document.createElement('li');
    li.className = 'todo-item ' + (todo.done ? 'done' : '');
    
    const leftDiv = document.createElement('div');
    leftDiv.style.display = 'flex';
    leftDiv.style.alignItems = 'center';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.done;
    checkbox.addEventListener('change', () => {
      todo.done = !todo.done;
      render();
    });

    const span = document.createElement('span');
    span.textContent = todo.text;

    leftDiv.appendChild(checkbox);
    leftDiv.appendChild(span);

    const del = document.createElement('button');
    del.className = 'delete-btn';
    del.innerHTML = '&times;';
    del.addEventListener('click', () => {
      todos = todos.filter(t => t.id !== todo.id);
      render();
    });

    li.appendChild(leftDiv);
    li.appendChild(del);
    list.appendChild(li);
  });

  const activeCount = todos.filter(t => !t.done).length;
  itemsLeft.textContent = activeCount + ' items remaining';
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (text) {
    todos.push({ id: Date.now(), text, done: false });
    input.value = '';
    render();
    console.log('Added task:', text);
  }
});

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filter = btn.dataset.filter;
    render();
  });
});

clearBtn.addEventListener('click', () => {
  todos = todos.filter(t => !t.done);
  render();
});

render();
console.log('Todo application initialized.');`
  }
];
