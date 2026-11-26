/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL da API em produção (ex.: https://readex-api.onrender.com/api). Em dev, o proxy do Vite usa /api. */
  readonly VITE_API_URL?: string
}
