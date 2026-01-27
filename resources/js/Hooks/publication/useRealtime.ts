import { initPublicationsRealtime } from "@/Services/publicationRealtime";
import { usePage } from "@inertiajs/react";
import { useEffect } from "react";

export function useRealtime(userId?: number) {
  const { props } = usePage<any>();
  const workspaceId = props.auth.user?.current_workspace_id;

  useEffect(() => {
    if (!userId) return;

    initPublicationsRealtime(userId, workspaceId);

    return () => {
      window.Echo.leave(`users.${userId}`);
      // DO NOT leave workspace channel here, as it may be used by the layout or other hooks
      // window.Echo.leave(`workspace.${workspaceId}`);
    };
  }, [userId, workspaceId]);
}
