# awesome-todo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal, browser-based todo app with categories, due dates, filters, and localStorage persistence — no build step, no dependencies.

**Architecture:** Three ES module JS files (`storage.js`, `state.js`, `app.js`) loaded by `index.html`. All state lives in a flat in-memory object synced to localStorage on every mutation. The DOM is fully re-rendered on each state change via a single `render()` call.

**Tech Stack:** Vanilla JS (ES modules), plain CSS, localStorage API, no frameworks.

---

## File Map

| File | Responsibility |
|---|---|
| `index.html` | Shell — loads CSS and JS modules, defines DOM skeleton |
| `style.css` | Cyberpunk Purple theme, sidebar layout, all visual styles |
| `js/storage.js` | Read/write localStorage; split todos by category on save, merge on load |
| `js/state.js` | In-memory state object + all mutation operations |
| `js/app.js` | `render()` function + all DOM event handlers |

---

### Task 1: Project scaffold

**Files:**
- Create: `index.html`
- Create: `style.css`
- Create: `js/storage.js`
- Create: `js/state.js`
- Create: `js/app.js`

- [ ] **Step 1: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>awesome-todo</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="app">
    <aside id="sidebar"></aside>
    <main id="main"></main>
  </div>
  <script type="module" src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `style.css` with Cyberpunk Purple theme and sidebar layout**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #0d0d1a;
  --bg2: #12122a;
  --accent: #a78bfa;
  --accent-dim: #7b5ea7;
  --text: #e0e0ff;
  --text-dim: #7b7baa;
  --border: #7b5ea733;
  --danger: #f87171;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Courier New', Courier, monospace;
  height: 100vh;
  overflow: hidden;
}

#app {
  display: flex;
  height: 100vh;
}

/* Sidebar */
#sidebar {
  width: 220px;
  min-width: 220px;
  background: var(--bg2);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  gap: 8px;
  overflow-y: auto;
}

.sidebar-label {
  font-size: 10px;
  letter-spacing: 3px;
  color: var(--text-dim);
  text-transform: uppercase;
  margin: 16px 0 6px;
}

.sidebar-label:first-child { margin-top: 0; }

.category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-dim);
  font-size: 13px;
  border: 1px solid transparent;
}

.category-item:hover { color: var(--text); border-color: var(--border); }
.category-item.active { color: var(--accent); border-color: var(--accent-dim); }

.category-item .del-cat {
  background: none;
  border: none;
  color: var(--text-dim);
  cursor: pointer;
  font-size: 12px;
  padding: 0 2px;
  display: none;
}

.category-item:hover .del-cat { display: inline; }
.category-item .del-cat:hover { color: var(--danger); }

.filter-btn {
  background: none;
  border: 1px solid transparent;
  color: var(--text-dim);
  font-family: inherit;
  font-size: 13px;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  text-align: left;
  width: 100%;
}

.filter-btn:hover { color: var(--text); border-color: var(--border); }
.filter-btn.active { color: var(--accent); border-color: var(--accent-dim); }

.sidebar-action {
  background: none;
  border: 1px solid var(--border);
  color: var(--text-dim);
  font-family: inherit;
  font-size: 12px;
  padding: 7px 10px;
  border-radius: 4px;
  cursor: pointer;
  text-align: left;
  width: 100%;
  margin-top: 4px;
}

.sidebar-action:hover { color: var(--accent); border-color: var(--accent-dim); }

/* Main */
#main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 32px;
  overflow-y: auto;
  gap: 16px;
}

.add-bar {
  display: flex;
  gap: 8px;
}

.add-bar input, .add-bar select {
  background: var(--bg2);
  border: 1px solid var(--border);
  color: var(--text);
  font-family: inherit;
  font-size: 14px;
  padding: 10px 14px;
  border-radius: 4px;
  outline: none;
}

.add-bar input:focus, .add-bar select:focus { border-color: var(--accent-dim); }
.add-bar input[type="text"] { flex: 1; }
.add-bar input[type="date"] { width: 160px; color-scheme: dark; }

/* Todo list */
.todo-list { display: flex; flex-direction: column; gap: 8px; }

.todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 12px 14px;
}

.todo-item.completed { opacity: 0.45; }
.todo-item.completed .todo-text { text-decoration: line-through; }

