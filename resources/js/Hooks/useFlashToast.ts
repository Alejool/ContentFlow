import { ToastService } from "@/Services/ToastService";
import { usePage } from "@inertiajs/react";
import { useEffect } from "react";

/**
 * Hook to automatically show toast notifications from flash messages
 * Use this in your layout or main app component
 */
export function useFlashToast() {
  const { flash } = usePage().props as any;

  useEffect(() => {
    if (flash) {
      ToastService.fromFlash(flash);
    }
  }, [flash]);
}
