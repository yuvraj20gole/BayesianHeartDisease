import { useMemo, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { getHistorySnapshot, subscribeHistory } from "../historyStorage";
import { riskHexPositive } from "../riskUtils";

function getServerSnapshot() {
  return [];
}

export function Dashboard() {
  const history = useSyncExternalStore(subscribeHistory, getHistorySnapshot, getServerSnapshot);

  const stats = useMemo(() => {
    const n = history.length;
    const recent = history.slice(0, 12).reverse();
    const avg =
      n > 0
        ? history.reduce((s, e) => s + e.result.probability_positive, 0) / Math.min(n, 20)
        : 0;
    const last = history[0];
    return { n, recent, avg, last };
  }, [history]);

  return (
    <div className="page dashboard-page">
      <div className="page-hero">
        <h1>Dashboard</h1>
        <p className="page-lead">
          Overview of your local assessment activity. Run a new inference or review past results — all
          history stays on this device.
        </p>
      </div>

      <div className="card-grid">
        <Link to="/assess" className="dash-card dash-card--cta">
          <span className="dash-card-kicker">Start</span>
          <h2>New assessment</h2>
          <p>Enter findings and get P(heart disease) from the Bayesian network.</p>
          <span className="dash-card-arrow">→</span>
        </Link>
        <Link to="/history" className="dash-card">
          <span className="dash-card-kicker">Review</span>
          <h2>History</h2>
          <p>
            {stats.n === 0
              ? "No saved runs yet — complete an assessment to build history."
              : `${stats.n} saved run${stats.n === 1 ? "" : "s"} in this browser.`}
          </p>
        </Link>
      </div>

      {stats.n > 0 && (
        <section className="panel">
          <h2 className="panel-title">Recent probability (P positive)</h2>
          <p className="panel-muted">
            Last up to 12 runs · rolling visual · average of last {Math.min(stats.n, 20)} runs:{" "}
            <strong>{(stats.avg * 100).toFixed(1)}%</strong>
          </p>
          <div className="spark-row" role="img" aria-label="Recent P positive values">
            {stats.recent.map((e) => {
              const p = e.result.probability_positive;
              const h = Math.round(p * 100);
              return (
                <div key={e.id} className="spark-cell" title={`${(p * 100).toFixed(1)}%`}>
                  <div
                    className="spark-bar"
                    style={{
                      height: `${Math.max(8, h)}%`,
                      background: riskHexPositive(p),
                    }}
                  />
                </div>
              );
            })}
          </div>
          {stats.last && (
            <p className="panel-foot">
              Latest: <strong>{(stats.last.result.probability_positive * 100).toFixed(1)}%</strong> positive
              ·{" "}
              <Link to="/history">open history</Link>
            </p>
          )}
        </section>
      )}

      <section className="panel panel--soft">
        <h2 className="panel-title">How it works</h2>
        <ul className="dash-list">
          <li>
            <strong>Assessment</strong> — choose discrete findings; empty fields are marginalized.
          </li>
          <li>
            <strong>API</strong> — FastAPI + pgmpy loads <code>heart_disease_model.bif</code>.
          </li>
          <li>
            <strong>History</strong> — each successful run is appended here (localStorage only).
          </li>
        </ul>
      </section>
    </div>
  );
}