.todo-item input[type="checkbox"] {
  accent-color: var(--accent);
  width: 16px;
  height: 16px;
  cursor: pointer;
  flex-shrink: 0;
}

.todo-text { flex: 1; font-size: 14px; word-break: break-word; }

.todo-edit-input {
  flex: 1;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--accent);
  color: var(--text);
  font-family: inherit;
  font-size: 14px;
  outline: none;
}

.todo-badge {
  font-size: 10px;
  letter-spacing: 1px;
  color: var(--accent);
  border: 1px solid var(--accent-dim);
  border-radius: 3px;
  padding: 2px 6px;
  white-space: nowrap;
}

.todo-due {
  font-size: 11px;
  color: var(--text-dim);
  white-space: nowrap;
}

.todo-due.overdue { color: var(--danger); }

.todo-actions { display: flex; gap: 6px; }

.todo-btn {
  background: none;
  border: none;
  color: var(--text-dim);
  cursor: pointer;
  font-size: 13px;
  padding: 2px 4px;
}

.todo-btn:hover { color: var(--accent); }
.todo-btn.danger:hover { color: var(--danger); }

.empty-state {
  color: var(--text-dim);
  font-size: 13px;
  letter-spacing: 1px;
  padding: 32px 0;
  text-align: center;
}

/* Warning banner */
.warning-banner {
  background: #2a1a1a;
  border: 1px solid var(--danger);
  color: var(--danger);
  font-size: 12px;
  padding: 8px 14px;
  border-radius: 4px;
}
```

- [ ] **Step 3: Create `js/storage.js`** (empty stub for now)

```js
// storage.js — read/write localStorage
export function saveToStorage(state) {}
export function loadFromStorage() { return null; }
```

- [ ] **Step 4: Create `js/state.js`** (empty stub)

```js
// state.js — in-memory state + operations
export const state = {
  categories: [],
  todos: [],
  activeCategory: 'All',
  activeFilter: 'all',
};
```

- [ ] **Step 5: Create `js/app.js`** (empty stub)

```js
// app.js — rendering + event handling
import { state } from './state.js';

export function render() {}

render();
```

- [ ] **Step 6: Open `index.html` in browser, verify blank page loads with no console errors**

- [ ] **Step 7: Commit**

```bash
git add index.html style.css js/storage.js js/state.js js/app.js
git commit -m "feat: scaffold project structure and CSS theme"
```

---

### Task 2: Storage layer

**Files:**
- Modify: `js/storage.js`

- [ ] **Step 1: Implement `saveToStorage(state)`**

```js
const PREFIX = 'awesome-todo';

