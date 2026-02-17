import { useTheme } from "@/Hooks/useTheme";
import { Toaster } from "react-hot-toast";

export default function ThemedToaster() {
  const { actualTheme } = useTheme();

  const isDark = actualTheme === "dark";

  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          maxWidth: "500px",
          padding: "12px 20px",
          borderRadius: "12px",
          fontSize: "14px",
          fontWeight: 500,
          border: isDark
            ? "1px solid rgba(255,255,255,0.1)"
            : "1px solid rgba(0,0,0,0.05)",
          background: isDark
            ? "rgba(10, 10, 10, 0.95)"
            : "rgba(255, 255, 255, 0.95)",
          color: isDark ? "#ffffff" : "#000000",
          backdropFilter: "blur(12px)",
          boxShadow: isDark
            ? "0 10px 30px -10px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)"
            : "0 10px 30px -10px rgba(0,0,0,0.1)",
        },
        success: {
          iconTheme: {
            primary: "#10b981",
            secondary: isDark ? "#000" : "#fff",
          },
        },
        error: {
          duration: 5000,
          style: {
            fontWeight: 600,
            border: isDark
              ? "1px solid rgba(239, 68, 68, 0.2)"
              : "1px solid rgba(239, 68, 68, 0.1)",
          },
          iconTheme: {
            primary: "#ef4444",
            secondary: isDark ? "#000" : "#fff",
          },
        },
        loading: {
          iconTheme: {
            primary: "#f59e0b",
            secondary: isDark ? "#000" : "#fff",
          },
        },
      }}
    />
  );
}
