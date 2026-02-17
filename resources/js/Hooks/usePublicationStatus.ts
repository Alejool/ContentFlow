import { Publication } from "@/types/Publication";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import { useEffect, useState } from "react";

interface UsePublicationStatusOptions {
  dismissedIds: number[];
}

export function usePublicationStatus({ dismissedIds }: UsePublicationStatusOptions) {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const props = usePage().props as any;

  const fetchPublications = async (signal?: AbortSignal) => {
    if (isFetching) return;

    try {
      setIsFetching(true);
      const response = await axios.get(route("api.v1.publications.index"), {
        params: {
          status: "processing,publishing,failed,published",
          simplified: "true",
        },
        signal,
      });

      if (response.data?.success && response.data?.publications) {
        const items: Publication[] = Array.isArray(response.data.publications)
          ? response.data.publications
          : response.data.publications.data || [];

        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const filtered = items.filter((item) => {
          if (item.status === "processing" || item.status === "publishing") {
            return true;
          }

          if (item.status === "failed" || item.status === "published") {
            if (dismissedIds.includes(item.id)) return false;
            const updatedAt = new Date(item.updated_at || "");
            return updatedAt > fiveMinutesAgo;
          }

          return false;
        });

        setPublications(filtered);
      }
    } catch (err) {
      if (axios.isCancel(err) || (err as any)?.name === "CanceledError") {
        return;
      }
      console.error("Failed to fetch publications", err);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    const abortController = new AbortController();
    fetchPublications(abortController.signal);

    let interval: NodeJS.Timeout | null = null;

    // Fallback polling if WebSocket unavailable
    if (!props.auth?.user?.id || !window.Echo) {
      interval = setInterval(() => {
        fetchPublications(abortController.signal);
      }, 30000);
    }

    // WebSocket real-time updates
    if (props.auth?.user?.id && window.Echo) {
      const channel = window.Echo.private(`users.${props.auth.user.id}`);
      channel.listen(".PublicationStatusUpdated", () => {
        fetchPublications(abortController.signal);
      });

      return () => {
        if (interval) clearInterval(interval);
        abortController.abort();
        channel.stopListening(".PublicationStatusUpdated");
      };
    }

    return () => {
      if (interval) clearInterval(interval);
      abortController.abort();
    };
  }, [props.auth?.user?.id, dismissedIds]);

  useEffect(() => {
    const abortController = new AbortController();

    const handlePublicationStarted = () => {
      fetchPublications(abortController.signal);
    };

    window.addEventListener("publication-started", handlePublicationStarted);

    return () => {
      abortController.abort();
      window.removeEventListener("publication-started", handlePublicationStarted);
    };
  }, []);

  return { publications };
}
