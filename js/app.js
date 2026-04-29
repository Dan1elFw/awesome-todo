// app.js — rendering + event handling
import {
  state, initState,
  addTodo, toggleTodo, editTodo, deleteTodo,
  addCategory, deleteCategory,
  setActiveCategory, setActiveFilter,
  importData,
  addToToday, removeFromToday, reconcileToday,
  enterFocus, exitFocus, toggleFocusBg,
} from './state.js';

let sidebarCollapsed = false;
let addSectionCollapsed = false;
let focusClockInterval = null;

// ── Custom select component ──────────────────────────────────────────────────
function createCustomSelect(options, defaultValue) {
  let selectedValue = options.includes(defaultValue) ? defaultValue : (options[0] || '');

  const wrapper = document.createElement('div');
  wrapper.className = 'custom-select';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'custom-select-trigger';

  const label = document.createElement('span');
  label.textContent = selectedValue;
  trigger.appendChild(label);

  const arrow = document.createElement('span');
  arrow.className = 'custom-select-trigger-arrow';
  arrow.textContent = '▾';
  trigger.appendChild(arrow);

  const dropdown = document.createElement('div');
  dropdown.className = 'custom-select-dropdown';
  dropdown.style.display = 'none';

  function renderOptions() {
    dropdown.innerHTML = '';
    for (const opt of options) {
      const optEl = document.createElement('div');
      optEl.className = 'custom-select-option' + (opt === selectedValue ? ' selected' : '');
      optEl.textContent = opt;
      optEl.addEventListener('mousedown', (e) => {
        e.preventDefault();
        selectedValue = opt;
        label.textContent = opt;
        closeDropdown();
      });
      dropdown.appendChild(optEl);
    }
  }

  function openDropdown() {
    renderOptions();
    dropdown.style.display = 'block';
    trigger.classList.add('open');
    const handleOutside = (e) => {
      if (!wrapper.contains(e.target)) {
        closeDropdown();
        document.removeEventListener('click', handleOutside);
      }
    };
    setTimeout(() => document.addEventListener('click', handleOutside), 0);
  }

  function closeDropdown() {
    dropdown.style.display = 'none';
    trigger.classList.remove('open');
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    trigger.classList.contains('open') ? closeDropdown() : openDropdown();
  });

  wrapper.appendChild(trigger);
  wrapper.appendChild(dropdown);
  wrapper.getValue = () => selectedValue;
  return wrapper;
}

// ── Custom modal dialogs ─────────────────────────────────────────────────────
function showPrompt(title, placeholder = '') {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal';

    const titleEl = document.createElement('div');
    titleEl.className = 'modal-title';
    titleEl.textContent = title;
    modal.appendChild(titleEl);

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'modal-input';
    input.placeholder = placeholder;
    modal.appendChild(input);

    const actions = document.createElement('div');
    actions.className = 'modal-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'modal-btn';
    cancelBtn.textContent = 'Cancel';

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'modal-btn primary';
    confirmBtn.textContent = 'Create';

    const dismiss = (value) => { overlay.remove(); resolve(value); };

    cancelBtn.addEventListener('click', () => dismiss(null));
    confirmBtn.addEventListener('click', () => dismiss(input.value));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') dismiss(input.value);
      if (e.key === 'Escape') dismiss(null);
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) dismiss(null); });

    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);
    modal.appendChild(actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    input.focus();
  });
}

function showConfirm(title, message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal';

    const titleEl = document.createElement('div');
    titleEl.className = 'modal-title';
    titleEl.textContent = title;
    modal.appendChild(titleEl);

    const msgEl = document.createElement('div');
    msgEl.className = 'modal-message';
    msgEl.textContent = message;
    modal.appendChild(msgEl);

    const actions = document.createElement('div');
    actions.className = 'modal-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'modal-btn';
    cancelBtn.textContent = 'Cancel';

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'modal-btn danger';
    confirmBtn.textContent = 'Delete';

    const dismiss = (value) => { overlay.remove(); resolve(value); };

    cancelBtn.addEventListener('click', () => dismiss(false));
    confirmBtn.addEventListener('click', () => dismiss(true));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) dismiss(false); });

    const onKey = (e) => {
      if (e.key === 'Escape') { dismiss(false); document.removeEventListener('keydown', onKey); }
    };
    document.addEventListener('keydown', onKey);

    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);
    modal.appendChild(actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    confirmBtn.focus();
  });
}
const FOCUS_BG_IMAGES = [
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1510784722466-f2aa240c730f?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1518623489648-a173ef7824f3?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1431794062232-2a99a5431c6c?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1504198266287-1659872e6590?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1455156218388-5e61b526818b?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1443916568596-df5a58c445e9?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1442458017215-285b83f65851?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1920&q=80',
];

