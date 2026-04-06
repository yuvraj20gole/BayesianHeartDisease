import { useCallback, useEffect, useMemo, useState } from "react";
import { apiUrl } from "./apiBase";
import "./App.css";

type SchemaResponse = {
  target: string;
  variables: Record<string, string[]>;
};

type PredictResponse = {
  heart_disease: Record<string, number>;
  probability_positive: number;
};

/** Same defaults as vite.config.ts; override with VITE_* or .env.development.local */
const DEV_API_PORT = import.meta.env.VITE_API_PORT ?? "8000";
const DEV_UI_PORT = import.meta.env.VITE_DEV_PORT ?? "5173";

const DISPLAY_NAMES: Record<string, string> = {
  Age: "Age group",
  Sex: "Sex",
  ChestPainType: "Chest pain type",
  RestingBP: "Resting blood pressure",
  Cholesterol: "Cholesterol",
  FastingBS: "Fasting blood sugar",
  RestingECG: "Resting ECG",
  MaxHR: "Max heart rate",
  ExerciseAngina: "Exercise angina",
  Oldpeak: "ST depression (Oldpeak)",
  ST_Slope: "ST slope",
};

function riskColor(p: number): string {
  if (p < 0.35) return "var(--risk-low)";
  if (p < 0.55) return "var(--risk-mid)";
  return "var(--risk-high)";
}

/** FastAPI returns { "detail": string | object } on errors */
async function apiErrorMessage(r: Response): Promise<string> {
  const text = await r.text();
  try {
    const j = JSON.parse(text) as { detail?: unknown };
    if (typeof j.detail === "string") return `${r.status} ${r.statusText}: ${j.detail}`;
    if (j.detail !== undefined) return `${r.status} ${r.statusText}: ${JSON.stringify(j.detail)}`;
  } catch {
    /* not JSON */
  }
  return `${r.status} ${r.statusText}: ${text || "(empty body)"}`;
}

