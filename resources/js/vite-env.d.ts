/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REVERB_APP_KEY: string;
  readonly VITE_REVERB_HOST: string;
  readonly VITE_REVERB_PORT_WS: string;
  readonly VITE_REVERB_PORT_WSS: string;
  readonly VITE_REVERB_SCHEME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
