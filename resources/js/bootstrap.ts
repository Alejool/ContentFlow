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

  wsHost:
    (import.meta.env.VITE_REVERB_HOST as string) ?? window.location.hostname,

  wsPort: 443,
  wssPort: 443,

  forceTLS: true,
  enabledTransports: ["ws", "wss"],

  authEndpoint: "/broadcasting/auth",
  autoConnect: true,
});
