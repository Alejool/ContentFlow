import axios from "axios";
import Echo from "laravel-echo";
import Pusher from "pusher-js";

axios.defaults.withCredentials = true;
axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";

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
  wsHost: import.meta.env.VITE_REVERB_HOST ?? window.location.hostname,
  wsPort: import.meta.env.VITE_REVERB_PORT ?? 6001,
  wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
  forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? "https") === "https",
  enabledTransports: ["ws", "wss"],
  authEndpoint: "/broadcasting/auth",
  autoConnect: true,
});
