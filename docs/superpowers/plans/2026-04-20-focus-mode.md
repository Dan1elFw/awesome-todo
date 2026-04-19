# Focus Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full-screen Focus mode overlay showing only Today tasks on a daily Unsplash landscape background, with checkbox-only interaction and a background image toggle.

**Architecture:** `state.focusMode` boolean controls a full-screen `#focus-overlay` div rendered by `renderFocus()`. Background image uses Unsplash source API with a date-based seed. `state.focusBg` persists the background toggle preference. Esc key and exit button call `exitFocus()`.

**Tech Stack:** Vanilla JS (ES modules), plain CSS, Unsplash source API (no API key).

**Prerequisite:** Today Feature plan must be fully implemented before starting this plan.

---

## File Map

| File | Change |
|---|---|
| `js/state.js` | Add `focusMode: false`, `focusBg: true` to state; add `enterFocus()`, `exitFocus()`, `toggleFocusBg()` |
| `js/app.js` | Add `renderFocus()`; call from `render()`; add ⊙ Focus button to sidebar and mobile bar; add Esc keydown listener |
| `style.css` | Styles for `#focus-overlay`, `.focus-card`, `.focus-exit-btn`, `.focus-bg-btn`, mobile variants |

---

### Task 1: Add Focus state operations

**Files:**
- Modify: `js/state.js`

- [ ] **Step 1: Add `focusMode` and `focusBg` to initial state, and add `enterFocus`, `exitFocus`, `toggleFocusBg`**

In `js/state.js`, replace the state object and add new exports. The full updated `state.js`:

```js
// state.js — in-memory state + operations
import { saveToStorage, loadFromStorage } from './storage.js';

export const state = {
  categories: ['Personal'],
  todos: [],
  activeCategory: 'All',
  activeFilter: 'all',
  storageAvailable: true,
  focusMode: false,
  focusBg: true,
};

export function initState() {
  const saved = loadFromStorage();
  if (saved === null) {
    try {
      localStorage.setItem('awesome-todo:_test', '1');
      localStorage.removeItem('awesome-todo:_test');
    } catch {
      state.storageAvailable = false;
    }
    return;
  }
  Object.assign(state, saved);
}

function persist() {
  if (state.storageAvailable) saveToStorage(state);
}

export function addTodo(text, category, dueDate) {
  const id = crypto.randomUUID();
  state.todos.push({ id, text, category, completed: false, dueDate, todayDate: '' });
  persist();
}

export function toggleTodo(id) {
  const todo = state.todos.find(t => t.id === id);
  if (todo) { todo.completed = !todo.completed; persist(); }
}

export function editTodo(id, text) {
  const todo = state.todos.find(t => t.id === id);
  if (todo) { todo.text = text; persist(); }
}

export function deleteTodo(id) {
  state.todos = state.todos.filter(t => t.id !== id);
  persist();
}

export function addCategory(name) {
  if (!name || state.categories.includes(name)) return;
  state.categories.push(name);
  persist();
}

export function deleteCategory(name) {
  state.categories = state.categories.filter(c => c !== name);
  const affected = state.todos.filter(t => t.category === name);
  if (affected.length) {
    if (!state.categories.includes('Uncategorized')) {
      state.categories.push('Uncategorized');
    }
    affected.forEach(t => { t.category = 'Uncategorized'; });
  }
  try { localStorage.removeItem(`awesome-todo:todos:${name}`); } catch {}
  if (state.activeCategory === name) state.activeCategory = 'All';
  persist();
}

export function importData(data) {
  for (const cat of (data.categories || [])) {
    if (cat && !state.categories.includes(cat)) state.categories.push(cat);
  }
  const existingIds = new Set(state.todos.map(t => t.id));
  for (const todo of (data.todos || [])) {
    if (todo.id && !existingIds.has(todo.id)) state.todos.push(todo);
  }
  persist();
}

export function addToToday(id) {
  const todo = state.todos.find(t => t.id === id);
  if (todo) { todo.todayDate = new Date().toISOString().slice(0, 10); persist(); }
}

export function removeFromToday(id) {
  const todo = state.todos.find(t => t.id === id);
  if (todo) { todo.todayDate = ''; persist(); }
}

export function reconcileToday() {
  const today = new Date().toISOString().slice(0, 10);
  let changed = false;
  for (const todo of state.todos) {
    if (!todo.todayDate) continue;
    if (todo.todayDate < today) {
      todo.todayDate = todo.completed ? '' : today;
      changed = true;
    }
  }
  if (changed) persist();
}

export function enterFocus() {
  state.focusMode = true;
  persist();
}

export function exitFocus() {
  state.focusMode = false;
  persist();
}

export function toggleFocusBg() {
  state.focusBg = !state.focusBg;
  persist();
}

export function setActiveCategory(name) {
  state.activeCategory = name;
  persist();
  if (typeof state._onchange === 'function') state._onchange();
}

export function setActiveFilter(filter) {
  state.activeFilter = filter;
  persist();
  if (typeof state._onchange === 'function') state._onchange();
}
```

