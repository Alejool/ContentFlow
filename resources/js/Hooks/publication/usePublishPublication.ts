// hooks/usePublishPublication.ts
import { useCampaignStore } from "@/stores/campaignStore";
import { usePublicationStore } from "@/stores/publicationStore";
import { SocialAccount, useAccountsStore } from "@/stores/socialAccountsStore";
import { Publication } from "@/types/Publication";
import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

export interface PublishPublicationState {
  selectedPlatforms: number[];
  publishedPlatforms: number[];
  publishing: boolean;
  unpublishing: number | null;
  youtubeThumbnails: Record<number, File | null>;
  existingThumbnails: Record<number, { url: string; id: number }>;
  isLoadingThumbnails: boolean;
}

export interface UsePublishPublicationReturn extends PublishPublicationState {
  connectedAccounts: SocialAccount[];
  fetchPublishedPlatforms: (publicationId: number) => Promise<void>;
  loadExistingThumbnails: (publication: Publication) => Promise<void>;
  handleUnpublish: (
    publicationId: number,
    accountId: number,
    platform: string
  ) => Promise<boolean>;
  togglePlatform: (accountId: number) => void;
  selectAll: () => void;
  deselectAll: () => void;
  isYoutubeSelected: () => boolean;
  handlePublish: (
    publication: Publication,
    thumbnails: Record<number, File | null>
  ) => Promise<boolean>;
  setYoutubeThumbnails: React.Dispatch<
    React.SetStateAction<Record<number, File | null>>
  >;
  setExistingThumbnails: React.Dispatch<
    React.SetStateAction<Record<number, { url: string; id: number }>>
  >;
  setUnpublishing: React.Dispatch<React.SetStateAction<number | null>>;
  resetState: () => void;
  activeAccounts: SocialAccount[];
  // Función específica para manejar cambios de thumbnails
  handleThumbnailChange: (videoId: number, file: File | null) => void;
  handleThumbnailDelete: (videoId: number) => void;
}

