# UI Polish Pass — Design Spec
Date: 2026-04-23

## Overview
Five targeted UI improvements covering usability, mobile ergonomics, locale, and typography.

---

## 1. New Task Toggle — Replace Arrow with `+` / `×` Icon

**Problem:** The `▾`/`▴` toggle button is small and visually disconnected from the "New task" label.

**Solution:**
- Render the toggle button inline with the "New task" heading as a single row: `[+] New task`
- Icon is `+` when collapsed, `×` when expanded
- Button sits to the left of the label text
- Minimum touch target: `44×44px` padding area
- Style: same color as the heading, no border, cursor pointer

**Files affected:**
- `js/app.js` — lines ~387–459 (`renderAddSection`)
- `style.css` — `.add-section-toggle`

---

## 2. Focus Page BG Toggle — Larger Touch Target on Mobile

**Problem:** The `◑` button is too small to tap reliably on mobile.

**Solution:**
- Keep `◑` symbol
- Set `min-width: 44px; min-height: 44px` on `.focus-bg-btn`
- On mobile (`≤600px`): increase to `48×48px`, add a semi-transparent background pill (`border-radius: 50%`, subtle `rgba` background) so the button is visually distinct

**Files affected:**
- `style.css` — `.focus-bg-btn` and `@media (max-width: 600px)` block

---

## 3. Mobile Drawer — Tap-Outside Mask to Close

**Problem:** The sidebar drawer can only be closed via the `✕ close` button.

**Solution:**
- When sidebar has `.open` class on mobile, render a full-screen semi-transparent mask div (`id="sidebar-mask"`) positioned behind the sidebar (`z-index` below sidebar, above content)
- Tapping the mask removes `.open` from sidebar and calls `render()`
- Mask is only rendered when `isMobile() && sidebar.classList.contains('open')`
- Existing tap-item-to-close behavior is preserved (sidebar items already trigger re-render which closes drawer)

**Files affected:**
- `js/app.js` — `renderMobileBar()` or top-level render, add mask element
- `style.css` — `#sidebar-mask` styles

---

## 4. Focus Page Date — Switch to English Locale

**Problem:** Date and time use `'zh-CN'` locale, displaying Chinese characters.

**Solution:**
- Change `toLocaleTimeString('zh-CN', ...)` → `toLocaleTimeString('en-US', ...)`
- Change `toLocaleDateString('zh-CN', ...)` → `toLocaleDateString('en-US', ...)`
- Result format: `"Wednesday, April 23, 2026"`

**Files affected:**
- `js/app.js` — `updateClock()` function, lines ~709–710

---

## 5. Task List — Chinese Font

**Problem:** Body uses `'Courier New'` monospace with no CJK support; Chinese characters fall back to system default.

**Solution:**
- Load **Noto Serif SC** via Google Fonts (already partially referenced in style.css as a fallback)
- Add to `<link>` in `index.html`: `family=Noto+Serif+SC:wght@400;700`
- Apply to task list text: `.todo-item`, `.todo-text` (and any other task content elements)
- Font stack: `'Noto Serif SC', 'Songti SC', serif`
- Do NOT change the body/UI chrome font — keep monospace for buttons, inputs, sidebar labels

**Files affected:**
- `index.html` — Google Fonts `<link>`
- `style.css` — `.todo-item`, `.todo-text` font-family

---

## Out of Scope
- No changes to drawer animation or transition timing
- No changes to sidebar item behavior (tap-to-close is already correct)
- No locale switching UI (English is hardcoded, same as Chinese was)
