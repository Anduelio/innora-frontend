/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCKS?: string
  readonly VITE_TODAY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