- [ ] **Step 2: Verify in browser console**

Open `http://localhost:8080`, DevTools console:

```js
import('./js/state.js').then(({ state, enterFocus, exitFocus, toggleFocusBg, initState }) => {
  initState();
  enterFocus();
  console.log(state.focusMode); // true
  exitFocus();
  console.log(state.focusMode); // false
  console.log(state.focusBg);   // true
  toggleFocusBg();
  console.log(state.focusBg);   // false
});
```

- [ ] **Step 3: Commit**

```bash
git add js/state.js
git commit -m "feat: add focusMode/focusBg state and enterFocus/exitFocus/toggleFocusBg operations"
```

---

### Task 2: Focus overlay CSS

**Files:**
- Modify: `style.css`

- [ ] **Step 1: Add Focus overlay styles to `style.css`**

Append to the end of `style.css`:

```css
/* ── Focus Mode ── */
#focus-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  background-size: cover;
  background-position: center;
}

#focus-overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(13, 13, 26, 0.55);
  pointer-events: none;
}

.focus-card {
  position: relative;
  z-index: 1;
  background: rgba(18, 18, 42, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 32px;
  min-width: 320px;
  max-width: 480px;
  width: 90%;
}

.focus-title {
  font-size: 10px;
  letter-spacing: 3px;
  color: var(--accent);
  margin-bottom: 8px;
}

.focus-subtitle {
  font-size: 11px;
  color: var(--text-dim);
  letter-spacing: 2px;
  margin-bottom: 20px;
}

.focus-todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}

.focus-todo-item:last-child { border-bottom: none; }

.focus-todo-item.completed { opacity: 0.45; }
.focus-todo-item.completed .focus-todo-text { text-decoration: line-through; }

.focus-todo-item input[type="checkbox"] {
  appearance: none;
  width: 18px;
  height: 18px;
  border: 2px solid var(--accent-dim);
  border-radius: 3px;
  cursor: pointer;
  flex-shrink: 0;
  position: relative;
  background: transparent;
}

.focus-todo-item input[type="checkbox"]:checked {
  background: var(--accent);
  border-color: var(--accent);
}

.focus-todo-item input[type="checkbox"]:checked::after {
  content: '✓';
  position: absolute;
  top: -2px;
  left: 2px;
  color: var(--bg);
  font-size: 14px;
  font-weight: bold;
}

.focus-todo-text {
  font-size: 14px;
  color: var(--text);
  flex: 1;
}

.focus-empty {
  color: var(--text-dim);
  font-size: 13px;
  letter-spacing: 1px;
  text-align: center;
  padding: 16px 0;
}

/* Exit button — bottom right */
.focus-exit-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1001;
  background: rgba(18, 18, 42, 0.75);
  border: 1px solid var(--border);
  color: var(--text-dim);
  font-family: inherit;
  font-size: 12px;
  padding: 8px 14px;
  border-radius: 4px;
  cursor: pointer;
  backdrop-filter: blur(8px);
  letter-spacing: 1px;
}

.focus-exit-btn:hover { color: var(--accent); border-color: var(--accent-dim); }

/* Background toggle button — top left */
.focus-bg-btn {
  position: fixed;
  top: 24px;
  left: 24px;
  z-index: 1001;
  background: rgba(18, 18, 42, 0.75);
  border: 1px solid var(--border);
  color: var(--text-dim);
  font-family: inherit;
  font-size: 12px;
  padding: 8px 14px;
  border-radius: 4px;
  cursor: pointer;
  backdrop-filter: blur(8px);
  letter-spacing: 1px;
}

.focus-bg-btn:hover { color: var(--accent); border-color: var(--accent-dim); }

/* Mobile: icon-only buttons */
@media (max-width: 600px) {
  .focus-exit-btn .focus-btn-text { display: none; }
  .focus-bg-btn .focus-btn-text { display: none; }

  .focus-exit-btn {
    width: 44px;
    height: 44px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }

  .focus-bg-btn {
    width: 44px;
    height: 44px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add style.css
git commit -m "feat: add Focus mode CSS — overlay, card, exit button, bg toggle button"
```

