// state.js — in-memory state + operations
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
  const id = crypto.randomUUID();
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
  if (typeof state._onchange === 'function') state._onchange();
}

export function setActiveFilter(filter) {
  state.activeFilter = filter;
  persist();
  if (typeof state._onchange === 'function') state._onchange();
}
