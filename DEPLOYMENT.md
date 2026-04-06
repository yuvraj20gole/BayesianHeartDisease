# Deployment (GitHub Pages + API host)

Same pattern as a typical split deployment: **static React** on [GitHub Pages](https://pages.github.com/), **FastAPI** on a Python host (e.g. [Render](https://render.com)).

## 1. Deploy the API (Render example)

1. Create a [Render](https://render.com) account and connect GitHub.
2. **New** → **Web Service** → select this repository.
3. Settings:
   - **Root directory:** `api`
   - **Environment:** Python 3
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

   Render sets `PORT`; the app listens on `0.0.0.0`.

   **Python version:** New Render services default to **3.14**, which forces a slow (or failing) **NumPy source build** with our pinned stack. This repo includes `api/.python-version` (`3.11.9`). If Render ignores it, add **Environment** → `PYTHON_VERSION` = `3.11.9`.

4. The repo root includes `model/heart_disease_model.bif`. With **root directory `api`**, `main.py` resolves the repo root as the parent of `api/`, so the model path stays valid.

5. **Environment variables** (Render dashboard):
   - Optional: `CORS_ORIGINS` — comma-separated extra origins if you use a custom domain, e.g. `https://www.example.com`
   - The API already allows `https://yuvraj20gole.github.io` for GitHub Pages.

6. After deploy, note the public URL, e.g. `https://bayesian-heart-api.onrender.com` (your name will differ).

## 2. GitHub Actions secret for the frontend build

1. Repo → **Settings** → **Secrets and variables** → **Actions**.
2. **New repository secret**:
   - Name: `VITE_API_BASE_URL`
   - Value: your API **origin only**, **no** trailing slash, e.g. `https://bayesian-heart-api.onrender.com`

   The frontend will call `https://…/api/schema` and `https://…/api/predict`.

3. Push to `main` (or run the workflow manually). The workflow in `.github/workflows/pages.yml` builds with `VITE_BASE_PATH=/BayesianHeartDisease/` so assets load under the project Pages URL.

## 3. Enable GitHub Pages

1. Repo → **Settings** → **Pages**.
2. **Build and deployment** → Source: **GitHub Actions**.

After a successful run, the site is at:

`https://yuvraj20gole.github.io/BayesianHeartDisease/`

(Replace user/repo if you fork or rename.)

## 4. Custom domain (optional)

Add a `CNAME` file at the repo root (or configure in Pages settings) and set DNS per [GitHub docs](https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site). Add that origin to `CORS_ORIGINS` on Render and/or extend `CORS_ORIGINS` / defaults in `api/main.py`.

## Local check (production build)

```bash
cd frontend
VITE_API_BASE_URL=https://YOUR-API.onrender.com VITE_BASE_PATH=/BayesianHeartDisease/ npm run build
npx vite preview
```

Open the preview URL and confirm API calls hit your Render host.
