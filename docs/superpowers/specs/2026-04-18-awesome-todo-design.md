# awesome-todo — Design Spec

**Date:** 2026-04-18

## Overview

A personal, browser-based todo app. No backend, no build step, no dependencies. Opens as a single `index.html` file. Data persists in `localStorage` and can be exported as a JSON backup.

## Stack

- Vanilla JS (ES modules)
- Plain CSS
- No frameworks, no build tooling

## File Structure

```
awesome-todo/
  index.html
  style.css
  js/
    storage.js   — read/write localStorage
    state.js     — in-memory app state + operations
    app.js       — DOM rendering and event handling
```

## Layout

Sidebar layout:

- **Left sidebar** (fixed width)
  - Category list — click to filter by category
  - "Add category" button
  - Active / Completed filter toggle
  - "Export all" button
- **Main area** (right)
  - Input bar at top — type + Enter to add a todo
  - Todo list — each item has: checkbox, text, category badge, due date, edit button, delete button
  - Empty state message when no todos match current filter

## Visual Style

Cyberpunk Purple:
- Background: `#0d0d1a` (deep navy)
- Accent: `#a78bfa` (violet/purple)
- Text: `#e0e0ff`
- Font: monospace (`'Courier New'`, fallback to system monospace)
- Borders: subtle `#7b5ea733` lines
- Completed todos: dimmed + strikethrough

## Data Model

### Todo

```json
{
  "id": "abc123",
  "text": "Buy groceries",
  "category": "Personal",
  "completed": false,
  "dueDate": "2026-04-20"
}
```

`dueDate` is optional (empty string if not set).

### localStorage Keys

```
awesome-todo:categories     → JSON array of category name strings
awesome-todo:todos:Work     → JSON array of todo objects for "Work"
awesome-todo:todos:Personal → JSON array of todo objects for "Personal"
awesome-todo:meta           → { "activeCategory": "All", "activeFilter": "all" }
```

One key per category keeps backups granular — copy a single key to back up one list.

## State

In-memory state object (synced to localStorage on every mutation):

```js
{
  categories: ["Work", "Personal"],
  todos: [...],           // all todos, all categories
  activeCategory: "All", // "All" or a category name
  activeFilter: "all"    // "all" | "active" | "completed"
}
```

## Operations

| Operation | Behavior |
|---|---|
| `addTodo(text, category, dueDate)` | Generate random id, append to todos |
| `toggleTodo(id)` | Flip `completed` |
| `editTodo(id, text)` | Update text in place |
| `deleteTodo(id)` | Remove from array |
| `addCategory(name)` | Append to categories (ignore if duplicate) |
| `deleteCategory(name)` | Remove category; reassign its todos to "Uncategorized" (auto-created if needed) |

Every operation calls `saveToStorage()` then `render()`.

`saveToStorage()` groups todos by category and writes one key per category. `loadFromStorage()` reads all `awesome-todo:todos:*` keys and merges them into the flat `todos` array.

## Inline Editing

Clicking the edit button on a todo replaces the text `<span>` with an `<input>`. Pressing Enter or blurring the input saves the new text and restores the span.

## Export

"Export all" button serializes the full state (all categories + todos) into a single JSON file and triggers a browser download using `URL.createObjectURL` + a hidden `<a>` tag. No server required.

```json
{
  "exportedAt": "2026-04-18T10:00:00Z",
  "categories": ["Work", "Personal"],
  "todos": [...]
}
```

## Edge Cases

| Scenario | Behavior |
|---|---|
| Empty todo text | Ignore — do not add |
| Duplicate category name | Ignore |
| `localStorage` unavailable | Show one-time warning banner; fall back to in-memory only |
| Delete category with todos | Move todos to "Uncategorized" (auto-created) |

## Out of Scope

- Import from JSON file
- Multi-device sync
- User accounts / auth
- Drag-and-drop reordering
