// storage.js — read/write localStorage
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
