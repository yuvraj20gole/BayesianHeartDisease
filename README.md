# Bayesian Heart Disease Risk Assessment

This is an **end-to-end project**, not only a source repository: it covers **data and modelling** (Jupyter notebook), **serialized Bayesian networks** for reuse, **written documentation** (LaTeX report), and a **small web application** (FastAPI backend + React client) for interactive inference. The repository bundles these deliverables so the work can be reproduced, extended, and demonstrated.

## Contents

| Part | Description |
|------|-------------|
| `notebook.ipynb` | Full analysis pipeline (preprocessing, Hill climbing, domain network, inference). |
| `model/` | Trained network as **BIF** and **XML** (used by the API). |
| `api/` | FastAPI service: loads the BIF, exposes `/api/schema` and `/api/predict`. |
| `frontend/` | Vite + React UI for evidence entry and **P(heart disease)**. |
| `latex/` | Report PDF sources. |
| `data/` | Raw and cleaned CSVs. |

## Prerequisites

- **Python 3.11+** (recommended: match `requirements.txt` / `api/requirements.txt` pins).
- **Node.js 18+** and npm (for the frontend).
- Optional: **Graphviz** system package if you need `pygraphviz` / notebook graph layouts (`brew install graphviz` on macOS).

## Quick start — Web app (React + API)

**1. API** (from `api/`):

```bash
cd api
python3.11 -m venv .venv && source .venv/bin/activate   # optional venv
python3.11 -m pip install -r requirements.txt
python3.11 -m uvicorn main:app --host 127.0.0.1 --port 8001
```

**2. Frontend** (new terminal, from `frontend/`):

```bash
cd frontend
npm install
VITE_API_PORT=8001 npm run dev
```

Open **http://localhost:5173**. The dev server proxies `/api` to the API port set by **`VITE_API_PORT`** (here **8001**).

**Busy ports:** use another UI port, e.g. `VITE_API_PORT=8001 VITE_DEV_PORT=5175 npm run dev` (see `npm run dev:5175` in `frontend/package.json`).

**Model path:** override with `MODEL_PATH=/absolute/path/to/heart_disease_model.bif` when starting uvicorn if the file is not at `../model/` relative to `api/main.py`.

## API (summary)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/health` | Liveness and model path. |
| `GET` | `/api/schema` | Target variable and allowed state labels per variable. |
| `POST` | `/api/predict` | JSON body `{"evidence":{"Age":"40-50","Sex":"M",...}}` — omit keys to marginalize. Returns `heart_disease` probabilities and `probability_positive` (state `1`). |

## Notebook (analysis)

```bash
python3.11 -m venv .venv && source .venv/bin/activate
python3.11 -m pip install -r requirements.txt jupyter
python3.11 -m jupyter notebook notebook.ipynb
```

Pinned stacks (NumPy 1.x, pandas 2.x, pgmpy 0.1.x) avoid known breakage with newer major versions; see `requirements.txt`.

## Report (PDF)

From `latex/`, build with your usual tool, e.g.:

```bash
cd latex && latexmk -pdf main.tex
```

## Clone & optional submodule

```bash
git clone https://github.com/yuvraj20gole/BayesianHeartDisease.git
cd BayesianHeartDisease
```

The **Streamlit** reference app is optional. If you use the `HeartDisease-Dashboard` submodule, set the **`url`** in `.gitmodules` to a repo you can access, then:

```bash
git submodule update --init --recursive
```

A public example deployment: [heart-disease-risk.streamlit.app](https://heart-disease-risk.streamlit.app).

## Background

Cardiovascular disease (CVD) remains a major cause of mortality worldwide. Bayesian networks help model interactions among risk factors and support probabilistic prediction. The modelling approach is inspired by [Ordovas et al. (2023)](https://doi.org/10.1016/j.cmpb.2023.107405), using a different dataset and additional analyses described in the notebook and report.

## Data & credits

- **Primary dataset:** [Kaggle — Heart Failure Prediction](https://www.kaggle.com/datasets/fedesoriano/heart-failure-prediction).
- **UCI** heart disease resources: [UCI ML Repository](https://archive.ics.uci.edu/ml/machine-learning-databases/heart-disease/).

## Acknowledgements (data sources)

1. Hungarian Institute of Cardiology, Budapest: Andras Janosi, M.D.  
2. University Hospital, Zurich, Switzerland: William Steinbrunn, M.D.  
3. University Hospital, Basel, Switzerland: Matthias Pfisterer, M.D.  
4. V.A. Medical Center, Long Beach and Cleveland Clinic Foundation: Robert Detrano, M.D., Ph.D.

## References

[1] Wilkins, E., et al. (2017). European Cardiovascular Disease Statistics 2017. European Heart Network. [CVD Statistics Report](http://www.ehnheart.org/images/CVD-statistics-report-August-2017.pdf)

[2] Mahmood, S. S., et al. (2014). The Framingham Heart Study and the epidemiology of cardiovascular disease: a historical perspective. *Lancet*, 383(9921), 999–1008. [DOI](https://doi.org/10.1016/S0140-6736(13)61752-3)

[3] WHO CVD Risk Chart Working Group (2019). WHO cardiovascular disease risk charts. *The Lancet Global Health*, 7(10), e1332–e1345. [DOI](https://doi.org/10.1016/S2214-109X(19)30318-3)

[4] Jensen, F. & Nielsen, T. (2007). *Bayesian Networks and Decision Graphs*. [DOI](https://doi.org/10.1007/978-0-387-68282-2)

## Code of conduct

This project includes a [Contributor Code of Conduct](CODE_OF_CONDUCT.md).

## License

[MIT License](LICENSE).