function isMobile() { return window.innerWidth <= 600; }

function loadFocusBackground(overlay) {
  const seed = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const startIndex = Number(seed) % FOCUS_BG_IMAGES.length;
  const total = FOCUS_BG_IMAGES.length;
  let attempts = 0;

  function tryLoad(index) {
    if (attempts >= total) return;
    attempts++;
    const url = FOCUS_BG_IMAGES[index % total];
    const img = new Image();
    img.onload = () => { overlay.style.backgroundImage = `url(${url})`; };
    img.onerror = () => { tryLoad(index + 1); };
    img.src = url;
  }

  tryLoad(startIndex);
}

function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = '';

  // On mobile, collapsed state is irrelevant — sidebar is a bottom drawer
  const collapsed = !isMobile() && sidebarCollapsed;
  sidebar.classList.toggle('collapsed', collapsed);

  // Toggle button — desktop only
  if (!isMobile()) {
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'sidebar-toggle';
    toggleBtn.title = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
    toggleBtn.textContent = collapsed ? '»' : '«';
    toggleBtn.addEventListener('click', () => { sidebarCollapsed = !sidebarCollapsed; render(); });
    sidebar.appendChild(toggleBtn);
    if (collapsed) return;
  }

  // App title
  const title = document.createElement('div');
  title.style.cssText = 'font-size:11px;letter-spacing:3px;color:var(--accent);margin-bottom:16px;';
  title.textContent = '// AWESOME-TODO';
  sidebar.appendChild(title);

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
    delBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const confirmed = await showConfirm('// DELETE LIST', `Delete "${cat}"? Its tasks will move to Uncategorized.`);
      if (confirmed) { deleteCategory(cat); render(); }
    });
    item.appendChild(delBtn);

    item.addEventListener('click', () => { setActiveCategory(cat); render(); });
    sidebar.appendChild(item);
  }

  // Add category button
  const addCatBtn = document.createElement('button');
  addCatBtn.className = 'sidebar-action';
  addCatBtn.textContent = '+ New list';
  addCatBtn.addEventListener('click', async () => {
    const name = await showPrompt('// NEW LIST', 'List name...');
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

  const focusBtn = document.createElement('button');
  focusBtn.className = 'sidebar-action';
  focusBtn.textContent = '⊙ Focus';
  focusBtn.addEventListener('click', () => { enterFocus(); render(); });
  sidebar.appendChild(focusBtn);

  // Export button
  const exportBtn = document.createElement('button');
  exportBtn.className = 'sidebar-action';
  exportBtn.textContent = '↓ Export all';
  exportBtn.style.marginTop = 'auto';
  exportBtn.addEventListener('click', exportAll);
  sidebar.appendChild(exportBtn);

  // Import button
  const importBtn = document.createElement('button');
  importBtn.className = 'sidebar-action';
  importBtn.textContent = '↑ Import';
  importBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (!Array.isArray(data.todos) || !Array.isArray(data.categories)) {
            alert('Invalid backup file.');
            return;
          }
          importData(data);
          render();
        } catch {
          alert('Failed to parse file — make sure it\'s a valid JSON backup.');
        }
      };
      reader.readAsText(file);
    });
    input.click();
  });
  sidebar.appendChild(importBtn);
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
  const addSection = document.createElement('div');
  addSection.className = 'add-section';

  const addHeader = document.createElement('div');
  addHeader.className = 'add-section-header';

  const addLabel = document.createElement('div');
  addLabel.className = 'add-label';
  addLabel.textContent = '// new task';
  addHeader.appendChild(addLabel);

  const addToggleBtn = document.createElement('button');
  addToggleBtn.className = 'add-section-toggle';
  addToggleBtn.title = addSectionCollapsed ? 'Expand' : 'Collapse';
  addToggleBtn.textContent = addSectionCollapsed ? '+' : '×';
  addToggleBtn.addEventListener('click', () => {
    addSectionCollapsed = !addSectionCollapsed;
    render();
  });
  addHeader.appendChild(addToggleBtn);

  addSection.appendChild(addHeader);

  const addBar = document.createElement('div');
  addBar.className = 'add-bar';
  if (addSectionCollapsed) addBar.style.display = 'none';

  const textInput = document.createElement('input');
  textInput.type = 'text';
  textInput.placeholder = '▶ New task...';

  const catSelect = createCustomSelect(
    state.categories,
    state.activeCategory !== 'All' && state.activeCategory !== 'today' ? state.activeCategory : undefined
  );

  const dateInput = document.createElement('input');
  dateInput.className = 'date-input';
  dateInput.type = 'text';
  dateInput.placeholder = 'Due date';
  dateInput.addEventListener('focus', () => { dateInput.type = 'date'; });
  dateInput.addEventListener('blur', () => { if (!dateInput.value) dateInput.type = 'text'; });

  const addBtn = document.createElement('button');
  addBtn.className = 'add-task-btn';
  addBtn.textContent = '+ Add';
  addBtn.title = 'Add task';

  const submitTask = () => {
    const text = textInput.value.trim();
    if (!text) return;
    const category = catSelect.getValue();
    addTodo(text, category, dateInput.value);
    textInput.value = '';
    dateInput.value = '';
    // Ensure the new task is visible: switch out of 'today' view or a different category,
    // and reset 'completed' filter since the new task is always active.
    if (state.activeCategory !== 'All' && state.activeCategory !== category) {
      state.activeCategory = category;
    }
    if (state.activeFilter === 'completed') {
      state.activeFilter = 'all';
    }
    render();
  };

  addBar.appendChild(textInput);
  addBar.appendChild(catSelect);
  addBar.appendChild(dateInput);
  addBar.appendChild(addBtn);
  addSection.appendChild(addBar);
  main.appendChild(addSection);

  textInput.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    submitTask();
  });

  addBtn.addEventListener('click', submitTask);

  // Filter todos
  let visible = state.todos;
  if (state.activeCategory === 'today') {
    visible = visible.filter(t => t.todayDate);
  } else if (state.activeCategory !== 'All') {
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
    empty.textContent = state.activeCategory === 'today'
      ? '// nothing planned for today'
      : '// no tasks found';
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

    const todayBtn = document.createElement('button');
    todayBtn.className = 'todo-btn today-toggle' + (todo.todayDate ? ' active' : '');
    todayBtn.textContent = '☀';
    todayBtn.title = todo.todayDate ? 'Remove from Today' : 'Add to Today';
    todayBtn.addEventListener('click', () => {
      if (todo.todayDate) removeFromToday(todo.id); else addToToday(todo.id);
      render();
    });
    actions.appendChild(todayBtn);

    const editBtn = document.createElement('button');
    editBtn.className = 'todo-btn';
    editBtn.textContent = '✎';
    editBtn.title = 'Edit';
    editBtn.addEventListener('click', () => {
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
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') save();
        if (e.key === 'Escape') { input.value = todo.text; render(); }
      });
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

export function render() {
  renderFocus();
  if (state.focusMode) return;
  renderSidebar();
  renderMain();
  renderMobileBar();
}

function renderMobileBar() {
  let bar = document.getElementById('mobile-bar');

  if (!isMobile()) {
    if (bar) bar.style.display = 'none';
    const existingMask = document.getElementById('sidebar-mask');
    if (existingMask) existingMask.remove();
    return;
  }

  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'mobile-bar';
    document.getElementById('app').prepend(bar);
  }
  bar.style.display = 'flex';
  bar.innerHTML = '';

  const sidebar = document.getElementById('sidebar');
  const isOpen = sidebar.classList.contains('open');

  // Tap-outside mask
  let mask = document.getElementById('sidebar-mask');
  if (!mask) {
    mask = document.createElement('div');
    mask.id = 'sidebar-mask';
    document.body.appendChild(mask);
  }
  if (isOpen) {
    mask.classList.add('visible');
    mask.onclick = () => { sidebar.classList.remove('open'); render(); };
  } else {
    mask.classList.remove('visible');
    mask.onclick = null;
  }

  const title = document.createElement('span');
  title.className = 'app-title';
  title.textContent = '// AWESOME-TODO';
  bar.appendChild(title);

  const todayCount = state.todos.filter(t => t.todayDate).length;
  const todayMobileBtn = document.createElement('button');
  todayMobileBtn.className = 'mobile-today-btn' + (state.activeCategory === 'today' ? ' active' : '');
  todayMobileBtn.textContent = todayCount > 0 ? `☀ ${todayCount}` : '☀';
  todayMobileBtn.addEventListener('click', () => { setActiveCategory('today'); render(); });
  bar.appendChild(todayMobileBtn);

  const focusMobileBtn = document.createElement('button');
  focusMobileBtn.className = 'mobile-today-btn';
  focusMobileBtn.textContent = '⊙';
  focusMobileBtn.title = 'Focus mode';
  focusMobileBtn.addEventListener('click', () => { enterFocus(); render(); });
  bar.appendChild(focusMobileBtn);

  const menuBtn = document.createElement('button');
  menuBtn.id = 'mobile-menu-btn';
  menuBtn.textContent = isOpen ? '✕ close' : '☰ menu';
  if (isOpen) menuBtn.classList.add('active');
  menuBtn.addEventListener('click', () => { sidebar.classList.toggle('open'); render(); });
  bar.appendChild(menuBtn);
}

