# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Vanilla-JS Tetris on HTML5 Canvas. Six source files (`index.html`, `style.css`, and four scripts: `skins.js`, `pause.js`, `records.js`, `game.js`), no dependencies, no `package.json`, no build step, no tests, no linter. README, UI text, and code comments are in Spanish — keep new user-facing strings and comments in Spanish.

## Running

```bash
open index.html            # macOS; just open the file, it works from file://
python3 -m http.server 8000   # or serve statically and visit localhost:8000
```

There is nothing to build, install, or test. Verification is manual: open the page and play.

## Architecture

Four classic scripts (no modules, no IIFE) are loaded via `<script src>` at the end of `<body>`, so all DOM lookups at the top of each file run after the elements exist. **Load order matters**: `skins.js`, `pause.js` and `records.js` come first and only *define* things; `game.js` comes last and is the one that wires everything up. Top-level `let`/`const` in classic scripts share one global lexical environment, so the helper scripts read and write `game.js`'s state directly (and `game.js` reads their `currentSkin`, `nivelInicial`, etc.) with no exports.

Core game state lives in one `let` declaration near the top of `game.js` (`board, current, next, score, lines, level, combo, maxCombo, ...`) — module-scope globals, mutated in place. Each helper script owns its own state: `skins.js` owns `currentSkin`, `pause.js` owns `nivelInicial`, `records.js` owns the stored leaderboard.

- **Board**: `ROWS × COLS` array of ints; `0` = empty, `1–7` = piece type, which indexes both `PIECES` and the active skin's `colors` array in `skins.js`. That shared index is why a piece's cells store its own type number in `PIECES` (e.g. the T piece is made of `3`s) — merging a piece into the board is a straight copy with no color lookup.
- **Rotation**: `rotateCW` transposes+reverses into a new matrix; `tryRotate` applies it only if one of the kick offsets `[0,-1,1,-2,2]` clears `collide`. This is an ad-hoc wall-kick table, not SRS.
- **Collision**: `collide(shape, ox, oy)` is the single gate for every move, rotation, drop, ghost projection, and the game-over test in `spawn()`. It intentionally allows `ny < 0` (piece partly above the board) so spawning near the ceiling works.
- **Loop**: `loop(ts)` accumulates `dt` into `dropAccum` and drops one row when it exceeds `dropInterval`, then redraws every frame. Pause/game-over work by `cancelAnimationFrame(animId)`, and resume re-seeds `lastTime = performance.now()` before restarting the loop — skip that and the first frame after a pause registers a huge `dt`.
- **Level/speed**: derived in `clearLines()` only — `level = floor(lines/10) + nivelBase`, `dropInterval = max(100, 1000 - (level-1)*90)`. `nivelBase` is snapshotted from `pause.js`'s `nivelInicial` in `init()`, so changing the initial level mid-game only affects the *next* game. Deriving from `nivelBase` rather than `1` is what keeps a game started at level 8 from dropping back to level 1 on the first line clear.
- **Rendering**: everything is redrawn from scratch each frame; `drawBlock` in `game.js` is a thin wrapper that delegates to the active skin's own `drawBlock`, shared by the board canvas and the `next` preview canvas and parameterized by cell size and alpha (ghost piece uses `0.2`).
- **Skins vs. light/dark**: two orthogonal axes. `refrescarVisual()` in `skins.js` is the single refresh point — both `aplicarSkin()` and `applyTheme()` funnel through it, and it recomputes `gridColor`/`blockHighlight`/`boardBg`/`nextBg` from the active skin's light or dark variant. It redraws explicitly (guarded on `current`/`next` existing), because when the game is paused or over the rAF loop is cancelled and nothing would repaint on its own.
- **Overlays**: three independent ones, each owned by a different script — `#start-screen` and `#overlay` (game over) by `records.js`, `#pause-menu` by `pause.js`. They are deliberately not shared.
- **Reset**: `init()` reinitializes every global game-state variable and (re)starts the loop, but it is no longer called automatically on page load. `records.js`'s start screen (`#start-screen`) is shown first; `init()` only runs when the player clicks `#start-play-btn` (JUGAR) or `#restart-btn` (Reiniciar) after a game over. Until the first `init()` call, `current`/`board`/`paused`/`gameOver` are all `undefined` — the `keydown` handler and `togglePause()` guard against this with an explicit `if (!current) return;`.

## Gotchas

- `COLS`, `ROWS`, and `BLOCK` in `game.js` must stay in sync with the `width`/`height` attributes of `<canvas id="board">` in `index.html` (`COLS*BLOCK` × `ROWS*BLOCK`, currently 300×600). Nothing computes or validates this.
- `drawNext` hardcodes a 4×4 centering grid and `NB = 30` against the 120×120 `#next-canvas`; changing one requires changing the others.
- The keydown handler calls `updateHUD()` after every key, but score changes from line clears go through `clearLines()`'s own `updateHUD()` — the loop itself never refreshes the HUD.
- The order of the guards at the top of the `keydown` handler is load-bearing: the `#player-name` field first (so typing a record name never moves a piece), then `if (!current) return;` (nothing has been initialized before JUGAR), and only then `P`/`Esc` and the pause-menu input blocking. Note the guard is scoped to `#player-name`, **not** to any `INPUT` — widening it swallows keys while the light/dark checkbox has focus and breaks the controls mid-game.
- `localStorage` keys are namespaced: `tetris.skin`, `tetris.startLevel`, `tetris.records` (plus the older `theme`). Every read is wrapped in `try/catch` so private mode never breaks the game.
- No `alert()`/`confirm()`/`prompt()`: native dialogs block browser automation. The "Resetear records" button uses an inline two-click confirmation instead.