---

### Task 3: renderFocus() and Esc listener

**Files:**
- Modify: `js/app.js`

- [ ] **Step 1: Add `enterFocus`, `exitFocus`, `toggleFocusBg` to imports in `js/app.js`**

Replace the import block at the top:

```js
import {
  state, initState,
  addTodo, toggleTodo, editTodo, deleteTodo,
  addCategory, deleteCategory,
  setActiveCategory, setActiveFilter,
  importData,
  addToToday, removeFromToday, reconcileToday,
  enterFocus, exitFocus, toggleFocusBg,
} from './state.js';
```

- [ ] **Step 2: Add `renderFocus()` function to `js/app.js`**

Add this function before `export function render()`:

```js
function renderFocus() {
  // Remove existing overlay if present
  const existing = document.getElementById('focus-overlay');
  if (existing) existing.remove();

  if (!state.focusMode) {
    document.body.style.overflow = '';
    return;
  }

  document.body.style.overflow = 'hidden';

  const overlay = document.createElement('div');
  overlay.id = 'focus-overlay';

  // Background image
  if (state.focusBg) {
    const seed = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const bgUrl = `https://source.unsplash.com/1920x1080/?landscape,nature&sig=${seed}`;
    overlay.style.backgroundImage = `url(${bgUrl})`;
  }

  // Card
  const card = document.createElement('div');
  card.className = 'focus-card';

  const focusTitle = document.createElement('div');
  focusTitle.className = 'focus-title';
  focusTitle.textContent = '// FOCUS';
  card.appendChild(focusTitle);

  const todayTodos = state.todos.filter(t => t.todayDate);
  const completedCount = todayTodos.filter(t => t.completed).length;

  const subtitle = document.createElement('div');
  subtitle.className = 'focus-subtitle';
  subtitle.textContent = `TODAY · ${completedCount}/${todayTodos.length} TASKS`;
  card.appendChild(subtitle);

  if (todayTodos.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'focus-empty';
    empty.textContent = '// nothing planned for today';
    card.appendChild(empty);
  } else {
    for (const todo of todayTodos) {
      const item = document.createElement('div');
      item.className = 'focus-todo-item' + (todo.completed ? ' completed' : '');

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = todo.completed;
      checkbox.addEventListener('change', () => { toggleTodo(todo.id); render(); });
      item.appendChild(checkbox);

      const text = document.createElement('span');
      text.className = 'focus-todo-text';
      text.textContent = todo.text;
      item.appendChild(text);

      card.appendChild(item);
    }
  }

  overlay.appendChild(card);

  // Exit button (bottom right)
  const exitBtn = document.createElement('button');
  exitBtn.className = 'focus-exit-btn';
  exitBtn.innerHTML = '✕ <span class="focus-btn-text">ESC to exit</span>';
  exitBtn.addEventListener('click', () => { exitFocus(); render(); });
  overlay.appendChild(exitBtn);

  // Background toggle button (top left)
  const bgBtn = document.createElement('button');
  bgBtn.className = 'focus-bg-btn';
  bgBtn.innerHTML = state.focusBg
    ? '🌄 <span class="focus-btn-text">Hide bg</span>'
    : '🌄 <span class="focus-btn-text">Show bg</span>';
  bgBtn.addEventListener('click', () => { toggleFocusBg(); render(); });
  overlay.appendChild(bgBtn);

  document.body.appendChild(overlay);
}
```

- [ ] **Step 3: Call `renderFocus()` from `render()`**

Replace `export function render()`:

```js
export function render() {
  renderFocus();
  if (state.focusMode) return; // don't re-render sidebar/main while in focus
  renderSidebar();
  renderMain();
  renderMobileBar();
}
```

- [ ] **Step 4: Add Esc keydown listener**

In `js/app.js`, after `state._onchange = render;`, add:

```js
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state.focusMode) { exitFocus(); render(); }
});
```

- [ ] **Step 5: Verify Focus overlay in browser**

Open `http://localhost:8080`:

