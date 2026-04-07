import { useMemo, useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { DISPLAY_NAMES } from "../labels";
import {
  clearHistory,
  deleteHistoryEntry,
  getHistorySnapshot,
  subscribeHistory,
  type HistoryEntry,
} from "../historyStorage";
import { riskColor } from "../riskUtils";

function summarizeEvidence(ev: Record<string, string>): string {
  const parts = Object.entries(ev)
    .filter(([, v]) => v)
    .slice(0, 4)
    .map(([k, v]) => `${DISPLAY_NAMES[k] ?? k}: ${v}`);
  return parts.length ? parts.join(" · ") : "(all fields marginalized)";
}

export function HistoryPage() {
  const history = useSyncExternalStore(subscribeHistory, getHistorySnapshot, () => []);
  const [openId, setOpenId] = useState<string | null>(null);

  const sorted = useMemo(() => [...history], [history]);

  const fmt = (iso: string) => {
    try {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  const replayHref = (e: HistoryEntry) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(e.evidence)) {
      if (v) p.set(k, v);
    }
    return `/assess?${p.toString()}`;
  };

  return (
    <div className="page history-page">
      <div className="page-hero">
        <h1>History</h1>
        <p className="page-lead">
          Runs saved in <strong>this browser only</strong> after a successful assessment. Clear anytime.
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state">
          <p>No history yet.</p>
          <Link to="/assess" className="primary-link">
            Run an assessment
          </Link>
        </div>
      ) : (
        <>
          <div className="history-toolbar">
            <span className="history-count">{sorted.length} entries</span>
            <button
              type="button"
              className="ghost danger-ghost"
              onClick={() => {
                if (window.confirm("Delete all history on this device?")) clearHistory();
              }}
            >
              Clear all
            </button>
          </div>

          <ul className="history-list">
            {sorted.map((e) => (
              <li key={e.id} className="history-item">
                <button
                  type="button"
                  className="history-item-head"
                  onClick={() => setOpenId((id) => (id === e.id ? null : e.id))}
                  aria-expanded={openId === e.id}
                >
                  <span className="history-date">{fmt(e.at)}</span>
                  <span
                    className="history-p"
                    style={{ color: riskColor(e.result.probability_positive) }}
                  >
                    {(e.result.probability_positive * 100).toFixed(1)}%
                  </span>
                  <span className="history-chevron">{openId === e.id ? "▾" : "▸"}</span>
                </button>
                <p className="history-summary">{summarizeEvidence(e.evidence)}</p>
                {openId === e.id && (
                  <div className="history-detail">
                    <div className="history-detail-grid">
                      {Object.entries(e.evidence).map(([k, v]) => (
                        <div key={k} className="history-detail-row">
                          <span>{DISPLAY_NAMES[k] ?? k}</span>
                          <strong>{v || "—"}</strong>
                        </div>
                      ))}
                    </div>
                    <div className="history-detail-actions">
                      <Link to={replayHref(e)} className="ghost small-btn">
                        Open in assessment
                      </Link>
                      <button
                        type="button"
                        className="ghost small-btn danger-ghost"
                        onClick={() => deleteHistoryEntry(e.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
