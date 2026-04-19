# Focus Mode — Design Spec

**Date:** 2026-04-20

## Overview

A full-screen Focus mode that overlays the entire app, showing only Today tasks centered on a daily landscape background image. Designed for distraction-free task completion.

## Architecture

Focus mode is a full-screen overlay controlled by a single boolean `state.focusMode`. It does not change the active category or filter — exiting restores the previous view exactly.

```js
// state additions
focusMode: false

// operations
enterFocus()   // state.focusMode = true, persist, render
exitFocus()    // state.focusMode = false, persist, render
```

`render()` checks `state.focusMode`: if true, renders the focus overlay and sets `document.body.style.overflow = 'hidden'` to prevent background scrolling. On exit, restores `overflow`.

## Background Image

Unsplash source API with date-based seed for consistent daily image:

```js
const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const bgUrl = `https://source.unsplash.com/1920x1080/?landscape,nature&sig=${today}`;
```

- Same image all day (seed = `YYYYMMDD`)
- Image loads asynchronously — deep dark background shown as placeholder while loading
- On load failure: silently fall back to dark background, no error shown

## State Operations

New in `state.js`:

```js
export function enterFocus() {
  state.focusMode = true;
  persist();
}

export function exitFocus() {
  state.focusMode = false;
  persist();
}
```

## UI Structure

```
┌─────────────────────────────────────────┐
│  Full-screen background (Unsplash)       │
│  + semi-transparent dark overlay        │
│                                         │
│         // FOCUS                        │
│   ┌─────────────────────────┐           │
│   │  TODAY · 2/3 TASKS      │           │
│   │  ☐ Buy groceries        │           │
│   │  ☐ Finish report        │           │
│   │  ☑ Call dentist         │           │
│   └─────────────────────────┘           │
│                                         │
│                        ✕ ESC to exit →  │
└─────────────────────────────────────────┘
```

### Overlay

- Full-screen fixed `div#focus-overlay` covering entire viewport
- Background: Unsplash image (`background-image`, `background-size: cover`, `background-position: center`)
- Dark scrim: `rgba(13, 13, 26, 0.55)` overlay for readability
- Clicking outside the card does nothing

### Card

- Centered vertically and horizontally
- Frosted glass: `backdrop-filter: blur(12px)`, semi-transparent dark background (`rgba(18,18,42,0.75)`)
- Border: `1px solid var(--border)`
- Border radius: `8px`
- Min width: `320px`, max width: `480px`, padding: `32px`

### Card Header

- Label: `// FOCUS` in accent color, small letter-spacing
- Subtitle: `TODAY · N/M TASKS` (completed count / total count), updates on checkbox toggle

### Task List

- Checkbox + text only — no edit, delete, category badge, or due date
- Completed tasks: `opacity: 0.45` + strikethrough
- Checkbox interaction: calls `toggleTodo(id)` then `render()`
- Empty state (no Today tasks): `// nothing planned for today`

### Exit Button

- Position: fixed bottom-right corner of the overlay (`position: fixed; bottom: 24px; right: 24px`)
- Desktop: `✕ ESC to exit` — icon + text
- Mobile (`max-width: 600px`): `✕` icon only, larger tap target (`44px × 44px`)
- Clicking exit button calls `exitFocus()`
- Pressing `Esc` key calls `exitFocus()`

### Background Toggle Button

- Position: fixed top-left corner of the overlay (`position: fixed; top: 24px; left: 24px`)
- Toggles background image on/off
- Default: background image visible
- When off: falls back to plain dark background (`var(--bg)`)
- State stored in `state.focusBg: true` (persisted), so preference survives page reload
- Desktop: `🌄 Hide bg` / `🌄 Show bg` — icon + text
- Mobile: icon only (`🌄`), larger tap target (`44px × 44px`)

## Entry Points

**Desktop sidebar** — bottom of sidebar, above Export/Import buttons:
```
⊙ Focus
```

**Mobile top bar** — icon between ☀ Today button and ☰ menu:
```
// AWESOME-TODO   [☀ 3]  [⊙]  [☰ menu]
```

Both call `enterFocus()` on click.

## Files Changed

| File | Change |
|---|---|
| `js/state.js` | Add `focusMode: false`, `focusBg: true` to state, add `enterFocus()`, `exitFocus()`, `toggleFocusBg()` |
| `js/app.js` | Add `renderFocus()`, call from `render()`; add ⊙ button to sidebar and mobile bar; add `keydown` listener for Esc |
| `style.css` | Styles for `#focus-overlay`, `.focus-card`, `.focus-exit-btn`, mobile exit button |
| `js/storage.js` | No changes — `focusMode` persists automatically with meta |

## Edge Cases

| Scenario | Behavior |
|---|---|
| No Today tasks | Show `// nothing planned for today`, exit button still visible |
| All Today tasks completed | Card shows all dimmed + strikethrough, exit button still visible |
| Background image fails to load | Silent fallback to `var(--bg)` dark background |
| Resize from mobile to desktop in Focus | Exit button text appears, layout adjusts via CSS media query |
| Page reload while in Focus mode | `focusMode` persists in localStorage via meta key, Focus mode restores on reload |
