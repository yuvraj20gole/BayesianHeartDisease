import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiUrl } from "../apiBase";
import { apiErrorMessage } from "../apiUtil";
import { appendHistory } from "../historyStorage";
import { FIELD_HINTS, DISPLAY_NAMES } from "../labels";
import { ResultViz } from "../ResultViz";
import { riskBandLabel, riskColor, riskHexPositive } from "../riskUtils";
import { buildRiskReportCsv, triggerCsvDownload } from "../csvExport";
import { buildAssessShareUrl } from "../shareUrl";
import type { PredictResponse, SchemaResponse } from "../types";

const DEV_API_PORT = import.meta.env.VITE_API_PORT ?? "8000";
const DEV_UI_PORT = import.meta.env.VITE_DEV_PORT ?? "5173";

export function AssessPage() {
  const [schema, setSchema] = useState<SchemaResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [predictError, setPredictError] = useState<string | null>(null);
  const [loadingSchema, setLoadingSchema] = useState(true);
  const [loadingPredict, setLoadingPredict] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const hydratedFromUrl = useRef(false);

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
              : "Could not load /api/schema. Start the API on the same port Vite proxies to."
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

  useEffect(() => {
    if (!schema || hydratedFromUrl.current) return;
    const params = new URLSearchParams(window.location.search);
    const next: Record<string, string> = {};
    const t = schema.target;
    for (const key of Object.keys(schema.variables)) {
      if (key === t) continue;
      const raw = params.get(key);
      if (raw && (schema.variables[key] ?? []).includes(raw)) next[key] = raw;
    }
    if (Object.keys(next).length > 0) setEvidence((prev) => ({ ...prev, ...next }));
    hydratedFromUrl.current = true;
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
            /* raw */
          }
          throw new Error(detail);
        }
        const parsed = JSON.parse(text) as PredictResponse;
        setResult(parsed);
        appendHistory(body, parsed);
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

  const downloadReportCsv = useCallback(() => {
    if (!result) return;
    const stamp = new Date().toISOString().slice(0, 19).replace("T", "_").replace(/:/g, "-");
    const csv = buildRiskReportCsv(inputVars, evidence, result);
    triggerCsvDownload(`heart-disease-risk-report_${stamp}Z.csv`, csv);
  }, [result, inputVars, evidence]);

  const resultInsight = useMemo(() => {
    if (!result) return null;
    return riskBandLabel(result.probability_positive);
  }, [result]);

  const copyScenarioLink = useCallback(() => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(evidence)) {
      if (v) params.set(k, v);
    }
    const q = params.toString();
    void navigator.clipboard.writeText(buildAssessShareUrl(q)).then(() => {
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2000);
    });
  }, [evidence]);

  if (loadingSchema) {
    return (
      <div className="page">
        <p className="loading">Loading model schema…</p>
      </div>
    );
  }

  if (loadError || !schema) {
    return (
      <div className="page">
        <div className="page-hero">
          <h1>Assessment</h1>
        </div>
        <div className="banner error">{loadError ?? "Unknown error"}</div>
        {import.meta.env.DEV && (
          <>
            <p className="loading">
              Run the API on port <strong>{DEV_API_PORT}</strong> (Vite proxies <code>/api</code> to{" "}
              <code>127.0.0.1:{DEV_API_PORT}</code>).
            </p>
            <p className="loading">
              UI: <strong>http://localhost:{DEV_UI_PORT}</strong>
            </p>
            <p className="loading">
              <code className="code-block">
                cd api && python -m uvicorn main:app --host 127.0.0.1 --port {DEV_API_PORT}
              </code>
            </p>
          </>
        )}
        {import.meta.env.PROD && (
          <div className="loading" style={{ maxWidth: "36rem", marginTop: "1rem" }}>
            {!import.meta.env.VITE_API_BASE_URL ? (
              <p>
                <strong>Missing API URL in the build.</strong> Set GitHub secret{" "}
                <code>VITE_API_BASE_URL</code> and redeploy Pages.
              </p>
            ) : (
              <p>
                Check{" "}
                <code>{import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "")}/api/health</code> in a new tab.
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page assess-page">
      <div className="page-hero">
        <h1>Assessment</h1>
        <p className="page-lead">
          Select findings for the Bayesian network. Leave fields empty to marginalize. Results are saved to
          History after each successful run.
        </p>
        <button type="button" className="linkish" onClick={() => setAboutOpen((o) => !o)}>
          {aboutOpen ? "Hide" : "About"} this model
        </button>
        {aboutOpen && (
          <div className="about-panel">
            <p>
              Frozen network from <code>model/heart_disease_model.bif</code>. See <code>MODEL_CARD.md</code>{" "}
              in the repo. <strong>Not for clinical use.</strong>
            </p>
            <p className="about-api">
              API: <code>/docs</code> · <code>/api/version</code>
            </p>
          </div>
        )}
      </div>

      {import.meta.env.DEV && (
        <div className="banner">
          Dev: Vite proxies <code>/api</code> to your API port.
        </div>
      )}

      <form className="assess-form" onSubmit={onSubmit}>
        <div className="form-grid form-grid--two">
          {inputVars.map((name) => {
            const options = schema.variables[name] ?? [];
            const label = DISPLAY_NAMES[name] ?? name;
            return (
              <div className="field" key={name}>
                <label htmlFor={name}>
                  {label}
                  {FIELD_HINTS[name] ? (
                    <span className="field-hint" title={FIELD_HINTS[name]}>
                      ?
                    </span>
                  ) : null}
                </label>
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
          <button type="button" className="ghost" onClick={copyScenarioLink}>
            {shareCopied ? "Link copied" : "Copy share link"}
          </button>
        </div>
      </form>

      {predictError && <div className="banner error banner--tight">{predictError}</div>}

      {result && (
        <section className="result" aria-live="polite">
          <h2>Result · P(Heart disease)</h2>
          <div className="result-layout">
            <div className="result-main">
              <div className="meter-wrap">
                <div className="meter-label">
                  <span>Positive (label 1)</span>
                  <strong style={{ color: riskColor(result.probability_positive) }}>
                    {(result.probability_positive * 100).toFixed(1)}%
                  </strong>
                </div>
                <div className="meter meter--tall">
                  <div
                    className="meter-fill"
                    style={{
                      width: `${Math.min(100, result.probability_positive * 100)}%`,
                      background: riskColor(result.probability_positive),
                    }}
                  />
                </div>
              </div>
              {resultInsight ? (
                <div className="insight-panel">
                  <h3>{resultInsight.title}</h3>
                  <p>{resultInsight.body}</p>
                </div>
              ) : null}
              <div className="breakdown">
                {Object.entries(result.heart_disease).map(([state, p]) => (
                  <span key={state}>
                    State <strong>{state}</strong>: {(p * 100).toFixed(1)}%
                  </span>
                ))}
              </div>
            </div>
            <ResultViz
              distribution={result.heart_disease}
              accentPositive={riskHexPositive(result.probability_positive)}
              accentNegative="#64748b"
            />
          </div>
          <div className="actions result-export">
            <button type="button" className="ghost" onClick={downloadReportCsv}>
              Download CSV report
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