export const usePublishPublication = (): UsePublishPublicationReturn => {
  // Obtener cuentas del store global
  const { accounts } = useAccountsStore();

  // Obtener campañas del store global
  const { campaigns, fetchCampaigns } = useCampaignStore();

  // Filtrar solo cuentas activas
  const activeAccounts = useMemo(
    () =>
      accounts
        .filter((account) => account.is_active)
        .map((account) => ({
          ...account,
          account_name: account.account_name || account.name,
        })),
    [accounts]
  );

  // Cargar campañas si no están disponibles
  useEffect(() => {
    if (campaigns.length === 0) {
      fetchCampaigns();
    }
  }, [campaigns.length, fetchCampaigns]);

  // Obtener estado y métodos del store de publicaciones
  const {
    publishedPlatforms: publishedPlatformsCache,
    fetchPublishedPlatforms: fetchPublishedPlatformsFromStore,
    setPublishedPlatforms: setPublishedPlatformsInStore,
  } = usePublicationStore();

  // Estado local
  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState<number | null>(null);
  const [youtubeThumbnails, setYoutubeThumbnails] = useState<
    Record<number, File | null>
  >({});
  const [existingThumbnails, setExistingThumbnails] = useState<
    Record<number, { url: string; id: number }>
  >({});
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState(false);

  // ID de la publicación actual (se actualizará cuando se llame a fetchPublishedPlatforms)
  const [currentPublicationId, setCurrentPublicationId] = useState<
    number | null
  >(null);

  // Obtener plataformas publicadas para la publicación actual del caché
  const publishedPlatforms = useMemo(() => {
    return currentPublicationId
      ? publishedPlatformsCache[currentPublicationId] || []
      : [];
  }, [publishedPlatformsCache, currentPublicationId]);

  // Función para resetear el estado local
  const resetState = useCallback(() => {
    setSelectedPlatforms([]);
    setYoutubeThumbnails({});
    setExistingThumbnails({});
    setUnpublishing(null);
    setCurrentPublicationId(null);
  }, []);

  // Cargar thumbnails existentes
  const loadExistingThumbnails = useCallback(
    async (publication: Publication) => {
      if (!publication?.media_files) {
        setExistingThumbnails({});
        return;
      }

      setIsLoadingThumbnails(true);
      try {
        const thumbnails: Record<number, { url: string; id: number }> = {};

        const videoFiles = publication.media_files.filter(
          (m) => m.file_type && m.file_type.includes("video")
        );

        console.log("Video files:", videoFiles);

        for (const video of videoFiles) {
          // Buscar thumbnails en metadata
          if (video.metadata?.thumbnail_url) {
            thumbnails[video.id] = {
              url: video.metadata.thumbnail_url,
              id: video.id,
            };
          }
          // Buscar en derivados
          else if (video.derivatives && Array.isArray(video.derivatives)) {
            const thumbnail = video.derivatives.find(
              (d: any) =>
                d.derivative_type === "thumbnail" || d.file_type === "image"
            );

            if (thumbnail?.file_path) {
              thumbnails[video.id] = {
                url: thumbnail.file_path.startsWith("http")
                  ? thumbnail.file_path
                  : `/storage/${thumbnail.file_path}`,
                id: thumbnail.id || video.id,
              };
            }
          }
        }

        console.log("Thumbnails loaded:", thumbnails);
        setExistingThumbnails(thumbnails);
      } catch (error) {
        console.error("Error loading thumbnails:", error);
      } finally {
        setIsLoadingThumbnails(false);
      }
    },
    []
  );

  // Manejar cambios de thumbnails
  const handleThumbnailChange = useCallback(
    (videoId: number, file: File | null) => {
      setYoutubeThumbnails((prev) => ({
        ...prev,
        [videoId]: file,
      }));

      // Si se elimina un archivo, también limpiar del estado
      if (!file) {
        setExistingThumbnails((prev) => {
          const newExisting = { ...prev };
          delete newExisting[videoId];
          return newExisting;
        });
      }
    },
    []
  );

  const handleThumbnailDelete = useCallback((videoId: number) => {
    setYoutubeThumbnails((prev) => {
      const newThumbs = { ...prev };
      delete newThumbs[videoId];
      return newThumbs;
    });

    setExistingThumbnails((prev) => {
      const newExisting = { ...prev };
      delete newExisting[videoId];
      return newExisting;
    });
  }, []);

  // Obtener plataformas ya publicadas
  const fetchPublishedPlatforms = useCallback(
    async (publicationId: number) => {
      setCurrentPublicationId(publicationId);
      await fetchPublishedPlatformsFromStore(publicationId);
    },
    [fetchPublishedPlatformsFromStore]
  );

  // Despublicar
  const handleUnpublish = useCallback(
    async (publicationId: number, accountId: number, platform: string) => {
      try {
        await axios.post(`/publications/${publicationId}/unpublish`, {
          platform_ids: [accountId],
        });

        toast.success(`Unpublished from ${platform}`);

        // Actualizar el store
        const currentPublished = publishedPlatformsCache[publicationId] || [];
        setPublishedPlatformsInStore(
          publicationId,
          currentPublished.filter((id) => id !== accountId)
        );

        return true;
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Error unpublishing");
        return false;
      }
    },
    [publishedPlatformsCache, setPublishedPlatformsInStore]
  );

  // Alternar plataforma seleccionada
  const togglePlatform = useCallback((accountId: number) => {
    setSelectedPlatforms((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
    );
  }, []);

  // Seleccionar todas las plataformas
  const selectAll = useCallback(() => {
    setSelectedPlatforms(activeAccounts.map((acc) => acc.id));
  }, [activeAccounts]);

  // Deseleccionar todas las plataformas
  const deselectAll = useCallback(() => {
    setSelectedPlatforms([]);
  }, []);

  // Verificar si YouTube está seleccionado
  const isYoutubeSelected = useCallback(() => {
    return activeAccounts.some(
      (acc) =>
        acc.platform.toLowerCase() === "youtube" &&
        selectedPlatforms.includes(acc.id)
    );
  }, [activeAccounts, selectedPlatforms]);

  // Manejar publicación
  const handlePublish = useCallback(
    async (
      publication: Publication,
      thumbnails: Record<number, File | null>
    ): Promise<boolean> => {
      if (selectedPlatforms.length === 0) {
        toast.error("Please select at least one platform");
        return false;
      }

      setPublishing(true);
      try {
        const formData = new FormData();

        // Add platforms as array
        selectedPlatforms.forEach((id) => {
          formData.append("platforms[]", id.toString());
        });

        // Add YouTube thumbnails si existen
        Object.entries(thumbnails).forEach(([videoId, file]) => {
          if (file) {
            formData.append("youtube_thumbnails[]", file);
            formData.append("youtube_thumbnail_video_ids[]", videoId);
          }
        });

        const response = await axios.post(
          `/publications/${publication.id}/publish`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.data.success) {
          toast.success("Publication published successfully!");

          // Actualizar thumbnails existentes
          Object.entries(thumbnails).forEach(([videoId, file]) => {
            if (file) {
              setExistingThumbnails((prev) => ({
                ...prev,
                [videoId]: {
                  url: URL.createObjectURL(file),
                  id: Date.now(),
                },
              }));
            }
          });

          // Limpiar thumbnails temporales
          setYoutubeThumbnails({});

          return true;
        } else {
          handlePublishErrors(response.data);
          return false;
        }
      } catch (error: any) {
        console.error("Publishing error:", error);

        if (error.response) {
          handlePublishErrors(error.response.data);
        } else {
          toast.error("Network error. Please check your connection.");
        }
        return false;
      } finally {
        setPublishing(false);
      }
    },
    [selectedPlatforms]
  );

  // Manejar errores de publicación
  const handlePublishErrors = useCallback((data: any) => {
    const { details, message } = data;

    if (!details) {
      toast.error(message || "Publishing failed");
      return;
    }

    const { platform_results } = details;
    let errorLines: string[] = [];
    let successLines: string[] = [];

    if (platform_results) {
      Object.entries(platform_results).forEach(
        ([platform, result]: [string, any]) => {
          if (result.success) {
            successLines.push(`✓ ${platform}: Published`);
          } else {
            const errorMsg =
              result.errors?.[0]?.message || result.message || "Unknown error";
            errorLines.push(`✗ ${platform}: ${errorMsg}`);
          }
        }
      );
    }

    if (successLines.length > 0 && errorLines.length > 0) {
      toast.error(
        `Partial success:\n${successLines.join("\n")}\n${errorLines.join(
          "\n"
        )}`,
        { duration: 6000 }
      );
    } else if (errorLines.length > 0) {
      toast.error(`Publishing failed:\n${errorLines.join("\n")}`, {
        duration: 6000,
      });
    } else {
      toast.error(message || "Publishing failed");
    }
  }, []);

  return {
    // State
    connectedAccounts: activeAccounts,
    selectedPlatforms,
    publishedPlatforms,
    publishing,
    unpublishing,
    youtubeThumbnails,
    existingThumbnails,
    isLoadingThumbnails,

    // Computed
    activeAccounts,

    // Actions
    fetchPublishedPlatforms,
    loadExistingThumbnails,
    handleUnpublish,
    togglePlatform,
    selectAll,
    deselectAll,
    isYoutubeSelected,
    handlePublish,

    // Thumbnail handlers
    handleThumbnailChange,
    handleThumbnailDelete,

    // Setters
    setYoutubeThumbnails,
    setExistingThumbnails,
    setUnpublishing,

    // Utilities
    resetState,
  };
};
