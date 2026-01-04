import Echo from "laravel-echo";
import Pusher from "pusher-js";
import axios from "axios";

// Configure Axios for Laravel Sanctum SPA authentication
axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Header removed to rely on Sanctum's automatic cookie-based CSRF protection
// const token = document.head.querySelector('meta[name="csrf-token"]');
// if (token) {
//   axios.defaults.headers.common['X-CSRF-TOKEN'] = token.getAttribute('content');
// }

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: any;
  }
}

window.Pusher = Pusher;

window.Echo = new Echo({
  broadcaster: "reverb",
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: window.location.hostname,
  wsPort: 8080,
  wssPort: 443,
  //   forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? "https") === "https",
  forceTLS: false,
  enabledTransports: ["ws"],
  disableStats: true,
  cluster: "mt1",
  authEndpoint: "/broadcasting/auth",
  autoConnect: true,
  logToConsole: true,
});

