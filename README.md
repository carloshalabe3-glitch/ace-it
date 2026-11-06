# Ace It

A private grade calculator and grade log for a university degree, installable on iPhone from Safari (Share → Add to Home Screen).

- Vanilla HTML/CSS/JS, no build step. Data stays on the device (localStorage), with backup and restore files.
- `grades.js`: all grade math, pure functions, no DOM.
- `store.js`: the only module that touches storage (schema versions + migrations).
- `app.js`: screens. `sw.js`: offline cache (bump `CACHE_NAME` on every deploy).
- Tests: `npm test` (or `node tests/run.js`).
- Local preview: `python3 serve.py 8080`.

The app ships empty. No personal grades are stored in this repository.
