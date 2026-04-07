# Local demo (not pushed to GitHub)

These changes are meant for **your machine / VIVA** only until you choose to commit and push.

## Run quickly

**Terminal 1 — API**

```bash
cd BayesianHeartDisease
source .venv/bin/activate   # or your venv
cd api
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

**Terminal 2 — UI** (use 5174 if 5173 is busy)

```bash
cd BayesianHeartDisease/frontend
VITE_DEV_PORT=5174 npm run dev
```

Open **http://localhost:5174** (or 5173).

**Routes:** **`/`** dashboard · **`/assess`** assessment form · **`/history`** saved runs (browser localStorage).

## What to show

- **Form** with **?** tooltips on labels (hover for field meaning).
- **About this model** — expand for disclaimer + pointer to `MODEL_CARD.md`.
- **Dashboard** — stats + spark bars from history; **History** page with expand/delete/clear.
- **Copy share link** — restores scenario on **`/assess?...`** (works with GitHub Pages `base` path).
- **After predict** — **insight** text, **donut + bar** visualization, CSV download.
- **API**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs), **GET /api/version**, responses include **X-Request-ID** header.

## Makefile (optional)

```bash
make api        # terminal 1
make frontend   # terminal 2
```
