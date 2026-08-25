# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Vanilla-JS Tetris on HTML5 Canvas. Three source files, no dependencies, no `package.json`, no build step, no tests, no linter. README, UI text, and code comments are in Spanish — keep new user-facing strings and comments in Spanish.

## Running

```bash
open index.html            # macOS; just open the file, it works from file://
python3 -m http.server 8000   # or serve statically and visit localhost:8000
```

There is nothing to build, install, or test. Verification is manual: open the page and play.

## Architecture

`game.js` is a single top-level script (no modules, no IIFE) loaded via `<script src>` at the end of `<body>`, so all DOM lookups at the top of the file run after the elements exist. All state lives in one `let` declaration on line 43 (`board, current, next, score, ...`) — module-scope globals, mutated in place.

- **Board**: `ROWS × COLS` array of ints; `0` = empty, `1–7` = piece type, which indexes both `COLORS` and `PIECES`. That shared index is why a piece's cells store its own type number in `PIECES` (e.g. the T piece is made of `3`s) — merging a piece into the board is a straight copy with no color lookup.
- **Rotation**: `rotateCW` transposes+reverses into a new matrix; `tryRotate` applies it only if one of the kick offsets `[0,-1,1,-2,2]` clears `collide`. This is an ad-hoc wall-kick table, not SRS.
- **Collision**: `collide(shape, ox, oy)` is the single gate for every move, rotation, drop, ghost projection, and the game-over test in `spawn()`. It intentionally allows `ny < 0` (piece partly above the board) so spawning near the ceiling works.
- **Loop**: `loop(ts)` accumulates `dt` into `dropAccum` and drops one row when it exceeds `dropInterval`, then redraws every frame. Pause/game-over work by `cancelAnimationFrame(animId)`, and resume re-seeds `lastTime = performance.now()` before restarting the loop — skip that and the first frame after a pause registers a huge `dt`.
- **Level/speed**: derived in `clearLines()` only — `level = floor(lines/10)+1`, `dropInterval = max(100, 1000 - (level-1)*90)`.
- **Rendering**: everything is redrawn from scratch each frame; `drawBlock` is shared by the board canvas and the `next` preview canvas, parameterized by cell size and alpha (ghost piece uses `0.2`).
- **Reset**: `init()` is both the entry point and the restart handler — it reinitializes every global and is wired to `#restart-btn`.

## Gotchas

- `COLS`, `ROWS`, and `BLOCK` in `game.js` must stay in sync with the `width`/`height` attributes of `<canvas id="board">` in `index.html` (`COLS*BLOCK` × `ROWS*BLOCK`, currently 300×600). Nothing computes or validates this.
- `drawNext` hardcodes a 4×4 centering grid and `NB = 30` against the 120×120 `#next-canvas`; changing one requires changing the others.
- The keydown handler calls `updateHUD()` after every key, but score changes from line clears go through `clearLines()`'s own `updateHUD()` — the loop itself never refreshes the HUD.
