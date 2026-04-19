# Today Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Today virtual view where users can mark any todo with ☀ to plan their day, with automatic carry-forward of incomplete tasks.

**Architecture:** Add `todayDate` field to todo objects. `reconcileToday()` runs on startup to carry forward incomplete tasks and clear completed ones. `state.activeCategory = 'today'` activates the Today view. ☀ button on each todo row toggles the mark.

**Tech Stack:** Vanilla JS (ES modules), plain CSS, localStorage.

---

## File Map

| File | Change |
|---|---|
| `js/state.js` | Add `addToToday()`, `removeFromToday()`, `reconcileToday()` |
| `js/storage.js` | Extend meta to persist `focusMode`, `focusBg` (prep for Focus plan) |
| `js/app.js` | Today entry in sidebar + mobile bar, ☀ button on todo rows, Today view filter |
| `style.css` | ☀ button active/inactive styles, Today sidebar entry style |

---

### Task 1: Add todayDate state operations

**Files:**
- Modify: `js/state.js`

- [ ] **Step 1: Add `addToToday`, `removeFromToday`, `reconcileToday` to `state.js`**

Replace the end of `js/state.js` (after `importData`) with:

```js
export function addToToday(id) {
  const todo = state.todos.find(t => t.id === id);
  if (todo) {
    todo.todayDate = new Date().toISOString().slice(0, 10);
    persist();
  }
}

export function removeFromToday(id) {
  const todo = state.todos.find(t => t.id === id);
  if (todo) {
    todo.todayDate = '';
    persist();
  }
}

export function reconcileToday() {
  const today = new Date().toISOString().slice(0, 10);
  let changed = false;
  for (const todo of state.todos) {
    if (!todo.todayDate) continue;
    if (todo.todayDate < today) {
      if (todo.completed) {
        todo.todayDate = '';
      } else {
        todo.todayDate = today;
      }
      changed = true;
    }
  }
  if (changed) persist();
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

Open `index.html` via `python3 -m http.server 8080`, open DevTools console:

```js
import('./js/state.js').then(({ state, addToToday, removeFromToday, reconcileToday, initState }) => {
  initState();
  // Add a test todo manually
  state.todos.push({ id: 'test-1', text: 'Test', category: 'Personal', completed: false, dueDate: '', todayDate: '' });
  addToToday('test-1');
  console.log(state.todos[0].todayDate); // today's date e.g. "2026-04-20"
  removeFromToday('test-1');
  console.log(state.todos[0].todayDate); // ""
});
```

Expected: today's date string, then empty string.

- [ ] **Step 3: Commit**

```bash
git add js/state.js
git commit -m "feat: add todayDate state operations — addToToday, removeFromToday, reconcileToday"
```

---

### Task 2: Extend storage meta + wire reconcileToday on init

**Files:**
- Modify: `js/storage.js`
- Modify: `js/app.js` (init section only)

- [ ] **Step 1: Extend `saveToStorage` meta to include `focusMode` and `focusBg`**

In `js/storage.js`, replace the meta write line:

```js
localStorage.setItem(`${PREFIX}:meta`, JSON.stringify({
  activeCategory: state.activeCategory,
  activeFilter: state.activeFilter,
  focusMode: state.focusMode || false,
  focusBg: state.focusBg !== false,
}));
```

- [ ] **Step 2: Extend `loadFromStorage` to restore `focusMode` and `focusBg`**

In `js/storage.js`, replace the return statement in `loadFromStorage`:

```js
return {
  categories,
  todos,
  activeCategory: meta.activeCategory || 'All',
  activeFilter: meta.activeFilter || 'all',
  focusMode: meta.focusMode || false,
  focusBg: meta.focusBg !== false,
};
```

- [ ] **Step 3: Wire `reconcileToday` in `js/app.js` init block**

In `js/app.js`, replace the init block at the bottom:

```js
initState();
reconcileToday();

if (!state.storageAvailable) {
  console.warn('awesome-todo: localStorage unavailable, running in-memory only');
}

// Hook up state change listener
state._onchange = render;

