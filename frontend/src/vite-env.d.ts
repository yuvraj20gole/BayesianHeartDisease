/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  /** Must match uvicorn port; same default as vite.config.ts (8000). */
  readonly VITE_API_PORT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
