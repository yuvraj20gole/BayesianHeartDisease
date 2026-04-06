/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  /** Must match uvicorn port; same default as vite.config.ts (8000). */
  readonly VITE_API_PORT?: string;
  /** Vite dev server port; default 5173 in vite.config.ts */
  readonly VITE_DEV_PORT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