render();
```

Also add `reconcileToday` to the import line at the top of `js/app.js`:

```js
import {
  state, initState,
  addTodo, toggleTodo, editTodo, deleteTodo,
  addCategory, deleteCategory,
  setActiveCategory, setActiveFilter,
  importData,
  addToToday, removeFromToday, reconcileToday,
} from './state.js';
```

- [ ] **Step 4: Verify in browser**

Open `http://localhost:8080`, open DevTools → Application → localStorage. Confirm `awesome-todo:meta` now contains `focusMode` and `focusBg` keys after any interaction.

- [ ] **Step 5: Commit**

```bash
git add js/storage.js js/app.js
git commit -m "feat: extend storage meta with focusMode/focusBg, wire reconcileToday on init"
```

---

### Task 3: Today entry in sidebar and mobile bar

**Files:**
- Modify: `js/app.js`
- Modify: `style.css`

- [ ] **Step 1: Add Today entry to sidebar in `renderSidebar()`**

In `js/app.js`, in `renderSidebar()`, insert after the app title div and before the `catLabel` (Lists label):

```js
// Today entry
const todayCount = state.todos.filter(t => t.todayDate).length;
const todayItem = document.createElement('div');
todayItem.className = 'category-item today-item' + (state.activeCategory === 'today' ? ' active' : '');

const todayIcon = document.createElement('span');
todayIcon.textContent = '☀';
todayIcon.style.marginRight = '8px';
todayItem.appendChild(todayIcon);

const todayLabel = document.createElement('span');
todayLabel.textContent = 'Today';
todayItem.appendChild(todayLabel);

if (todayCount > 0) {
  const todayBadge = document.createElement('span');
  todayBadge.className = 'today-count';
  todayBadge.textContent = todayCount;
  todayItem.appendChild(todayBadge);
}

todayItem.addEventListener('click', () => { setActiveCategory('today'); render(); });
sidebar.appendChild(todayItem);

// Divider
const divider = document.createElement('div');
divider.className = 'sidebar-divider';
sidebar.appendChild(divider);
```

- [ ] **Step 2: Add ☀ Today button to mobile bar in `renderMobileBar()`**

In `js/app.js`, in `renderMobileBar()`, insert after the title span and before the menuBtn:

```js
const todayCount = state.todos.filter(t => t.todayDate).length;
const todayMobileBtn = document.createElement('button');
todayMobileBtn.className = 'mobile-today-btn' + (state.activeCategory === 'today' ? ' active' : '');
todayMobileBtn.textContent = todayCount > 0 ? `☀ ${todayCount}` : '☀';
todayMobileBtn.addEventListener('click', () => { setActiveCategory('today'); render(); });
bar.appendChild(todayMobileBtn);
```

- [ ] **Step 3: Add CSS for Today sidebar entry and mobile button**

In `style.css`, add before the `/* ── Mobile ── */` section:

```css
/* Today entry */
.today-count {
  margin-left: auto;
  font-size: 10px;
  background: var(--accent-dim);
  color: var(--bg);
  border-radius: 10px;
  padding: 1px 6px;
  font-weight: bold;
}

.sidebar-divider {
  height: 1px;
  background: var(--border);
  margin: 4px 0;
}

.mobile-today-btn {
  background: none;
  border: 1px solid var(--border);
  color: var(--text-dim);
  font-family: inherit;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
}

.mobile-today-btn.active {
  color: var(--accent);
  border-color: var(--accent-dim);
}
```

- [ ] **Step 4: Verify in browser**

Open `http://localhost:8080`:
- Sidebar shows `☀ Today` entry above the Lists divider
- Mobile view (DevTools device emulation) shows `☀` button in top bar
- Clicking either sets active view to Today (main area shows empty state for now)

- [ ] **Step 5: Commit**

```bash
git add js/app.js style.css
git commit -m "feat: add Today entry to sidebar and mobile bar"
```

---

### Task 4: ☀ button on todo rows + Today view filter

**Files:**
- Modify: `js/app.js`
- Modify: `style.css`

