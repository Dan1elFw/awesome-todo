# awesome-todo

A personal, browser-based todo app with a cyberpunk purple aesthetic. No backend, no build step, no dependencies — just open `index.html` and start managing your tasks.

## Features

- **Multiple lists** — organize todos into named categories
- **Today view** — pin tasks to today's focus list; incomplete tasks roll forward automatically
- **Focus mode** — distraction-free view with a rotating scenic background
- **Due dates** — optionally set a due date on any task
- **Filters** — view all, active, or completed tasks
- **Inline editing** — click the edit button to rename a task in place
- **Export / Import** — download your data as a JSON backup and restore it any time
- **Persistent storage** — data lives in `localStorage`; no account required

## Usage

1. Clone or download this repository.
2. Open `index.html` in any modern browser — no server required.

```sh
git clone https://github.com/Dan1elFw/awesome-todo.git
cd awesome-todo
open index.html   # macOS
# or just double-click index.html in your file manager
```

## How it works

| Action | How |
|---|---|
| Add a task | Type in the input bar and press **Enter** |
| Complete a task | Click the checkbox |
| Edit a task | Click the **✎** button, type, then press **Enter** or click away |
| Delete a task | Click the **✕** button next to the task |
| Add a list | Click **+ New list** in the sidebar |
| Delete a list | Click **✕** next to the list name (todos move to *Uncategorized*) |
| Add to Today | Click the **☀** icon on a task |
| Focus mode | Click **⊙ Focus** in the sidebar |
| Export data | Click **↓ Export all** to download a JSON backup |
| Import data | Click **↑ Import** to restore from a JSON backup |

## File structure

```
awesome-todo/
  index.html      — entry point
  style.css       — cyberpunk purple theme
  js/
    storage.js    — localStorage read/write
    state.js      — in-memory state & operations
    app.js        — DOM rendering & event handling
```

## Tech stack

- Vanilla JavaScript (ES modules)
- Plain CSS
- No frameworks, no build tooling, no dependencies

## Data & privacy

All data is stored locally in your browser's `localStorage`. Nothing is sent to any server. Use **Export all** to back up your data and **Import** to restore it.

## License

MIT
