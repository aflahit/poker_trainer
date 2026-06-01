/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_UNLOCK_FLOP?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
