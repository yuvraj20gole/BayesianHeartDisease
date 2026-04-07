import { DISPLAY_NAMES } from "./labels";
import type { PredictResponse } from "./types";

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function triggerCsvDownload(filename: string, csvBody: string): void {
  const blob = new Blob([`\uFEFF${csvBody}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.click();
  URL.revokeObjectURL(url);
}

export function buildRiskReportCsv(
  inputVars: string[],
  evidence: Record<string, string>,
  result: PredictResponse
): string {
  const rows: string[][] = [
    ["Field", "Value"],
    [
      "Disclaimer",
      "Educational/demo Bayesian network output — not a medical diagnosis.",
    ],
    ["Generated (UTC)", new Date().toISOString()],
    ["", ""],
    ["Inputs", ""],
  ];
  for (const key of inputVars) {
    const label = DISPLAY_NAMES[key] ?? key;
    const v = evidence[key];
    rows.push([label, v ? v : "(not specified — marginalized)"]);
  }
  rows.push(["", ""]);
  rows.push(["Results", ""]);
  rows.push(["P(heart disease positive, label 1)", result.probability_positive.toFixed(6)]);
  const states = Object.keys(result.heart_disease).sort();
  for (const state of states) {
    rows.push([`P(Heart disease = ${state})`, result.heart_disease[state].toFixed(6)]);
  }
  return rows.map((row) => row.map((c) => escapeCsvField(c)).join(",")).join("\r\n");
}
