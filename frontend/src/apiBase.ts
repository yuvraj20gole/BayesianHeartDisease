/** Production: set VITE_API_BASE_URL to the API origin (no trailing slash), e.g. https://your-app.onrender.com */
export function apiUrl(path: string): string {
  const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";
  const p = path.startsWith("/") ? path : `/${path}`;
  if (base) return `${base}${p}`;
  return p;
}