function renderFocus() {
  const existing = document.getElementById('focus-overlay');
  if (existing) existing.remove();

  if (!state.focusMode) {
    document.body.style.overflow = '';
    if (focusClockInterval) { clearInterval(focusClockInterval); focusClockInterval = null; }
    return;
  }

  document.body.style.overflow = 'hidden';

  const overlay = document.createElement('div');
  overlay.id = 'focus-overlay';

  if (state.focusBg) {
    loadFocusBackground(overlay);
  }

  const card = document.createElement('div');
  card.className = 'focus-card';

  const title = document.createElement('div');
  title.className = 'focus-title';
  title.textContent = '// FOCUS';
  card.appendChild(title);

  const todayTodos = state.todos.filter((todo) => todo.todayDate);
  const completedCount = todayTodos.filter((todo) => todo.completed).length;

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

  // Digital clock
  const clock = document.createElement('div');
  clock.className = 'focus-clock';

  const timeEl = document.createElement('div');
  timeEl.className = 'focus-clock-time';
  clock.appendChild(timeEl);

  const dateEl = document.createElement('div');
  dateEl.className = 'focus-clock-date';
  clock.appendChild(dateEl);

  function updateClock() {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    dateEl.textContent = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  }
  updateClock();
  if (focusClockInterval) clearInterval(focusClockInterval);
  focusClockInterval = setInterval(updateClock, 1000);

  overlay.appendChild(clock);

  const exitBtn = document.createElement('button');
  exitBtn.className = 'focus-exit-btn';
  exitBtn.innerHTML = '✕ <span class="focus-btn-text">ESC to exit</span>';
  exitBtn.addEventListener('click', () => { exitFocus(); render(); });
  overlay.appendChild(exitBtn);

  const bgBtn = document.createElement('button');
  bgBtn.className = 'focus-bg-btn';
  bgBtn.title = state.focusBg ? 'Hide background' : 'Show background';
  bgBtn.textContent = '◑';
  bgBtn.addEventListener('click', () => { toggleFocusBg(); render(); });
  overlay.appendChild(bgBtn);

  const fsBtn = document.createElement('button');
  fsBtn.className = 'focus-fullscreen-btn';
  fsBtn.title = document.fullscreenElement ? 'Exit full screen' : 'Enter full screen';
  fsBtn.textContent = '⛶';
  fsBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });
  overlay.appendChild(fsBtn);

  document.body.appendChild(overlay);
}

initState();
reconcileToday();

if (!state.storageAvailable) {
  console.warn('awesome-todo: localStorage unavailable, running in-memory only');
}

// Hook up state change listener
state._onchange = render;

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state.focusMode) {
    exitFocus();
    render();
  }
});

render();