- [ ] **Step 1: Add ☀ button to each todo row in `renderMain()`**

In `js/app.js`, in `renderMain()`, in the todo row loop, add the ☀ button to `actions` before the edit button:

```js
// Today toggle button
const todayBtn = document.createElement('button');
todayBtn.className = 'todo-btn today-btn' + (todo.todayDate ? ' today-active' : '');
todayBtn.textContent = '☀';
todayBtn.title = todo.todayDate ? 'Remove from Today' : 'Add to Today';
todayBtn.addEventListener('click', () => {
  if (todo.todayDate) {
    removeFromToday(todo.id);
  } else {
    addToToday(todo.id);
  }
  render();
});
actions.appendChild(todayBtn);
```

- [ ] **Step 2: Add Today view filter logic in `renderMain()`**

In `js/app.js`, in `renderMain()`, replace the filter todos section:

```js
// Filter todos
let visible = state.todos;
if (state.activeCategory === 'today') {
  visible = visible.filter(t => t.todayDate);
} else if (state.activeCategory !== 'All') {
  visible = visible.filter(t => t.category === state.activeCategory);
}
if (state.activeFilter === 'active') visible = visible.filter(t => !t.completed);
if (state.activeFilter === 'completed') visible = visible.filter(t => t.completed);
```

- [ ] **Step 3: Update empty state message for Today view**

In `js/app.js`, replace the empty state text:

```js
if (visible.length === 0) {
  const empty = document.createElement('div');
  empty.className = 'empty-state';
  empty.textContent = state.activeCategory === 'today'
    ? '// nothing planned for today'
    : '// no tasks found';
  list.appendChild(empty);
}
```

- [ ] **Step 4: Add CSS for ☀ button active state**

In `style.css`, add after `.todo-btn.danger:hover`:

```css
.todo-btn.today-btn { color: var(--text-dim); }
.todo-btn.today-btn.today-active { color: #fbbf24; }
.todo-btn.today-btn:hover { color: #fbbf24; }
```

- [ ] **Step 5: Verify full Today flow in browser**

Open `http://localhost:8080` and test:

```
[ ] Add a todo to Personal
[ ] Click ☀ on the todo — button turns yellow
[ ] Click "☀ Today" in sidebar — todo appears in Today view
[ ] Click ☀ again — todo removed from Today view
[ ] Today view shows "// nothing planned for today" when empty
[ ] Active/Completed filters work in Today view
[ ] Reload page — todayDate persists in localStorage
```

- [ ] **Step 6: Commit**

```bash
git add js/app.js style.css
git commit -m "feat: add Today view filter and ☀ toggle button on todo rows"
```

---

### Task 5: reconcileToday end-to-end test

**Files:**
- No file changes — manual verification only

- [ ] **Step 1: Simulate carry-forward in browser console**

Open `http://localhost:8080`, open DevTools console:

```js
// Simulate a todo that was added to Today yesterday
const { state } = await import('./js/state.js');
const todo = state.todos[0]; // assumes at least one todo exists
if (todo) {
  todo.todayDate = '2026-04-19'; // yesterday
  todo.completed = false;
  console.log('Before reconcile:', todo.todayDate);
}
```

Then reload the page and check:

```js
const { state } = await import('./js/state.js');
console.log(state.todos[0].todayDate); // should be today: "2026-04-20"
```

- [ ] **Step 2: Simulate completed task cleanup**

```js
const { state } = await import('./js/state.js');
const todo = state.todos[0];
if (todo) {
  todo.todayDate = '2026-04-19'; // yesterday
  todo.completed = true;
  // manually save
  const { saveToStorage } = await import('./js/storage.js');
  saveToStorage(state);
}
```

Reload page and check:

```js
const { state } = await import('./js/state.js');
console.log(state.todos[0].todayDate); // should be "" (cleared)
```

- [ ] **Step 3: Commit if any fixes needed, otherwise note "no changes required"**

```bash
git add js/app.js js/state.js
git commit -m "fix: <describe what was fixed>"
```