```
[ ] Add a todo, click ☀ to mark it as Today
[ ] Click "⊙ Focus" in sidebar (not yet added — test via console for now)
```

In DevTools console:

```js
const { enterFocus } = await import('./js/state.js');
const { render } = await import('./js/app.js');
enterFocus(); render();
```

Expected:
- Full-screen overlay appears with landscape background
- Card shows `// FOCUS` title and today's tasks
- Checkbox toggles work
- Esc key exits
- Background loads (may take a moment)

- [ ] **Step 6: Commit**

```bash
git add js/app.js
git commit -m "feat: add renderFocus() with Unsplash background, task list, exit and bg toggle buttons"
```

---

### Task 4: ⊙ Focus entry points in sidebar and mobile bar

**Files:**
- Modify: `js/app.js`

- [ ] **Step 1: Add ⊙ Focus button to sidebar**

In `js/app.js`, in `renderSidebar()`, add before the Export button:

```js
// Focus button
const focusBtn = document.createElement('button');
focusBtn.className = 'sidebar-action';
focusBtn.textContent = '⊙ Focus';
focusBtn.addEventListener('click', () => { enterFocus(); render(); });
sidebar.appendChild(focusBtn);
```

- [ ] **Step 2: Add ⊙ Focus button to mobile bar**

In `js/app.js`, in `renderMobileBar()`, add after the `todayMobileBtn`:

```js
const focusMobileBtn = document.createElement('button');
focusMobileBtn.className = 'mobile-today-btn';
focusMobileBtn.textContent = '⊙';
focusMobileBtn.title = 'Focus mode';
focusMobileBtn.addEventListener('click', () => { enterFocus(); render(); });
bar.appendChild(focusMobileBtn);
```

- [ ] **Step 3: Verify full end-to-end flow**

Open `http://localhost:8080` and test:

```
[ ] Add 2-3 todos, mark some with ☀
[ ] Click "⊙ Focus" in sidebar — overlay appears
[ ] Background image loads (Unsplash landscape)
[ ] Card shows "TODAY · 0/N TASKS"
[ ] Check off a task — count updates
[ ] Click 🌄 Hide bg — background disappears, dark bg shown
[ ] Click 🌄 Show bg — background reappears
[ ] Press Esc — overlay closes, previous view restored
[ ] Click ✕ ESC to exit — same result
[ ] Reload page — focusBg preference persists
[ ] Mobile (DevTools emulation): ⊙ button in top bar, ✕ icon only for exit
```

- [ ] **Step 4: Commit**

```bash
git add js/app.js
git commit -m "feat: add Focus entry points to sidebar and mobile bar"
```

---

### Task 5: Push to GitHub

**Files:**
- No code changes

- [ ] **Step 1: Push all commits**

```bash
git push
```

Expected: all commits pushed to `origin/main`, GitHub Pages deploys automatically within 1-2 minutes.

- [ ] **Step 2: Verify on GitHub Pages**

Open `https://dan1elfw.github.io/awesome-todo/` and run through the full flow on both desktop and mobile.