export function saveToStorage(state) {
  try {
    localStorage.setItem(`${PREFIX}:categories`, JSON.stringify(state.categories));
    // Write one key per category
    const byCategory = {};
    for (const cat of state.categories) byCategory[cat] = [];
    for (const todo of state.todos) {
      if (!byCategory[todo.category]) byCategory[todo.category] = [];
      byCategory[todo.category].push(todo);
    }
    for (const [cat, todos] of Object.entries(byCategory)) {
      localStorage.setItem(`${PREFIX}:todos:${cat}`, JSON.stringify(todos));
    }
    localStorage.setItem(`${PREFIX}:meta`, JSON.stringify({
      activeCategory: state.activeCategory,
      activeFilter: state.activeFilter,
    }));
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 2: Implement `loadFromStorage()`**

```js
export function loadFromStorage() {
  try {
    const categories = JSON.parse(localStorage.getItem(`${PREFIX}:categories`) || 'null');
    if (!categories) return null;
    const todos = [];
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(`${PREFIX}:todos:`)) {
        todos.push(...JSON.parse(localStorage.getItem(key) || '[]'));
      }
    }
    const meta = JSON.parse(localStorage.getItem(`${PREFIX}:meta`) || '{}');
    return {
      categories,
      todos,
      activeCategory: meta.activeCategory || 'All',
      activeFilter: meta.activeFilter || 'all',
    };
  } catch {
    return null;
  }
}
```

- [ ] **Step 3: Verify in browser console**

Open `index.html`, open DevTools console, paste and run:

```js
import('./js/storage.js').then(({ saveToStorage, loadFromStorage }) => {
  saveToStorage({ categories: ['Work'], todos: [{ id: '1', text: 'Test', category: 'Work', completed: false, dueDate: '' }], activeCategory: 'All', activeFilter: 'all' });
  console.log(loadFromStorage());
});
```

Expected: object with `categories: ['Work']`, `todos` array with one item.

- [ ] **Step 4: Commit**

```bash
git add js/storage.js
git commit -m "feat: implement localStorage save/load with per-category keys"
```

---

### Task 3: State + operations

**Files:**
- Modify: `js/state.js`

- [ ] **Step 1: Implement full state module**

```js
import { saveToStorage, loadFromStorage } from './storage.js';

export const state = {
  categories: ['Personal'],
  todos: [],
  activeCategory: 'All',
  activeFilter: 'all',
  storageAvailable: true,
};

export function initState() {
  const saved = loadFromStorage();
  if (saved === null) {
    // First run or localStorage unavailable — check which
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
  const id = Math.random().toString(36).slice(2, 10);
  state.todos.push({ id, text, category, completed: false, dueDate });
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
  // Reassign todos to Uncategorized
  const affected = state.todos.filter(t => t.category === name);
  if (affected.length) {
    if (!state.categories.includes('Uncategorized')) {
      state.categories.push('Uncategorized');
    }
    affected.forEach(t => { t.category = 'Uncategorized'; });
  }
  // Clean up orphaned localStorage key
  try { localStorage.removeItem(`awesome-todo:todos:${name}`); } catch {}
  if (state.activeCategory === name) state.activeCategory = 'All';
  persist();
}

export function setActiveCategory(name) {
  state.activeCategory = name;
  persist();
}

export function setActiveFilter(filter) {
  state.activeFilter = filter;
  persist();
}
```

- [ ] **Step 2: Verify in browser console**

```js
import('./js/state.js').then(({ state, addTodo, addCategory, deleteCategory }) => {
  addCategory('Work');
  addTodo('Buy groceries', 'Work', '');
  addTodo('Finish report', 'Work', '2026-04-20');
  console.log(state.todos.length); // 2
  deleteCategory('Work');
  console.log(state.todos[0].category); // "Uncategorized"
  console.log(state.categories); // ["Personal", "Uncategorized"]
});
```

- [ ] **Step 3: Commit**

```bash
git add js/state.js
git commit -m "feat: implement state operations with localStorage persistence"
```

---

### Task 4: Render sidebar

**Files:**
- Modify: `js/app.js`

- [ ] **Step 1: Implement sidebar rendering**

```js
import {
  state, initState,
  addCategory, deleteCategory,
  setActiveCategory, setActiveFilter,
} from './state.js';

function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = '';

  // Categories label
  const catLabel = document.createElement('div');
  catLabel.className = 'sidebar-label';
  catLabel.textContent = 'Lists';
  sidebar.appendChild(catLabel);

  // "All" item
  const allItem = document.createElement('div');
  allItem.className = 'category-item' + (state.activeCategory === 'All' ? ' active' : '');
  allItem.textContent = 'All';
  allItem.addEventListener('click', () => { setActiveCategory('All'); render(); });
  sidebar.appendChild(allItem);

  // Per-category items
  for (const cat of state.categories) {
    const item = document.createElement('div');
    item.className = 'category-item' + (state.activeCategory === cat ? ' active' : '');

    const nameSpan = document.createElement('span');
    nameSpan.textContent = cat;
    item.appendChild(nameSpan);

    const delBtn = document.createElement('button');
    delBtn.className = 'del-cat';
    delBtn.textContent = '✕';
    delBtn.title = `Delete ${cat}`;
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Delete category "${cat}"? Its todos will move to Uncategorized.`)) {
        deleteCategory(cat);
        render();
      }
    });
    item.appendChild(delBtn);

    item.addEventListener('click', () => { setActiveCategory(cat); render(); });
    sidebar.appendChild(item);
  }

  // Add category button
  const addCatBtn = document.createElement('button');
  addCatBtn.className = 'sidebar-action';
  addCatBtn.textContent = '+ New list';
  addCatBtn.addEventListener('click', () => {
    const name = prompt('List name:');
    if (name && name.trim()) { addCategory(name.trim()); render(); }
  });
  sidebar.appendChild(addCatBtn);

  // Filter label
  const filterLabel = document.createElement('div');
  filterLabel.className = 'sidebar-label';
  filterLabel.textContent = 'Filter';
  sidebar.appendChild(filterLabel);

  for (const [value, label] of [['all', 'All'], ['active', 'Active'], ['completed', 'Completed']]) {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (state.activeFilter === value ? ' active' : '');
    btn.textContent = label;
    btn.addEventListener('click', () => { setActiveFilter(value); render(); });
    sidebar.appendChild(btn);
  }

  // Export button
  const exportBtn = document.createElement('button');
  exportBtn.className = 'sidebar-action';
  exportBtn.textContent = '↓ Export all';
  exportBtn.style.marginTop = 'auto';
  exportBtn.addEventListener('click', exportAll);
  sidebar.appendChild(exportBtn);
}

