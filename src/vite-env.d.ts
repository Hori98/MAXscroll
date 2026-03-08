/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADSENSE_CLIENT?: string
  readonly VITE_ADSENSE_INTERSTITIAL_SLOT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
