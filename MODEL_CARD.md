# Model card — Heart disease Bayesian network (demo)

## Summary
Discrete Bayesian network trained from a heart-disease–style tabular dataset. The web API loads a **frozen BIF** (`model/heart_disease_model.bif`) and runs **exact inference** (variable elimination) for **P(HeartDisease | evidence)**.

## Intended use
- **Education / portfolio / demonstration** of probabilistic inference.
- **Not** for clinical diagnosis or treatment decisions.

## Data & preprocessing
- Source described in the project README (Kaggle heart failure prediction–style data).
- Continuous features were **discretized** into bins (see BIF state labels: Age bands, Cholesterol tiers, etc.).
- Structure and parameters were learned/fitted in `notebook.ipynb` (source of truth).

## Metrics & limitations
- See the notebook and `latex/` report for metrics (e.g. accuracy / calibration) on the **held-out** setup used there.
- **Calibration on new populations is not guaranteed**; labels and bins are dataset-specific.
- **Missing data**: omitted fields are **marginalized** (not imputed with a single value).

## Ethical notes
- Risk scores can **mislead** if shown without context; always include a clear non-medical disclaimer.
- **Fairness**: subgroup performance was not exhaustively audited in this demo stack.

## Versioning
- Model file is versioned in Git; API exposes `GET /api/version` for build metadata.
- Reproducibility: use pinned `api/requirements.txt` and the same BIF file.
