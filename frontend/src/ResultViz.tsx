import { useMemo } from "react";

type Props = {
  distribution: Record<string, number>;
  accentPositive: string;
  accentNegative: string;
};

/** SVG donut + horizontal bars — no extra chart dependencies. */
export function ResultViz({ distribution, accentPositive, accentNegative }: Props) {
  const entries = useMemo(
    () => Object.entries(distribution).sort(([a], [b]) => a.localeCompare(b)),
    [distribution]
  );

  const r = 52;
  const c = 2 * Math.PI * r;
  let acc = 0;

  const donutRings = entries.map(([state, p]) => {
    const len = Math.max(0, Math.min(1, p)) * c;
    const color = state === "1" ? accentPositive : accentNegative;
    const el = (
      <circle
        key={state}
        cx="64"
        cy="64"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="20"
        strokeLinecap="butt"
        strokeDasharray={`${len} ${c}`}
        strokeDashoffset={-acc}
      />
    );
    acc += len;
    return el;
  });

  return (
    <div className="result-viz">
      <p className="result-viz-title">Visualization</p>
      <div className="result-viz-donut">
        <svg width="128" height="128" viewBox="0 0 128 128" aria-hidden>
          <g transform="rotate(-90 64 64)">
            <circle cx="64" cy="64" r={r} fill="none" stroke="var(--border)" strokeWidth="20" />
            {donutRings}
          </g>
        </svg>
        <ul className="result-viz-legend">
          {entries.map(([state, p]) => (
            <li key={state}>
              <span
                className="result-viz-swatch"
                style={{
                  background: state === "1" ? accentPositive : accentNegative,
                }}
              />
              <span>State {state}</span>
              <strong>{(p * 100).toFixed(1)}%</strong>
            </li>
          ))}
        </ul>
      </div>
      <div className="result-viz-bars" aria-label="Probability bars">
        {entries.map(([state, p]) => (
          <div key={state} className="result-viz-bar-row">
            <span className="result-viz-bar-label">{state}</span>
            <div className="result-viz-bar-track">
              <div
                className="result-viz-bar-fill"
                style={{
                  width: `${Math.min(100, p * 100)}%`,
                  background: state === "1" ? accentPositive : accentNegative,
                }}
              />
            </div>
            <span className="result-viz-bar-pct">{(p * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
