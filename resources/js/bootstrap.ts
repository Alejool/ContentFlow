import axios from "axios";
import Echo from "laravel-echo";
import Pusher from "pusher-js";

axios.defaults.withCredentials = true;
axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";

// Attach the client's detected timezone to all requests so the backend
// can use it when needed to parse or normalize datetime values.
try {
  const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (userTz) {
    axios.defaults.headers.common["X-User-Timezone"] = userTz;
    // expose for other code if necessary
    (window as any).USER_TIMEZONE = userTz;
  }
} catch (e) {
  // ignore in environments without Intl
}

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<"reverb">;
  }
}

window.Pusher = Pusher;

window.Echo = new Echo<"reverb">({
  broadcaster: "reverb",
  key: import.meta.env.VITE_REVERB_APP_KEY as string,
  wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
  wsPort:
    parseInt(import.meta.env.VITE_REVERB_PORT_WS as string) ||
    (window.location.protocol === "https:" ? 443 : 80),
  wssPort: parseInt(import.meta.env.VITE_REVERB_PORT_WSS as string) || 443,
  forceTLS:
    (import.meta.env.VITE_REVERB_SCHEME ??
      (window.location.protocol === "https:" ? "https" : "http")) === "https",
  enabledTransports: ["ws", "wss"],
  authEndpoint: "/broadcasting/auth",
  autoConnect: true,
});