function exportAll() {
  const data = {
    exportedAt: new Date().toISOString(),
    categories: state.categories,
    todos: state.todos,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `awesome-todo-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function render() {
  renderSidebar();
}

initState();
render();
```

- [ ] **Step 2: Open `index.html` in browser, verify sidebar renders with "All", "Personal", filter buttons, and export button**

- [ ] **Step 3: Commit**

```bash
git add js/app.js
git commit -m "feat: render sidebar with categories, filters, and export"
```

---

### Task 5: Render todo list + add todo

**Files:**
- Modify: `js/app.js`

- [ ] **Step 1: Add `renderMain()` to `app.js`**

Add these imports at the top (replace existing import line):

```js
import {
  state, initState,
  addTodo, toggleTodo, editTodo, deleteTodo,
  addCategory, deleteCategory,
  setActiveCategory, setActiveFilter,
} from './state.js';
```

Add `renderMain()` function before `render()`:

```js
function renderMain() {
  const main = document.getElementById('main');
  main.innerHTML = '';

  // Storage warning
  if (!state.storageAvailable) {
    const banner = document.createElement('div');
    banner.className = 'warning-banner';
    banner.textContent = '⚠ localStorage unavailable — data will not persist.';
    main.appendChild(banner);
  }

  // Add bar
  const addBar = document.createElement('div');
  addBar.className = 'add-bar';

  const textInput = document.createElement('input');
  textInput.type = 'text';
  textInput.placeholder = '▶ New task...';

  const catSelect = document.createElement('select');
  for (const cat of state.categories) {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    if (state.activeCategory !== 'All' && cat === state.activeCategory) opt.selected = true;
    catSelect.appendChild(opt);
  }

  const dateInput = document.createElement('input');
  dateInput.type = 'date';

  addBar.appendChild(textInput);
  addBar.appendChild(catSelect);
  addBar.appendChild(dateInput);
  main.appendChild(addBar);

  textInput.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const text = textInput.value.trim();
    if (!text) return;
    addTodo(text, catSelect.value, dateInput.value);
    textInput.value = '';
    dateInput.value = '';
    render();
  });

  // Filter todos
  let visible = state.todos;
  if (state.activeCategory !== 'All') {
    visible = visible.filter(t => t.category === state.activeCategory);
  }
  if (state.activeFilter === 'active') visible = visible.filter(t => !t.completed);
  if (state.activeFilter === 'completed') visible = visible.filter(t => t.completed);

  // Todo list
  const list = document.createElement('div');
  list.className = 'todo-list';

  if (visible.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = '// no tasks found';
    list.appendChild(empty);
  }

  const today = new Date().toISOString().slice(0, 10);

  for (const todo of visible) {
    const item = document.createElement('div');
    item.className = 'todo-item' + (todo.completed ? ' completed' : '');

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.addEventListener('change', () => { toggleTodo(todo.id); render(); });
    item.appendChild(checkbox);

    // Text span
    const textSpan = document.createElement('span');
    textSpan.className = 'todo-text';
    textSpan.textContent = todo.text;
    item.appendChild(textSpan);

    // Category badge
    const badge = document.createElement('span');
    badge.className = 'todo-badge';
    badge.textContent = todo.category;
    item.appendChild(badge);

    // Due date
    if (todo.dueDate) {
      const due = document.createElement('span');
      due.className = 'todo-due' + (todo.dueDate < today ? ' overdue' : '');
      due.textContent = todo.dueDate;
      item.appendChild(due);
    }

    // Actions
    const actions = document.createElement('div');
    actions.className = 'todo-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'todo-btn';
    editBtn.textContent = '✎';
    editBtn.title = 'Edit';
    editBtn.addEventListener('click', () => {
      // Replace span with input
      const input = document.createElement('input');
      input.className = 'todo-edit-input';
      input.value = todo.text;
      item.replaceChild(input, textSpan);
      input.focus();
      const save = () => {
        const newText = input.value.trim();
        if (newText) editTodo(todo.id, newText);
        render();
      };
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') save(); });
      input.addEventListener('blur', save);
    });
    actions.appendChild(editBtn);

    const delBtn = document.createElement('button');
    delBtn.className = 'todo-btn danger';
    delBtn.textContent = '✕';
    delBtn.title = 'Delete';
    delBtn.addEventListener('click', () => { deleteTodo(todo.id); render(); });
    actions.appendChild(delBtn);

    item.appendChild(actions);
    list.appendChild(item);
  }

  main.appendChild(list);
}
```

Update `render()` to call both:

```js
export function render() {
  renderSidebar();
  renderMain();
}
```

- [ ] **Step 2: Open `index.html` in browser and verify:**
  - Add bar renders with text input, category select, date input
  - Typing a task and pressing Enter adds it to the list
  - Checkbox toggles completion (dimmed + strikethrough)
  - Edit button replaces text with input; Enter/blur saves
  - Delete button removes the todo
  - Empty state shows `// no tasks found` when list is empty
  - Overdue dates appear in red

- [ ] **Step 3: Commit**

```bash
git add js/app.js
git commit -m "feat: render todo list with add, toggle, edit, delete, and due date"
```

---

### Task 6: Wire up filters and categories end-to-end

**Files:**
- No new files — verify existing wiring

- [ ] **Step 1: Open `index.html` and test the full flow**

Run through this checklist manually:

```
[ ] Add a todo to "Personal"
[ ] Add a category "Work" via sidebar
[ ] Add a todo to "Work"
[ ] Click "Work" in sidebar — only Work todos visible
[ ] Click "All" — both todos visible
[ ] Check off a todo
[ ] Click "Active" filter — only uncompleted visible
[ ] Click "Completed" filter — only completed visible
[ ] Click "All" filter — both visible
[ ] Delete "Work" category — its todo moves to Uncategorized
[ ] Reload page — all state restored from localStorage
```

- [ ] **Step 2: Test export**

```
[ ] Click "↓ Export all"
[ ] Verify a .json file downloads
[ ] Open the file — confirm it has exportedAt, categories, todos
```

- [ ] **Step 3: Commit if any fixes were needed, otherwise note "no changes required"**

```bash
git add -p
git commit -m "fix: <describe what was fixed>"
```

---

### Task 7: Polish and edge cases

**Files:**
- Modify: `js/app.js`
- Modify: `style.css`

- [ ] **Step 1: Add app title to sidebar**

At the top of `renderSidebar()`, before the catLabel, insert:

```js
const title = document.createElement('div');
title.style.cssText = 'font-size:11px;letter-spacing:3px;color:var(--accent);margin-bottom:16px;';
title.textContent = '// AWESOME-TODO';
sidebar.appendChild(title);
```

- [ ] **Step 2: Prevent adding empty category name**

Already handled in `addCategory()` — verify the `prompt` flow in `renderSidebar()` also trims and ignores empty:

```js
// This line already exists — confirm it's present:
if (name && name.trim()) { addCategory(name.trim()); render(); }
```

- [ ] **Step 3: Add `localStorage` unavailable warning on init**

In `js/app.js`, after `initState()`, add:

```js
if (!state.storageAvailable) {
  console.warn('awesome-todo: localStorage unavailable, running in-memory only');
}
```

- [ ] **Step 4: Open `index.html` and do a final visual check**

```
[ ] Title "// AWESOME-TODO" appears at top of sidebar
[ ] Cyberpunk purple theme looks correct throughout
[ ] No console errors
[ ] Sidebar scrolls if many categories
[ ] Long todo text wraps correctly
```

- [ ] **Step 5: Commit**

```bash
git add js/app.js style.css
git commit -m "feat: polish sidebar title and edge case guards"
```
