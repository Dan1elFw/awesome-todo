# Today Feature — Design Spec

**Date:** 2026-04-20

## Overview

A "Today" view that lets users mark any existing todo as something they intend to complete today. Today is a virtual view (not a category) — tasks remain in their original category and are simply tagged with a `todayDate` field.

## Data Model

Add one optional field to the todo object:

```js
{
  id: "...",
  text: "Buy groceries",
  category: "Personal",
  completed: false,
  dueDate: "",
  todayDate: "2026-04-20"  // empty string = not in Today
}
```

`todayDate` stores the ISO date string (`YYYY-MM-DD`) of the day the task was added to Today. Empty string means the task is not in Today.

## Startup Reconciliation

`reconcileToday()` runs once on app init, after `initState()`, before first `render()`.

For every todo where `todayDate` is not empty:

| Condition | Action |
|---|---|
| `todayDate < today` AND `completed === true` | Clear `todayDate` (done, remove from Today) |
| `todayDate < today` AND `completed === false` | Set `todayDate = today` (carry forward) |
| `todayDate === today` | No change |

After reconciliation, call `persist()` if any changes were made.

## State Operations

New operations in `state.js`:

```js
addToToday(id)      // set todo.todayDate = today's date
removeFromToday(id) // set todo.todayDate = ''
reconcileToday()    // run on startup (see above)
```

Today count helper (used by UI):

```js
function todayCount() {
  return state.todos.filter(t => t.todayDate).length;
}
```

## UI — Desktop (Sidebar)

Fixed entry at the top of the sidebar, above the Lists section:

```
☀ Today  (3)
─────────────
LISTS
  All
  Personal
  ...
```

- Clicking "☀ Today" sets `state.activeCategory = 'today'` and re-renders
- Count shows number of todos with non-empty `todayDate`
- Count hidden when 0
- Styled same as other active category items when selected

## UI — Mobile (Top Bar)

Top bar gains a ☀ shortcut button between the title and the menu button:

```
// AWESOME-TODO    [☀ 3]  [☰ menu]
```

- Tapping `☀` sets `state.activeCategory = 'today'`
- Badge shows today count; hidden when 0
- Button highlighted when Today view is active

## UI — Todo Row

Each todo row gets a ☀ action button (alongside existing ✎ and ✕):

- **Not in Today:** ☀ dimmed, click → `addToToday(id)`
- **In Today:** ☀ highlighted (accent color), click → `removeFromToday(id)`

## Today View

Activated when `state.activeCategory === 'today'`.

- Filters `state.todos` to those with non-empty `todayDate`
- Supports existing Active / Completed filter toggle
- Each task shows its original category badge
- Empty state: `// nothing planned for today`
- Add bar category select defaults to first available category (same as "All" view)
- New tasks created in Today view do NOT automatically get `todayDate` set — user must click ☀ explicitly

## Edge Cases

| Scenario | Behavior |
|---|---|
| Delete a todo that's in Today | `deleteTodo()` removes it entirely — no special handling needed |
| Delete a category whose todos are in Today | Todos move to Uncategorized, `todayDate` preserved |
| Import backup with `todayDate` fields | Merged as-is; `reconcileToday()` runs on next app open |
| Import backup without `todayDate` fields | Missing field treated as empty string (not in Today) |

## Files Changed

| File | Change |
|---|---|
| `js/state.js` | Add `todayDate` to default todo shape, add `addToToday`, `removeFromToday`, `reconcileToday` |
| `js/app.js` | Today entry in sidebar, ☀ button in mobile bar, ☀ button in todo row, Today view filter logic |
| `js/storage.js` | No changes — `todayDate` persists automatically with todo objects |
| `style.css` | Style for Today sidebar entry, ☀ button active/inactive states, mobile badge |
