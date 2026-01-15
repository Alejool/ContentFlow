import axios from "axios";
import Echo from "laravel-echo";

// Axios + Sanctum
axios.defaults.withCredentials = true;
axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";

declare global {
  interface Window {
    Echo: Echo;
  }
}

window.Echo = new Echo({
  broadcaster: "reverb",
  key: import.meta.env.VITE_REVERB_APP_KEY as string,

  wsHost:
    (import.meta.env.VITE_REVERB_HOST as string) ?? window.location.hostname,

  wsPort: 443,
  wssPort: 443,

  forceTLS: true,
  enabledTransports: ["ws", "wss"],

  authEndpoint: "/broadcasting/auth",
  autoConnect: true,
});
