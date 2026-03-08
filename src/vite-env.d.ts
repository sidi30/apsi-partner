/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_OPENAI_MODEL: string;
  readonly VITE_GWANI_API_URL: string;
  readonly VITE_GWANI_API_KEY: string;
  readonly VITE_GWANI_SCOPE_PATH: string;
  readonly VITE_ORG_NAME: string;
  readonly VITE_ORG_FULL_NAME: string;
  readonly VITE_ORG_EMAIL: string;
  readonly VITE_GOOGLE_DRIVE_LINK: string;
  readonly VITE_AI_SYSTEM_PROMPT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
