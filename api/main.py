"""FastAPI service: load BIF model and run VariableElimination for P(HeartDisease | evidence)."""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pgmpy.inference import VariableElimination
from pgmpy.readwrite import BIFReader

TARGET = "HeartDisease"


def _resolve_model_path() -> Path:
    """Resolve BIF path: MODEL_PATH env, then repo root, then cwd (for flexible uvicorn invocations)."""
    explicit = os.environ.get("MODEL_PATH", "").strip()
    if explicit:
        return Path(explicit).expanduser().resolve()
    root = Path(__file__).resolve().parents[1]
    candidates = [
        root / "model" / "heart_disease_model.bif",
        Path.cwd() / "model" / "heart_disease_model.bif",
        Path.cwd().parent / "model" / "heart_disease_model.bif",
    ]
    for c in candidates:
        if c.is_file():
            return c.resolve()
    return (root / "model" / "heart_disease_model.bif").resolve()


# Optional override: MODEL_PATH=/abs/path/to/model.bif
MODEL_PATH = _resolve_model_path()

FIELD_ORDER = [
    "Age",
    "Sex",
    "ChestPainType",
    "RestingBP",
    "Cholesterol",
    "FastingBS",
    "RestingECG",
    "MaxHR",
    "ExerciseAngina",
    "Oldpeak",
    "ST_Slope",
]


class PredictRequest(BaseModel):
    evidence: dict[str, str] = Field(
        default_factory=dict,
        description="Observed states; omit variables for marginalization.",
    )


class PredictResponse(BaseModel):
    heart_disease: dict[str, float]
    probability_positive: float


@lru_cache(maxsize=1)
def get_model():
    if not MODEL_PATH.is_file():
        raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")
    reader = BIFReader(str(MODEL_PATH))
    return reader.get_model()


def build_schema(model) -> dict[str, list[str]]:
    by_var: dict[str, list[str]] = {}
    for cpd in model.get_cpds():
        v = cpd.variable
        sn = cpd.state_names
        if v in sn:
            states = list(sn[v])
        elif len(sn) == 1:
            states = list(next(iter(sn.values())))
        else:
            for k in sn:
                if k == v or str(k) == str(v):
                    states = list(sn[k])
                    break
            else:
                raise ValueError(
                    f"state_names for variable {v!r} not found; keys={list(sn.keys())}"
                )
        by_var[v] = states
    ordered = {k: by_var[k] for k in FIELD_ORDER if k in by_var}
    rest = {k: v for k, v in by_var.items() if k not in ordered and k != TARGET}
    out = {**ordered, **rest}
    if TARGET in by_var:
        out[TARGET] = by_var[TARGET]
    return out


app = FastAPI(title="Heart disease BN API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok", "model": str(MODEL_PATH), "loaded": MODEL_PATH.is_file()}


@app.get("/api/schema")
def schema():
    try:
        model = get_model()
        variables = build_schema(model)
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail=(
                f"Model file missing: {MODEL_PATH}. "
                "Copy model/heart_disease_model.bif into the repo or set MODEL_PATH."
            ),
        ) from None
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"{type(e).__name__}: {e}. Check pgmpy version (api/requirements.txt).",
        ) from e
    return {"target": TARGET, "variables": variables}


@app.post("/api/predict", response_model=PredictResponse)
def predict(body: PredictRequest):
    try:
        model = get_model()
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail=f"Model file missing: {MODEL_PATH}. Set MODEL_PATH or add model/heart_disease_model.bif.",
        ) from None

    schema_vars = build_schema(model)
    evidence: dict[str, str] = {}

    for key, val in body.evidence.items():
        if key == TARGET:
            raise HTTPException(
                status_code=400,
                detail=f"Do not pass '{TARGET}' as evidence; it is the query target.",
            )
        if key not in schema_vars:
            raise HTTPException(status_code=400, detail=f"Unknown variable: {key}")
        allowed = schema_vars[key]
        if val not in allowed:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid state '{val}' for {key}. Allowed: {allowed}",
            )
        evidence[key] = val

    try:
        infer = VariableElimination(model)
        fac = infer.query(variables=[TARGET], evidence=evidence)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Inference failed: {e}") from e

    states = list(fac.state_names[TARGET])
    flat = fac.values.ravel()
    dist = {str(s): float(flat[i]) for i, s in enumerate(states)}
    pos = dist.get("1", max(dist.values()) if len(dist) == 1 else 0.0)

    return PredictResponse(heart_disease=dist, probability_positive=pos)
