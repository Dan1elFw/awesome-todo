// app.js — rendering + event handling
import {
  state, initState,
  addTodo, toggleTodo, editTodo, deleteTodo,
  addCategory, deleteCategory,
  setActiveCategory, setActiveFilter,
  importData,
} from './state.js';

function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = '';

  // App title
  const title = document.createElement('div');
  title.style.cssText = 'font-size:11px;letter-spacing:3px;color:var(--accent);margin-bottom:16px;';
  title.textContent = '// AWESOME-TODO';
  sidebar.appendChild(title);

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

  const addLabel = document.createElement('div');
  addLabel.className = 'add-label';
  addLabel.textContent = '// new task';
  addSection.appendChild(addLabel);

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
  addSection.appendChild(addBar);
  main.appendChild(addSection);

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
  renderSidebar();
  renderMain();
}

initState();

if (!state.storageAvailable) {
  console.warn('awesome-todo: localStorage unavailable, running in-memory only');
}

// Hook up state change listener
state._onchange = render;

render();
