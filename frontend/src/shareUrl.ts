/** Full URL to /assess with query (respects Vite `base` for GitHub Pages). */
export function buildAssessShareUrl(queryString: string): string {
  const raw = (import.meta.env.BASE_URL || "/").replace(/\/$/, "") || "";
  const path = raw ? `${raw}/assess` : "/assess";
  const q = queryString ? `?${queryString}` : "";
  return `${window.location.origin}${path}${q}`;
}
