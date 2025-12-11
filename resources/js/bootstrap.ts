import Echo from "laravel-echo";
import Pusher from "pusher-js";

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

console.log("🚀 Initializing Reverb Connection...");
console.log("Config:", {
  host: window.location.hostname,
  port: 8080,
  key: import.meta.env.VITE_REVERB_APP_KEY,
});

window.Echo.connector.pusher.connection.bind("connected", () => {
  console.log("✅ REVERB CONNECTED");
});

window.Echo.connector.pusher.connection.bind("disconnected", () => {
  console.warn("❌ REVERB DISCONNECTED");
});

window.Echo.connector.pusher.connection.bind("error", (error: any) => {
  console.error("⚠️ REVERB CONNECTION ERROR:", error);
});
