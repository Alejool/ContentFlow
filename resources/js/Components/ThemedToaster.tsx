import { useTheme } from "@/Hooks/useTheme";
import { Toaster } from "react-hot-toast";

export default function ThemedToaster() {
  const { theme } = useTheme();

  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 4000,
        success: {
          duration: 3000,
          className:
            theme === "dark"
              ? "!bg-neutral-800/80 !text-green-400 !border !border-neutral-700 !shadow-xl !backdrop-blur-lg !rounded-lg !px-4 !py-3 !text-sm !font-medium"
              : "!bg-white/80 !text-green-600 !border !border-gray-200 !shadow-lg !backdrop-blur-lg !rounded-lg !px-4 !py-3 !text-sm !font-medium",
          iconTheme: {
            primary: theme === "dark" ? "#22c55e" : "#16a34a",
            secondary: theme === "dark" ? "#171717" : "#ffffff",
          },
        },

        error: {
          duration: 4000,
          className:
            theme === "dark"
              ? "!bg-neutral-800/80 !text-red-400 !border !border-neutral-700 !shadow-xl !backdrop-blur-lg !rounded-lg !px-4 !py-3 !text-sm !font-bold"
              : "!bg-white/80 !text-red-600 !border !border-gray-200 !shadow-lg !backdrop-blur-lg !rounded-lg !px-4 !py-3 !text-sm !font-bold",
          iconTheme: {
            primary: theme === "dark" ? "#ef4444" : "#dc2626",
            secondary: theme === "dark" ? "#171717" : "#ffffff",
          },
        },

        loading: {
          className:
            theme === "dark"
              ? "!bg-neutral-800/80 !text-orange-400 !border !border-neutral-700 !shadow-xl !backdrop-blur-lg !rounded-lg !px-4 !py-3 !text-sm !font-medium"
              : "!bg-white/90 !text-orange-600 !border !border-gray-200 !shadow-lg !backdrop-blur-lg !rounded-lg !px-4 !py-3 !text-sm !font-medium",
          iconTheme: {
            primary: theme === "dark" ? "#f97316" : "#ea580c",
            secondary: theme === "dark" ? "#171717" : "#ffffff",
          },
        },

        blank: {
          className:
            theme === "dark"
              ? "!bg-neutral-800/80 !text-gray-100 !border !border-neutral-700 !shadow-xl !backdrop-blur-lg !rounded-lg !px-4 !py-3 !text-sm !font-medium"
              : "!bg-white/90 !text-gray-900 !border !border-gray-200 !shadow-lg !backdrop-blur-lg !rounded-lg !px-4 !py-3 !text-sm !font-medium",
        },
      }}
    />
  );
}
