/** FastAPI returns { "detail": string | object } on errors */
export async function apiErrorMessage(r: Response): Promise<string> {
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
