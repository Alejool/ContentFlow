import { initPublicationsRealtime } from "@/Services/publicationRealtime";
import { useEffect } from "react";

export function useRealtime(userId?: number) {
  useEffect(() => {
    if (!userId) return;

    initPublicationsRealtime(userId);

    return () => {
      window.Echo.leave(`users.${userId}`);
    };
  }, [userId]);
}
