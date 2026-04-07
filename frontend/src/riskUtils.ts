export function riskBandLabel(p: number): { title: string; body: string } {
  if (p < 0.35)
    return {
      title: "Lower band (demo)",
      body: "In this model’s discretized setup, the estimated probability of the positive heart-disease label is relatively low. Empty fields are averaged over, not treated as “normal.”",
    };
  if (p < 0.55)
    return {
      title: "Middle band (demo)",
      body: "The model places substantial mass on both outcomes. This is a coarse educational demo—use the notebook and report for real validation metrics.",
    };
  return {
    title: "Higher band (demo)",
    body: "The positive label has higher estimated probability under this BN. This is not a diagnosis; clinical decisions need proper evaluation and a licensed professional.",
  };
}

export function riskColor(p: number): string {
  if (p < 0.35) return "var(--risk-low)";
  if (p < 0.55) return "var(--risk-mid)";
  return "var(--risk-high)";
}

export function riskHexPositive(p: number): string {
  if (p < 0.35) return "#34d399";
  if (p < 0.55) return "#fbbf24";
  return "#f87171";
}