export default function App() {
  const [schema, setSchema] = useState<SchemaResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [predictError, setPredictError] = useState<string | null>(null);
  const [loadingSchema, setLoadingSchema] = useState(true);
  const [loadingPredict, setLoadingPredict] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(apiUrl("/api/schema"));
        if (!r.ok) throw new Error(await apiErrorMessage(r));
        const data = (await r.json()) as SchemaResponse;
        if (!cancelled) setSchema(data);
      } catch (e) {
        if (!cancelled)
          setLoadError(
            e instanceof Error
              ? e.message
              : "Could not load /api/schema. Start the API on the same port Vite proxies to (see error panel below)."
          );
      } finally {
        if (!cancelled) setLoadingSchema(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const inputVars = useMemo(() => {
    if (!schema) return [];
    const t = schema.target;
    return Object.keys(schema.variables).filter((k) => k !== t);
  }, [schema]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setPredictError(null);
      setResult(null);
      const body: Record<string, string> = {};
      for (const [k, v] of Object.entries(evidence)) {
        if (v) body[k] = v;
      }
      setLoadingPredict(true);
      try {
        const r = await fetch(apiUrl("/api/predict"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ evidence: body }),
        });
        const text = await r.text();
        if (!r.ok) {
          let detail = text;
          try {
            const j = JSON.parse(text) as { detail?: string | unknown };
            if (typeof j.detail === "string") detail = j.detail;
          } catch {
            /* raw text */
          }
          throw new Error(detail);
        }
        setResult(JSON.parse(text) as PredictResponse);
      } catch (err) {
        setPredictError(err instanceof Error ? err.message : "Request failed");
      } finally {
        setLoadingPredict(false);
      }
    },
    [evidence]
  );

  const clearForm = () => {
    setEvidence({});
    setResult(null);
    setPredictError(null);
  };

  if (loadingSchema) {
    return (
      <div className="app">
        <p className="loading">Loading model schema…</p>
      </div>
    );
  }

  if (loadError || !schema) {
    return (
      <div className="app">
        <header>
          <h1>Heart disease risk</h1>
        </header>
        <div className="banner error">{loadError ?? "Unknown error"}</div>
        <p className="loading">
          From <code>api/</code>, run the API on port <strong>{DEV_API_PORT}</strong> (Vite proxies{" "}
          <code>/api</code> to <code>127.0.0.1:{DEV_API_PORT}</code>
          {import.meta.env.VITE_API_PORT ? (
            <> — set via <code>VITE_API_PORT</code></>
          ) : (
            <>
              {" "}
              — default; if 8000/5173 are busy use <code>npm run dev:alt</code> or{" "}
              <code>.env.development.local</code>
            </>
          )}
          ):
        </p>
        {import.meta.env.DEV && (
          <>
            <p className="loading">
              Open the UI at <strong>http://localhost:{DEV_UI_PORT}</strong>
              {import.meta.env.VITE_DEV_PORT ? (
                <> — <code>VITE_DEV_PORT</code></>
              ) : null}
            </p>
            <p className="loading">
              <code style={{ color: "var(--accent)", wordBreak: "break-all" }}>
                cd api && python3.11 -m pip install -r requirements.txt && python3.11 -m uvicorn main:app
                --host 127.0.0.1 --port {DEV_API_PORT}
              </code>
            </p>
          </>
        )}
        {!import.meta.env.DEV && (
          <p className="loading">
            Production: confirm <code>VITE_API_BASE_URL</code> (GitHub Actions secret) matches your API, and{" "}
            <code>/api/health</code> works in the browser.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <h1>Heart disease risk</h1>
        <p>
          Bayesian network inference — select findings, then estimate P(heart disease). Leave fields empty
          to marginalize.
        </p>
      </header>

      {import.meta.env.DEV && (
        <div className="banner">
          Dev: Vite proxies <code>/api</code> to your API port. Production uses <code>VITE_API_BASE_URL</code>{" "}
          (see deployment docs).
        </div>
      )}

      <form onSubmit={onSubmit}>
        <div className="form-grid">
          {inputVars.map((name) => {
            const options = schema.variables[name] ?? [];
            const label = DISPLAY_NAMES[name] ?? name;
            return (
              <div className="field" key={name}>
                <label htmlFor={name}>{label}</label>
                <select
                  id={name}
                  value={evidence[name] ?? ""}
                  onChange={(e) =>
                    setEvidence((prev) => {
                      const next = { ...prev };
                      if (e.target.value) next[name] = e.target.value;
                      else delete next[name];
                      return next;
                    })
                  }
                >
                  <option value="">— Not specified —</option>
                  {options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>

        <div className="actions">
          <button type="submit" className="primary" disabled={loadingPredict}>
            {loadingPredict ? "Running inference…" : "Estimate risk"}
          </button>
          <button type="button" className="ghost" onClick={clearForm}>
            Clear
          </button>
        </div>
      </form>

      {predictError && <div className="banner error" style={{ marginTop: "1.25rem" }}>{predictError}</div>}

      {result && (
        <section className="result" aria-live="polite">
          <h2>P(Heart disease)</h2>
          <div className="meter-wrap">
            <div className="meter-label">
              <span>Positive (label 1)</span>
              <strong style={{ color: riskColor(result.probability_positive) }}>
                {(result.probability_positive * 100).toFixed(1)}%
              </strong>
            </div>
            <div className="meter">
              <div
                className="meter-fill"
                style={{
                  width: `${Math.min(100, result.probability_positive * 100)}%`,
                  background: riskColor(result.probability_positive),
                }}
              />
            </div>
          </div>
          <div className="breakdown">
            {Object.entries(result.heart_disease).map(([state, p]) => (
              <span key={state}>
                State <strong>{state}</strong>: {(p * 100).toFixed(1)}%
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
