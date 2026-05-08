/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ESPN_SITE_API_BASE_URL?: string;
  readonly VITE_ESPN_CORE_API_BASE_URL?: string;
  readonly VITE_ESPN_STANDINGS_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
