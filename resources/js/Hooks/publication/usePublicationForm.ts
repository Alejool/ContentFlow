import { getMediaRulesForContentType, type ContentType } from "@/Components/Content/Publication/common/ContentTypeSelector";
import { useContentTypeSuggestion } from "@/Hooks/publication/useContentTypeSuggestion";
import { useS3Upload } from "@/Hooks/useS3Upload";
import { validateVideoDuration } from "@/Utils/validationUtils";
import { PublicationFormData, publicationSchema } from "@/schemas/publication";
import { useMediaStore } from "@/stores/mediaStore";
import { usePublicationStore } from "@/stores/publicationStore";
import { useUploadQueue } from "@/stores/uploadQueueStore";
import { PageProps } from "@/types";
import { Publication } from "@/types/Publication";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { SOCIAL_PLATFORMS } from "../../Constants/socialPlatformsConfig";
import { useAccountsStore } from "../../stores/socialAccountsStore";

interface UsePublicationFormProps {
  publication?: Publication | null;
  onClose: () => void;
  onSubmitSuccess?: (success: boolean) => void;
  isOpen?: boolean;
}

export const usePublicationForm = ({
  publication,
  onClose,
  onSubmitSuccess,
  isOpen,
}: UsePublicationFormProps) => {
  const { t, i18n } = useTranslation();
  const contentTypeSuggestion = useContentTypeSuggestion();

  const safeJsonParse = (value: any): any => {
    if (!value) return {};
    if (typeof value === "object" && value !== null) return value;
    try {
      let parsed = typeof value === "string" ? JSON.parse(value) : value;
      // Handle potential multiple stringification
      let attempts = 0;
      while (typeof parsed === "string" && attempts < 5) {
        parsed = JSON.parse(parsed);
        attempts++;
      }
      return typeof parsed === "object" && parsed !== null ? parsed : {};
    } catch (e) {
      return {};
    }
  };

  const [currentContentType, setCurrentContentType] = useState<string>(publication?.content_type || 'post');
  
  const schema = useMemo(() => {
    return publicationSchema(t, currentContentType);
  }, [t, currentContentType]);

  const { props } = usePage<PageProps>();
  const user = props.auth.user;

  // Selectors for Publication Store
  const createPublication = usePublicationStore((s) => s.createPublication);
  const updatePublicationStore = usePublicationStore(
    (s) => s.updatePublicationStore,
  );

  // Selectors for Media Store
  const mediaFiles = useMediaStore((s) => s.mediaFiles);
  const addFiles = useMediaStore((s) => s.addFiles);
  const removeFile = useMediaStore((s) => s.removeFile);
  const updateFile = useMediaStore((s) => s.updateFile);
  const clearMedia = useMediaStore((s) => s.clear);
  const setMediaFiles = useMediaStore((s) => s.setMediaFiles);
  const setVideoMetadata = useMediaStore((s) => s.setVideoMetadata);
  const videoMetadata = useMediaStore((s) => s.videoMetadata);
  const thumbnails = useMediaStore((s) => s.thumbnails);
  const setThumbnail = useMediaStore((s) => s.setThumbnail);
  const clearThumbnail = useMediaStore((s) => s.clearThumbnail);
  const removedThumbnailIds = useMediaStore((s) => s.removedThumbnailIds);
  const setImageError = useMediaStore((s) => s.setImageError);
  const imageError = useMediaStore((s) => s.imageError);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removedMediaIds, setRemovedMediaIds] = useState<number[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const [remoteLock, setRemoteLock] = useState<{
    id: number;
    name: string;
    photo_url: string;
    isSelf: boolean;
  } | null>(null);

  // Platform settings and previews
  const [platformSettings, setPlatformSettings] = useState<Record<string, any>>(
    {},
  );
  const [activePlatformSettings, setActivePlatformSettings] = useState<
    string | null
  >(null);

  // Direct S3 Upload Hooks
  const {
    uploadFile,
    progress: uploadProgress,
    stats: uploadStats,
    uploading: isS3Uploading,
    errors: uploadErrors,
  } = useS3Upload();
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [activePlatformPreview, setActivePlatformPreview] = useState<
    string | null
  >(null);
  const [accountSchedules, setAccountSchedules] = useState<
    Record<number, string>
  >({});
  const [publishingAccountIds, setPublishingAccountIds] = useState<number[]>(
    [],
  );
  const [publishedAccountIds, setPublishedAccountIds] = useState<number[]>([]);
  const [durationErrors, setDurationErrors] = useState<Record<number, string>>(
    {},
  );

  const prevHashtagsRef = useRef<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<PublicationFormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      goal: "",
      hashtags: "",
      campaign_id: null,
      social_accounts: [],
      scheduled_at: null,
      lock_content: false,
      status: "draft",
      content_type: "post",
      poll_options: null,
      poll_duration_hours: null,
      is_recurring: false,
      recurrence_type: "daily",
      recurrence_interval: 1,
      recurrence_days: [],
      recurrence_end_date: null,
      recurrence_accounts: [],
    },
  });

  const {
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isDirty },
    trigger,
    getValues,
    getFieldState,
    control,
  } = form;
  const watched = watch();

  // Update schema when content type changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'content_type' && value.content_type !== currentContentType) {
        console.log('Content type changed from', currentContentType, 'to', value.content_type);
        setCurrentContentType(value.content_type || 'post');
        
        // Clear validation errors for fields that are no longer required
        const newContentType = value.content_type || 'post';
        const FIELD_VALIDATION_RULES = {
          post: ['title', 'description', 'goal', 'hashtags'],
          reel: ['title', 'description', 'hashtags'],
          story: [], // No required fields for stories
          poll: ['title', 'poll_options', 'poll_duration_hours'], // Only poll-specific fields
          carousel: ['title', 'description', 'goal', 'hashtags'],
        };
        
        const newRequiredFields = FIELD_VALIDATION_RULES[newContentType as keyof typeof FIELD_VALIDATION_RULES] || FIELD_VALIDATION_RULES.post;
        
        // Clear errors for fields that are no longer required
        ['hashtags', 'description', 'goal'].forEach(field => {
          if (!newRequiredFields.includes(field)) {
            form.clearErrors(field as any);
          }
        });
        
        // Force re-validation with new schema
        setTimeout(() => {
          form.trigger();
        }, 100);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, currentContentType]);

  // Unified logging for errors
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
    }
  }, [errors]);

  // Duration Validation Effect
  useEffect(() => {
    const accountIds = watched.social_accounts || [];
    validateDurations(accountIds, mediaFiles, videoMetadata);
  }, [watched.social_accounts, mediaFiles, videoMetadata]);

  // Phase 1: Load critical data IMMEDIATELY for instant modal display
  // We explicitly watch for publication object changes to enable real-time reactive updates
  useEffect(() => {
    if (isOpen && publication) {
      const isInitialLoad = !isDataReady;

      const resetData = {
        title: publication.title || "",
        description: publication.description || "",
        goal: publication.goal || "",
        hashtags: publication.hashtags || "",
        campaign_id: publication.campaigns?.[0]?.id?.toString() || null,
        social_accounts: getValues("social_accounts") || [], // Phase 2 will refine this
        scheduled_at: publication.scheduled_at || null,
        content_type: publication.content_type || "post",
        poll_options: publication.poll_options || null,
        poll_duration_hours: publication.poll_duration_hours || null,
        status: ((publication as any).status === "published" ||
        (publication as any).status === "scheduled" ||
        (publication as any).status === "publishing" ||
        (publication as any).status === "approved" ||
        (publication as any).status === "pending_review" ||
        (publication as any).status === "failed" ||
        (publication as any).status === "rejected" ||
        (publication as any).status === "draft"
          ? (publication as any).status
          : "draft") as any,
        lock_content: !!publication.social_post_logs?.some(
          (l) => l.status === "published" || l.status === "publishing",
        ),
        // Determine if using global schedule:
        // - If there are account-specific schedules (scheduled_posts with different dates), use_global_schedule = false
        // - If all scheduled_posts have the same date as publication.scheduled_at, use_global_schedule = true
        // - If no scheduled_posts exist but scheduled_at exists, use_global_schedule = true
        use_global_schedule: (() => {
          if (!publication.scheduled_at) return false;
          
          const scheduledPosts = publication.scheduled_posts || [];
          if (scheduledPosts.length === 0) return !!publication.scheduled_at;
          
          // Check if all scheduled posts have the same date as the global scheduled_at
          const allSameAsGlobal = scheduledPosts.every((post: any) => {
            if (post.status !== 'pending') return true; // Ignore non-pending posts
            const postDate = new Date(post.scheduled_at).getTime();
            const globalDate = new Date(publication.scheduled_at).getTime();
            // Allow 1 minute difference for rounding
            return Math.abs(postDate - globalDate) < 60000;
          });
          
          return allSameAsGlobal;
        })(),
        is_recurring: !!publication.is_recurring,
        // Load from recurrenceSettings if available, fallback to old fields
        recurrence_type: publication.recurrence_settings?.recurrence_type || publication.recurrence_type || "daily",
        recurrence_interval: publication.recurrence_settings?.recurrence_interval || publication.recurrence_interval || 1,
        recurrence_days: (publication.recurrence_settings?.recurrence_days || publication.recurrence_days || []).map((d: any) =>
          parseInt(d),
        ),
        recurrence_end_date: publication.recurrence_settings?.recurrence_end_date || publication.recurrence_end_date || null,
        // IMPORTANT: Keep null as null (means all accounts), don't convert to empty array
        recurrence_accounts: (() => {
          // ALWAYS use recurrence_settings if it exists, ignore old field
          const accounts = publication.recurrence_settings 
            ? publication.recurrence_settings.recurrence_accounts 
            : publication.recurrence_accounts;
          if (accounts === null || accounts === undefined) {
            return []; // Empty array in form means "all accounts"
          }
          const converted = accounts.map((id: any) => typeof id === 'string' ? parseInt(id) : id);
          return converted;
        })(),
      };

      // Always reset with fresh data when modal opens
      // This ensures we always show the latest data from the database
      reset(resetData as any, { keepDirtyValues: false });
      
      if (isInitialLoad) {
        setIsDataReady(false); // Trigger Phase 2 re-processing safely
      }
    } else if (isOpen && !publication) {
      // Logic for NEW publication
      reset({
        title: "",
        description: "",
        goal: "",
        hashtags: "",
        campaign_id: null,
        social_accounts: [] as number[],
        scheduled_at: null,
        content_type: "post",
        poll_options: null,
        poll_duration_hours: null,
        status: "draft",
        use_global_schedule: false,
        lock_content: false,
        is_recurring: false,
        recurrence_type: "daily",
        recurrence_interval: 1,
        recurrence_days: [],
        recurrence_end_date: null,
        recurrence_accounts: [],
      });
      setPlatformSettings({});
      clearMedia();
      setIsDataReady(true);
    }
  }, [isOpen, publication?.id, publication?.scheduled_at, reset]);

  // Phase 1.5: Real-time Lock & Update Listener (Global sync is handled by useWorkspaceLocks)
  useEffect(() => {
    if (!isOpen || !publication?.id || !user?.current_workspace_id) return;

    const channelName = `workspace.${user.current_workspace_id}`;
    const channel = window.Echo.private(channelName);

    // We still listen for lock changes to handle the remoteLock state in the modal
    const handleLockChange = (e: any) => {
      const pubId = Number(e.publicationId || e.publication_id);
      if (pubId === publication.id) {
        if (e.lock) {
          setRemoteLock({
            ...e.lock,
            isSelf: e.lock.user_id === user.id,
          });
        } else {
          setRemoteLock(null);
        }
      }
    };

    channel.listen(".publication.lock.changed", handleLockChange);

    return () => {
      channel.stopListening(".publication.lock.changed", handleLockChange);
    };
  }, [isOpen, publication?.id, user?.current_workspace_id, user?.id]);

  // Phase 2: Defer HEAVY processing using startTransition
  useEffect(() => {
    if (isOpen && publication) {
      startTransition(() => {
        // Process scheduled posts and social accounts
        const calculatedPublished = new Set(
          publication.social_post_logs
            ?.filter((l) => l.status === "published")
            .map((l) => l.social_account_id) || [],
        );

        const calculatedPublishing = new Set(
          publication.social_post_logs
            ?.filter(
              (l) =>
                l.status === "publishing" ||
                // If publication is 'publishing' or 'processing', treat 'pending' logs as actively publishing
                ((publication.status === "publishing" ||
                  publication.status === "processing") &&
                  l.status === "pending"),
            )
            .map((l) => l.social_account_id) || [],
        );

        setPublishedAccountIds(Array.from(calculatedPublished));
        setPublishingAccountIds(Array.from(calculatedPublishing));

        const pendingSocialAccounts = Array.from(
          new Set(
            publication.scheduled_posts
              ?.filter((sp) => sp.status === "pending")
              .map((sp) => sp.social_account_id) || [],
          ),
        );

        // LIVE SYNC PROTECTION: Only update social accounts if untouched
        if (!getFieldState("social_accounts").isDirty) {

          setValue("social_accounts", pendingSocialAccounts, {
            shouldValidate: false,
          });
        } else {
         
        }

        // Process account schedules
        // IMPORTANT: Only load ORIGINAL posts (is_recurring_instance = false)
        // Recurring instances should not be shown in the schedule configuration
        const initialAccountSchedules: Record<number, string> = {};
        const scheds =
          publication.scheduled_posts || (publication as any).scheduledPosts;
        if (scheds) {
          scheds.forEach((sp: any) => {
            if (
              sp.social_account_id &&
              sp.scheduled_at &&
              !calculatedPublished.has(sp.social_account_id) &&
              sp.is_recurring_instance === false  // Only load original posts
            ) {
              initialAccountSchedules[sp.social_account_id] = sp.scheduled_at;
            }
          });
        }
        
        setAccountSchedules((prev) => {
          // Only update if this is the initial load or if the user hasn't made changes
          // Check if prev is empty (initial load) or if we're reopening the modal
          const isEmpty = Object.keys(prev).length === 0;
          if (isEmpty) {
            return initialAccountSchedules;
          }
          // Keep user changes
          return prev;
        });

        // Process media files (ALWAYS refesh media files from store)
        // Filter out reels (files with original_media_id in metadata)
        const existingMedia: any[] =
          publication.media_files
            ?.filter((media: any) => !media.metadata?.original_media_id) // Exclude reels
            ?.map((media: any) => {
              const isVideo =
                media.file_type === "video" ||
                media.mime_type?.startsWith("video/");
              const tempId = `existing-${media.id}`;

              let url = media.file_path || media.url;
              if (url && !url.startsWith("http") && !url.startsWith("blob:")) {
                if (url.startsWith("/storage/")) {
                  // Already has leading slash and storage
                } else if (url.startsWith("storage/")) {
                  url = `/${url}`;
                } else if (!url.startsWith("/")) {
                  url = `/storage/${url}`;
                }
              }

              const thumbDerivative = media.derivatives?.find(
                (d: any) =>
                  d.derivative_type === "thumbnail" ||
                  d.derivative_type === "thumb",
              );
              let thumbnailUrl = thumbDerivative?.file_path;
              if (
                thumbnailUrl &&
                !thumbnailUrl.startsWith("http") &&
                !thumbnailUrl.startsWith("blob:")
              ) {
                if (thumbnailUrl.startsWith("/storage/")) {
                } else if (thumbnailUrl.startsWith("storage/")) {
                  thumbnailUrl = `/${thumbnailUrl}`;
                } else if (!thumbnailUrl.startsWith("/")) {
                  thumbnailUrl = `/storage/${thumbnailUrl}`;
                }
              }

              if (isVideo) {
                setVideoMetadata(tempId, {
                  duration: media.metadata?.duration || 0,
                  youtubeType: media.metadata?.youtubeType || "video",
                });
              }

              return {
                id: media.id,
                tempId: tempId,
                url: url,
                thumbnailUrl: thumbnailUrl,
                type: isVideo ? "video" : "image",
                isNew: false,
                status: media.status || "completed",
                file_name: media.file_name,
                size: media.size,
              };
            }) || [];

        // RECOVERY: Check global upload queue for files currently uploading/linked to this publication
        // This ensures if User A closes/reopens while uploading, they see their progress.
        const queue = useUploadQueue.getState().queue;
        Object.values(queue).forEach((item) => {
          if (item.publicationId === publication.id) {
            // DEDUPLICATION: Check if this file is already in existingMedia (server-side version)
            const isDuplicate = existingMedia.some((m) => {
              const nameMatch = m.file_name === item.file.name;
              const sizeMatch = Number(m.size) === Number(item.file.size);
              return nameMatch && sizeMatch;
            });

            if (
              !isDuplicate &&
              !existingMedia.some((m) => m.tempId === item.id)
            ) {
              existingMedia.push({
                tempId: item.id,
                url: URL.createObjectURL(item.file),
                type: item.file.type.startsWith("image/") ? "image" : "video",
                isNew: true,
                file: item.file,
                status: item.status === "completed" ? "completed" : "uploading",
              });
            }
          }
        });

        if (existingMedia.length === 0 && publication.image) {
          let url = publication.image;
          if (url && !url.startsWith("http") && !url.startsWith("/storage/")) {
            url = `/storage/${url}`;
          }
          existingMedia.push({
            id: undefined,
            tempId: "existing-main-image",
            url: url,
            thumbnailUrl: undefined,
            type: "image",
            isNew: false,
          });
        }

        setMediaFiles(existingMedia);
        setImageError(null);
        setIsDataReady(true);
      });
    }
  }, [isOpen, publication]); // REMOVED isDirty dependency to allow media sync

  // Auto-suggest content type based on media files
  useEffect(() => {
    if (!isOpen || mediaFiles.length === 0) return;
    
    const currentType = form.getValues('content_type');
    
    // Only suggest if we have completed media files (not uploading)
    const completedFiles = mediaFiles.filter(f => f.status === 'completed');
    if (completedFiles.length === 0) return;
    
    // Prepare media data for suggestion API
    const mediaData = completedFiles.map(file => {
      const metadata = videoMetadata[file.tempId];
      return {
        mime_type: file.type,
        duration: metadata?.duration,
        file_type: file.type.startsWith('video/') ? 'video' : 'image',
      };
    });
    
    contentTypeSuggestion.mutate({
      media: mediaData,
      current_type: currentType,
    }, {
      onSuccess: (result) => {
        if (result.should_change && result.suggested_type !== currentType) {
          // Show a toast notification about the suggestion
          toast.success(
            `Se sugiere cambiar el tipo de contenido a "${result.suggested_type}" basado en los archivos subidos.`
          );
          
          // Auto-change the content type
          form.setValue('content_type', result.suggested_type as ContentType, { shouldValidate: true });
          setCurrentContentType(result.suggested_type);
        }
      },
      onError: (error) => {
        console.warn('Content type suggestion failed:', error);
      }
    });
  }, [mediaFiles, videoMetadata, isOpen, form, contentTypeSuggestion]);

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const contentType = watch("content_type") as ContentType || 'post';
    const mediaRules = getMediaRulesForContentType(contentType);
    
    // Get current media counts
    const currentImages = mediaFiles.filter(m => m.type.includes('image')).length;
    const currentVideos = mediaFiles.filter(m => m.type.includes('video')).length;
    const currentTotal = currentImages + currentVideos;

    // Validate content type restrictions
    const newImages = newFiles.filter(f => f.type.startsWith('image/')).length;
    const newVideos = newFiles.filter(f => f.type.startsWith('video/')).length;
    
    // Check if content type allows these file types
    if (mediaRules.videoOnly && newImages > 0) {
      toast.error(
        t("publications.validation.reel_requires_video_only", {
          defaultValue: "Los Reels solo permiten videos, no imágenes"
        })
      );
      setImageError(
        t("publications.validation.reel_requires_video_only", {
          defaultValue: "Los Reels solo permiten videos, no imágenes"
        })
      );
      return;
    }

    if (mediaRules.imageOnly && newVideos > 0) {
      toast.error(
        t("publications.validation.image_only", {
          defaultValue: "Este tipo de contenido solo permite imágenes"
        })
      );
      setImageError(
        t("publications.validation.image_only", {
          defaultValue: "Este tipo de contenido solo permite imágenes"
        })
      );
      return;
    }

    // Check count limits
    if (mediaRules.maxImages !== undefined && mediaRules.maxImages === 0 && newImages > 0) {
      toast.error(
        t("publications.validation.no_images_allowed", {
          defaultValue: "Este tipo de contenido no permite imágenes"
        })
      );
      setImageError(
        t("publications.validation.no_images_allowed", {
          defaultValue: "Este tipo de contenido no permite imágenes"
        })
      );
      return;
    }

    if (mediaRules.maxVideos !== undefined && mediaRules.maxVideos === 0 && newVideos > 0) {
      toast.error(
        t("publications.validation.no_videos_allowed", {
          defaultValue: "Este tipo de contenido no permite videos"
        })
      );
      setImageError(
        t("publications.validation.no_videos_allowed", {
          defaultValue: "Este tipo de contenido no permite videos"
        })
      );
      return;
    }

    // Check if adding these files would exceed limits
    if (mediaRules.maxImages && (currentImages + newImages) > mediaRules.maxImages) {
      toast.error(
        t("publications.validation.max_images_exceeded", {
          defaultValue: `Máximo ${mediaRules.maxImages} imagen(es) permitida(s)`,
          max: mediaRules.maxImages
        })
      );
      setImageError(
        t("publications.validation.max_images_exceeded", {
          defaultValue: `Máximo ${mediaRules.maxImages} imagen(es) permitida(s)`,
          max: mediaRules.maxImages
        })
      );
      return;
    }

    if (mediaRules.maxVideos && (currentVideos + newVideos) > mediaRules.maxVideos) {
      toast.error(
        t("publications.validation.max_videos_exceeded", {
          defaultValue: `Máximo ${mediaRules.maxVideos} video(s) permitido(s)`,
          max: mediaRules.maxVideos
        })
      );
      setImageError(
        t("publications.validation.max_videos_exceeded", {
          defaultValue: `Máximo ${mediaRules.maxVideos} video(s) permitido(s)`,
          max: mediaRules.maxVideos
        })
      );
      return;
    }

    if (mediaRules.maxCount && (currentTotal + newFiles.length) > mediaRules.maxCount) {
      toast.error(
        t("publications.validation.max_files_exceeded", {
          defaultValue: `Máximo ${mediaRules.maxCount} archivo(s) permitido(s)`,
          max: mediaRules.maxCount
        })
      );
      setImageError(
        t("publications.validation.max_files_exceeded", {
          defaultValue: `Máximo ${mediaRules.maxCount} archivo(s) permitido(s)`,
          max: mediaRules.maxCount
        })
      );
      return;
    }

    // Block SVG files for security reasons (can contain malicious scripts)
    const svgFiles = newFiles.filter(
      (file) =>
        file.type === "image/svg+xml" ||
        file.name.toLowerCase().endsWith(".svg")
    );

    if (svgFiles.length > 0) {
      const fileNames = svgFiles.map((f) => f.name).join(", ");
      toast.error(
        t("publications.modal.upload.errors.svgNotAllowed", {
          defaultValue: `SVG files are not allowed for security reasons: ${fileNames}`,
          files: fileNames,
        })
      );
      setImageError(
        t("publications.modal.upload.errors.svgNotAllowed", {
          defaultValue: "SVG files are not allowed for security reasons",
        })
      );
      return;
    }
    const videoFiles = newFiles.filter((f) => f.type.startsWith("video/"));

    const newMediaItems = newFiles.map((file) => ({
      tempId: Math.random().toString(36).substring(7),
      url: URL.createObjectURL(file),
      type: file.type.startsWith("image/") ? "image" : "video",
      isNew: true,
      file,
      status: "uploading" as const,
    }));

    addFiles(newMediaItems);
    setImageError(null);

    // Get upload queue functions
    const { linkUploadToPublication } = useUploadQueue.getState();

    // Start all uploads in parallel
    const uploadPromises = newMediaItems.map(async (item) => {
      if (!item.file) return;

      // CRITICAL FIX: If editing an existing publication, link immediately
      // so attachMedia gets called when upload completes
      if (publication?.id) {
        linkUploadToPublication(item.tempId, publication.id, publication.title);
      }

      // CRITICAL: Actually start the upload!
      try {
        uploadFile(item.file, item.tempId); // Fire and forget - uploadFile handles its own state
      } catch (error) {
        toast.error(`Failed to upload ${item.file.name}`);
        updateFile(item.tempId, { status: "failed" });
      }

      // Extract video metadata in parallel
      if (item.type === "video" && item.file) {
        try {
          const video = document.createElement("video");
          video.preload = "metadata";

          await new Promise<void>((resolve, reject) => {
            video.onloadedmetadata = () => resolve();
            video.onerror = () => reject(new Error("Error loading video"));
            video.src = URL.createObjectURL(item.file!);
          });

          const duration = Math.floor(video.duration);
          const width = video.videoWidth;
          const height = video.videoHeight;
          const aspectRatio = width / height;

          URL.revokeObjectURL(video.src);

          setVideoMetadata(item.tempId, {
            duration,
            width,
            height,
            aspectRatio,
            youtubeType: duration <= 60 && aspectRatio < 1 ? "short" : "video",
          });
        } catch (e) {
          console.error("Failed to extract video metadata:", e);
        }
      }
    });

    // Wait for all metadata extraction (but not uploads, those run in background)
    await Promise.allSettled(uploadPromises);
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(Math.floor(video.duration));
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleRemoveMedia = (tempId: string) => {
    const file = mediaFiles.find((f) => f.tempId === tempId);
    if (file && !file.isNew && file.id) {
      setRemovedMediaIds((prev) => [...prev, file.id!]);
    }

    // 1. Remove from media store
    removeFile(tempId);

    // 2. Cleanup from upload queue (if it's a new file being uploaded)
    const { cancelUpload, removeUpload } = useUploadQueue.getState();
    cancelUpload(tempId);
    removeUpload(tempId);
  };

  const handleHashtagChange = (value: string) => {
    // Ensure we always work with a string
    const stringValue = String(value || '');
    
    const isDeleting = stringValue.length < prevHashtagsRef.current.length;
    const endsWithSpace = stringValue.endsWith(" ");

    let formatted = stringValue;

    if (!isDeleting && endsWithSpace && stringValue.trim().length > 0) {
      const tags = stringValue.trim().split(/\s+/);
      const processedTags = tags.map((tag) =>
        tag.startsWith("#") ? tag : `#${tag}`,
      );
      formatted = processedTags.join(" ") + " #";
    } else if (!endsWithSpace) {
      const tags = stringValue.split(/\s+/);
      formatted = tags
        .map((tag, index) => {
          if (tag.length === 0) return "";
          if (tag === "#") return "#";
          return tag.startsWith("#") ? tag : `#${tag}`;
        })
        .join(" ");
    }

    // Ensure formatted is always a string
    const finalValue = String(formatted || '');
    
    prevHashtagsRef.current = finalValue;
    setValue("hashtags", finalValue, {
      shouldValidate: false, // Disable validation during typing
      shouldDirty: true,
    });
  };

  const validateDurations = (
    accountIds: number[],
    currentMedia: any[],
    currentMetadata: Record<string, any>,
  ) => {
    const errors: Record<number, string> = {};
    const videos = currentMedia.filter((m) => m.type === "video");

    if (videos.length === 0) {
      setDurationErrors({});
      return true;
    }

    const { accounts } = useAccountsStore.getState();

    accountIds.forEach((accountId) => {
      const account = accounts.find((a) => a.id === accountId);
      if (!account) return;

      const platformKey = account.platform?.toLowerCase();
      const platformConfig = (SOCIAL_PLATFORMS as any)[platformKey];

      if (!platformConfig || !platformConfig.maxVideoDuration) return;

      const maxDuration = platformConfig.maxVideoDuration;

      videos.forEach((video) => {
        const metadata = currentMetadata[video.tempId];
        if (metadata) {
          const validation = validateVideoDuration(
            platformKey,
            metadata.duration,
          );
          if (!validation.isValid) {
            errors[accountId] = t("publications.validation.videoTooLong", {
              platform: platformConfig.name,
              max: validation.formattedMax,
              defaultValue: `Video too long for ${platformConfig.name} (max ${validation.formattedMax})`,
            });
          }
        }
      });
    });

    setDurationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAccountToggle = (accountId: number) => {
    const current = watched.social_accounts || [];
    const isAlreadySelected = current.includes(accountId);

    let nextAccounts;
    if (!isAlreadySelected) {
      nextAccounts = [...current, accountId];

      // Reset global schedule if it's in the past
      const currentGlobal = getValues("scheduled_at");
      if (currentGlobal) {
        const globalDate = new Date(currentGlobal);
        const now = new Date();
        // Allow no grace period here, if past, update to now
        if (globalDate < now) {
          setValue("scheduled_at", now.toISOString(), {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      }
    } else {
      nextAccounts = current.filter((x) => x !== accountId);
      const newScheds = { ...accountSchedules };
      delete newScheds[accountId];
      setAccountSchedules(newScheds);
    }

    setValue("social_accounts", nextAccounts, {
      shouldValidate: true,
      shouldDirty: true,
    });

    validateDurations(nextAccounts, mediaFiles, videoMetadata);
  };

  const handleClose = () => {
    reset();
    clearMedia();
    setRemovedMediaIds([]);
    setAccountSchedules({});  // Clear account schedules
    setImageError(null);
    onClose();
  };

  const handleCancelPublication = async () => {
    if (!publication?.id) return;
    try {
      await axios.post(route("api.v1.publications.cancel", publication.id));
      toast.success(
        t("publications.messages.cancelSuccess") || "Publicación cancelada",
      );

      // Proactive store update
      usePublicationStore.getState().setPublishingPlatforms(publication.id, []);
      usePublicationStore.getState().updatePublication(publication.id, {
        status: "failed" as any,
      });

      // Optionally reload or sync store
      usePublicationStore.getState().fetchPublicationById(publication.id);
    } catch (err) {
      // toast.error(
      //   t("publications.messages.cancelError") ||
      //     "Error al cancelar la publicación",
      // );
    }
  };

  const onFormSubmit = async (data: PublicationFormData) => {
    console.log('onFormSubmit called with data:', data);
    console.log('Content type:', data.content_type);
    console.log('Media files length:', mediaFiles.length);
    console.log('Social accounts:', data.social_accounts);
    console.log('Duration errors:', durationErrors);
    
    // Skip media validation for polls (they don't require media)
    if (data.content_type !== "poll" && mediaFiles.length === 0) {
      console.log('Blocking: Media required for non-poll content');
      setImageError(t("publications.modal.validation.imageRequired"));
      return;
    }

    if (data.social_accounts && data.social_accounts.length > 0) {
      console.log('Validating social accounts schedule...');
      const hasGlobalSchedule = !!data.scheduled_at;
      console.log('Has global schedule:', hasGlobalSchedule);

      // Skip schedule validation for already-published posts
      // Published posts don't need new schedule dates
      const isAlreadyPublished = publication?.status === "published";
      console.log('Is already published:', isAlreadyPublished);

      // Only validate schedule for non-published posts (draft, scheduled, failed, etc.)
      if (!isAlreadyPublished) {
        const allAccountsHaveSchedule = data.social_accounts.every(
          (id) => accountSchedules[id] || hasGlobalSchedule,
        );
        console.log('All accounts have schedule:', allAccountsHaveSchedule);
        console.log('Account schedules:', accountSchedules);

        if (!allAccountsHaveSchedule && !data.scheduled_at) {
          console.log('Blocking: Schedule validation failed');
          toast.error(
            t("publications.modal.validation.scheduleRequired") ||
              "Debes programar una fecha para todas las redes seleccionadas o establecer una fecha global.",
          );
          return;
        }
      }
    }

    if (Object.keys(durationErrors).length > 0) {
      console.log('Blocking: Duration errors exist:', durationErrors);
      toast.error(
        t("publications.validation.durationErrors") ||
          "Por favor, corrige los errores de duración antes de guardar.",
      );
      return;
    }
    
    console.log('All validations passed, proceeding with form submission...');
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description || "");
      formData.append("goal", data.goal || "");
      formData.append("hashtags", data.hashtags || "");
      
      // Add content type and poll fields
      formData.append("content_type", data.content_type || "post");
      
      if (data.content_type === "poll") {
        if (data.poll_options && data.poll_options.length > 0) {
          data.poll_options.forEach((option, index) => {
            formData.append(`poll_options[${index}]`, option);
          });
        }
        if (data.poll_duration_hours) {
          formData.append("poll_duration_hours", data.poll_duration_hours.toString());
        }
      }

      if (data.campaign_id && data.campaign_id !== "") {
        formData.append("campaign_id", data.campaign_id.toString());
      } else {
        formData.append("campaign_id", "");
      }

      let socialAccounts = [...(data.social_accounts || [])];

      // If recurring, we MUST include already published accounts so the backend
      // knows to schedule future instances for them as well.
      if (data.is_recurring) {
        publishedAccountIds.forEach((id) => {
          if (!socialAccounts.includes(id)) {
            socialAccounts.push(id);
          }
        });
      }

      const currentStatus = getValues("status") || "draft";
      const validStatuses = [
        "draft",
        "published",
        "publishing",
        "failed",
        "pending_review",
        "approved",
        "scheduled",
        "rejected",
      ];
      
      // Manejar scheduled_at según el tipo de contenido y configuración
      let scheduledAtValue = data.scheduled_at;
      const contentType = data.content_type || 'post';
      const useGlobalSchedule = data.use_global_schedule;
      
      console.log('=== SCHEDULED_AT LOGIC DEBUG ===');
      console.log('Content type:', contentType);
      console.log('Use global schedule:', useGlobalSchedule);
      console.log('Current status:', currentStatus);
      console.log('Original scheduled_at:', scheduledAtValue);
      
      // Para encuestas (polls), la lógica es diferente
      if (contentType === 'poll') {
        // Si use_global_schedule está desactivado, NO enviar scheduled_at global
        // Cada red social tendrá su propia fecha en accountSchedules
        if (!useGlobalSchedule) {
          console.log('Poll without global schedule - clearing scheduled_at');
          scheduledAtValue = null;
        } else if (currentStatus === "scheduled" && !scheduledAtValue) {
          // Solo si use_global_schedule está activo y no hay fecha, establecer una por defecto
          const defaultDate = new Date();
          defaultDate.setMinutes(defaultDate.getMinutes() + 2);
          scheduledAtValue = defaultDate.toISOString();
          setValue("scheduled_at", scheduledAtValue, { shouldDirty: true });
          console.log('Poll with global schedule - set default date:', scheduledAtValue);
        }
      } else {
        // Para otros tipos de contenido, mantener la lógica original
        if (currentStatus === "scheduled" && !scheduledAtValue) {
          const defaultDate = new Date();
          defaultDate.setMinutes(defaultDate.getMinutes() + 2);
          scheduledAtValue = defaultDate.toISOString();
          setValue("scheduled_at", scheduledAtValue, { shouldDirty: true });
          console.log('Non-poll content - set default date:', scheduledAtValue);
        }
      }
      
      console.log('Final scheduled_at value:', scheduledAtValue);
      
      const finalStatus = (() => {
        // Si no hay cuentas sociales y no hay fecha programada, siempre es draft
        if (socialAccounts.length === 0 && !scheduledAtValue) {
          return "draft";
        }
        
        // Para encuestas sin programación global, puede ser published directamente
        if (contentType === 'poll' && !useGlobalSchedule && !scheduledAtValue) {
          // Si hay cuentas sociales pero no programación global, puede ser published
          return socialAccounts.length > 0 ? (currentStatus === "published" ? "published" : "draft") : "draft";
        }
        
        // Para otros casos, usar el status actual si es válido
        return validStatuses.includes(currentStatus) ? currentStatus : "draft";
      })();

      console.log('Final status:', finalStatus);
      formData.append("status", finalStatus);
      
      // Solo enviar scheduled_at si realmente hay una fecha programada Y no es una encuesta sin programación global
      const shouldSendScheduledAt = scheduledAtValue && 
                                   scheduledAtValue.trim() !== "" && 
                                   !(contentType === 'poll' && !useGlobalSchedule);
      
      console.log('Should send scheduled_at:', shouldSendScheduledAt);
      
      if (shouldSendScheduledAt) {
        formData.append("scheduled_at", scheduledAtValue);
        console.log('Added scheduled_at to formData:', scheduledAtValue);
      } else {
        console.log('Skipped adding scheduled_at to formData');
      }
      
      formData.append("social_accounts_sync", "true");

      // Always send social_accounts - even if empty
      if (socialAccounts.length === 0) {
        formData.append("clear_social_accounts", "1");
        formData.append("social_accounts", JSON.stringify([]));
      } else {
        socialAccounts.forEach((id, index) => {
          formData.append(`social_accounts[${index}]`, id.toString());
          if (id && accountSchedules[id]) {
            formData.append(
              `social_account_schedules[${id}]`,
              accountSchedules[id],
            );
          }
        });
      }

      // Add Recurrence Fields
      if (data.is_recurring) {
        formData.append("is_recurring", "1");
        formData.append("recurrence_type", data.recurrence_type || "daily");
        formData.append(
          "recurrence_interval",
          (data.recurrence_interval || 1).toString(),
        );
        if (data.recurrence_days && data.recurrence_days.length > 0) {
          data.recurrence_days.forEach((day, i) => {
            formData.append(`recurrence_days[]`, day.toString());
          });
        }
        if (data.recurrence_end_date) {
          formData.append("recurrence_end_date", data.recurrence_end_date);
        }
        // Add recurrence_accounts
        if (data.recurrence_accounts && data.recurrence_accounts.length > 0) {
          data.recurrence_accounts.forEach((accountId, i) => {
            formData.append(`recurrence_accounts[]`, accountId.toString());
          });
        } else {
        }
      } else {
        formData.append("is_recurring", "0");
      }

      // CRITICAL: Read mediaFiles FRESH from store (not from stale selector)
      // This ensures we get the updated metadata after S3 upload
      const currentMediaFiles = useMediaStore.getState().mediaFiles;

      // 1. Filter out files that are still uploading (File objects)
      // We will link them later via background process
      const readyMediaFiles = (currentMediaFiles || []).filter((media) => {
        // Keep key-based (uploaded) files or existing IDs
        const isUploaded =
          typeof media.file === "object" && "key" in media.file;
        const isExisting = !media.isNew && media.id;
        return isUploaded || isExisting;
      });

      readyMediaFiles.forEach((media, index) => {
        const hasNewThumbnail = thumbnails[media.tempId];

        if (media.isNew && media.file) {
          // It's S3 metadata, send it as-is
          formData.append(`media[${index}][key]`, (media.file as any).key);
          formData.append(
            `media[${index}][filename]`,
            (media.file as any).filename,
          );
          formData.append(
            `media[${index}][mime_type]`,
            (media.file as any).mime_type,
          );
          formData.append(
            `media[${index}][size]`,
            (media.file as any).size.toString(),
          );

          if (videoMetadata[media.tempId]) {
            formData.append(
              `youtube_types_new[${index}]`,
              videoMetadata[media.tempId].youtubeType,
            );
            formData.append(
              `durations_new[${index}]`,
              videoMetadata[media.tempId].duration.toString(),
            );
          }

          if (hasNewThumbnail) {
            formData.append(`thumbnails[${index}]`, hasNewThumbnail);
            if (media.type === "video") {
              formData.append("youtube_thumbnail", hasNewThumbnail);
            }
          }
        } else if (!media.isNew && media.id) {
          // Send media_keep_ids to the backend to track existing media
          formData.append("media_keep_ids[]", media.id.toString());

          // ONLY add to formData if it's new or modified.
          // BUT UpdatePublicationAction doesn't currently use a 'media' array for existing items
          // unless they are new uploads. So we only need to send the ID in media_keep_ids.

          if (hasNewThumbnail) {
            formData.append(`thumbnails[${media.id}]`, hasNewThumbnail);
            if (media.type === "video") {
              formData.append("youtube_thumbnail", hasNewThumbnail);
              formData.append(
                "youtube_thumbnail_video_id",
                media.id.toString(),
              );
            }
          }
        }
      });

      if (removedMediaIds && removedMediaIds.length > 0) {
        removedMediaIds.forEach((id) =>
          formData.append("removed_media_ids[]", id.toString()),
        );
      }

      if (removedThumbnailIds && removedThumbnailIds.length > 0) {
        removedThumbnailIds.forEach((id) =>
          formData.append("removed_thumbnail_ids[]", id.toString()),
        );
      }

      let result: any;
      if (publication) {
        result = await updatePublicationStore(publication.id, formData);

        // Force refresh the publication to ensure we have the latest data
        if (result) {
          const freshPublication = await usePublicationStore
            .getState()
            .fetchPublicationById(publication.id);
        }
      } else {
        result = await createPublication(formData);
      }

      if (result) {
        toast.success(
          publication
            ? t("publications.messages.updateSuccess")
            : t("publications.messages.createSuccess")
        );
        
        // Reset dirty state after successful save so next time modal opens with fresh data
        if (publication) {
          reset(undefined, { keepValues: true, keepDirty: false });
        }
      }

      // 2. LINK PENDING UPLOADS (Moving this to background, non-awaited for UI snappiness)
      // Identify files that were filtered out (File objects)
      const pendingFiles = (currentMediaFiles || []).filter(
        (media) =>
          media.isNew &&
          media.file instanceof File &&
          media.status !== "failed",
      );

      const handleBackgroundLinking = async (
        pubId: number,
        pubTitle?: string,
      ) => {
        // 2.a Lock Media for others
        try {
          await axios.post(route("api.v1.publications.lock-media", pubId));
        } catch (err) {
          console.error("Failed to lock media:", err);
          toast.error(
            t("publications.modal.media.lockFailed") ||
              "Warning: Could not lock media for editing",
          );
        }

        // 2.b Link in Store and handle already completed
        const uploadQueueState = useUploadQueue.getState();
        const linkUploadToPublication =
          uploadQueueState.linkUploadToPublication;
        const removeUpload = uploadQueueState.removeUpload;
        const queueObj = uploadQueueState.queue;

        let attachedImmediately = false;

        for (const media of pendingFiles) {
          const queueItem = queueObj[media.tempId];

          // If already finished uploading before we saved, we must attach manually NOW
          if (
            queueItem &&
            queueItem.status === "completed" &&
            !queueItem.publicationId
          ) {
            try {
              const { data: attachResult } = await axios.post(
                route("api.v1.publications.attach-media", pubId),
                {
                  key: queueItem.s3Key,
                  filename: queueItem.file.name,
                  mime_type: queueItem.file.type,
                  size: queueItem.file.size,
                },
              );

              // Also sync DB ID to mediaStore here
              if (attachResult.media_file?.id) {
                useMediaStore.getState().updateFile(media.tempId, {
                  id: attachResult.media_file.id,
                  isNew: false,
                });
              }

              // removeUpload(media.tempId); // REMOVED: Keep in queue so user sees completion
              attachedImmediately = true;
            } catch (e) {
              console.error("Failed to attach media to publication:", e);
              toast.error(
                t("publications.modal.media.attachFailed") ||
                  `Failed to attach ${queueItem.file.name}: ${e instanceof Error ? e.message : "Unknown error"}`,
              );
              // Mark upload as failed in queue
              useUploadQueue.getState().updateUpload(media.tempId, {
                status: "error",
                error: "Failed to attach to publication",
              });
            }
          } else {
            // Otherwise, link it so useS3Upload attaches it when done
            linkUploadToPublication(media.tempId, pubId, pubTitle);
          }
        }

        if (attachedImmediately) {
          // Refresh the page to show updated media
          window.location.reload();
        }
      };

      if (pendingFiles.length > 0 && result) {
        const pubId = (result as any).id || (result as any).publication?.id;
        const pubTitle =
          (result as any).title || (result as any).publication?.title;

        if (pubId) {
          handleBackgroundLinking(pubId, pubTitle);
          toast.success(
            t("publications.modal.media.backgroundUpload") ||
              "Saved! Media is uploading in background.",
          );
        }
      }

      // CLOSE IMMEDIATELY - Don't wait for background linking or status checks
      setIsSubmitting(false);
      handleClose();
      if (onSubmitSuccess) onSubmitSuccess(true);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || t("publications.messages.error"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvalidSubmit = (errs: any) => {
    console.log('=== onInvalidSubmit called ===');
    console.log('Form validation errors:', errs);
    console.log('Current form values:', watched);
    console.log('Content type:', watched.content_type);
    console.log('Hashtags value:', watched.hashtags, 'Type:', typeof watched.hashtags);
    
    const contentType = watched.content_type || 'post';
    
    // Define what fields should be validated for each content type
    const FIELD_VALIDATION_RULES = {
      post: ['title', 'description', 'goal', 'hashtags'],
      reel: ['title', 'description', 'hashtags'],
      story: [], // No required fields for stories
      poll: ['title', 'poll_options', 'poll_duration_hours'], // Only poll-specific fields
      carousel: ['title', 'description', 'goal', 'hashtags'],
    };
    
    const requiredFields = FIELD_VALIDATION_RULES[contentType as keyof typeof FIELD_VALIDATION_RULES] || FIELD_VALIDATION_RULES.post;
    
    console.log('Required fields for', contentType, ':', requiredFields);
    
    // Content-type specific validation messages
    const getFieldError = (field: string) => {
      // Skip validation if field is not required for this content type
      if (!requiredFields.includes(field)) {
        console.log('Skipping validation for', field, 'in', contentType);
        return null;
      }
      
      switch (field) {
        case 'hashtags':
          return t("publications.modal.validation.hashtagsRequired") || "Hashtags are required";
        case 'description':
          return t("publications.modal.validation.descriptionRequired") || "Description is required";
        case 'goal':
          return t("publications.modal.validation.goalRequired") || "Goal is required";
        case 'title':
          return contentType === 'poll' 
            ? t("publications.modal.validation.questionRequired") || "Question is required"
            : t("publications.modal.validation.titleRequired") || "Title is required";
        case 'poll_options':
          return t("publications.modal.validation.pollOptionsRequired") || "Poll options are required";
        case 'poll_duration_hours':
          return t("publications.modal.validation.pollDurationRequired") || "Poll duration is required";
        default:
          return t(`publications.modal.validation.${field}Required`) || `${field} is required`;
      }
    };

    // Filter errors based on content type - only show errors for required fields
    const relevantErrors = Object.keys(errs)
      .filter(key => {
        // Always include poll-specific errors for polls
        if (contentType === 'poll' && (key === 'poll_options' || key === 'poll_duration_hours')) {
          return true;
        }
        // Skip scheduled_at errors if use_global_schedule is false OR if scheduled_at is empty
        // OR if it's a poll without scheduling requirements
        if (key === 'scheduled_at') {
          const hasGlobalSchedule = watched.use_global_schedule;
          const hasScheduledValue = watched.scheduled_at && watched.scheduled_at.trim() !== '';
          const isPoll = contentType === 'poll';
          
          console.log('Scheduled_at validation - content type:', contentType, 'global schedule:', hasGlobalSchedule, 'has value:', hasScheduledValue, 'is poll:', isPoll);
          
          // For polls, skip scheduled_at validation entirely if no global schedule is set
          if (isPoll && !hasGlobalSchedule) {
            console.log('Skipping scheduled_at validation for poll without global schedule');
            return false;
          }
          
          // Only validate scheduled_at if global schedule is enabled AND there's actually a value
          if (!hasGlobalSchedule || !hasScheduledValue) {
            console.log('Skipping scheduled_at validation - global schedule not enabled or no value');
            return false;
          }
        }
        // Include other required fields
        return requiredFields.includes(key);
      })
      .map(key => getFieldError(key))
      .filter(error => error !== null);

    console.log('Relevant errors after filtering:', relevantErrors);

    // If there are no relevant errors, call onFormSubmit directly
    if (relevantErrors.length === 0) {
      console.log('No relevant validation errors found, proceeding with submission');
      console.log('About to call onFormSubmit directly');
      // Call the submit function directly with current form values
      try {
        onFormSubmit(watched as PublicationFormData);
        console.log('onFormSubmit called successfully');
      } catch (error) {
        console.error('Error calling onFormSubmit:', error);
      }
      return;
    }

    // Show errors only if there are relevant ones
    toast.error(
      `${t("common.errors.checkFormErrors")}: ${relevantErrors.join(", ")}`
    );

    // Content-type specific media validation
    const mediaRequiredTypes = ['reel', 'story', 'carousel'];
    if (mediaRequiredTypes.includes(contentType) && mediaFiles.length === 0) {
      setImageError(t("publications.modal.validation.mediaRequired") || "Media is required for this content type");
    }
  };

  return {
    t,
    publication,
    form,
    watched,
    errors,
    isSubmitting,
    isDragOver,
    setIsDragOver,
    mediaFiles,
    imageError,
    videoMetadata,
    durationErrors,
    thumbnails,
    removedThumbnailIds,
    setThumbnail,
    clearThumbnail,
    setVideoMetadata,
    handleFileChange,
    handleRemoveMedia,
    handleHashtagChange,
    handleAccountToggle,
    handleClose,
    handleCancelPublication,
    handleSubmit: handleSubmit(onFormSubmit, onInvalidSubmit),
    fileInputRef,

    // Platform control
    platformSettings,
    setPlatformSettings,
    activePlatformSettings,
    setActivePlatformSettings,
    activePlatformPreview,
    setActivePlatformPreview,
    accountSchedules,
    setAccountSchedules,

    setValue,
    trigger,
    control,
    uploadFile,
    i18n,

    // Data loading state
    isDataReady,
    remoteLock,

    // Upload state
    uploadingFiles,
    uploadProgress,
    uploadStats,
    uploadErrors,
    publishingAccountIds,
    publishedAccountIds,
    updateFile,
    isAnyMediaProcessing:
      mediaFiles.some((m) => {
        // Check if file is in mediaStore with uploading/processing status
        if (m.status === "uploading" || m.status === "processing") {
          // Double-check with uploadQueue to see if it's actually cancelled or has an error
          const queueItem = useUploadQueue.getState().queue[m.tempId];
          if (
            queueItem &&
            (queueItem.status === "cancelled" || queueItem.status === "error")
          ) {
            return false; // Ignore cancelled or errored uploads
          }
          return true;
        }
        return uploadingFiles.has(m.tempId) && !m.id;
      }) ||
      (publication?.status as string) === "processing" ||
      (!!publication?.media_locked_by &&
        (publication.media_locked_by as any).id !== user?.id),
    isS3Uploading: mediaFiles.some((m) => {
      if (m.status === "uploading") {
        // Double-check with uploadQueue to see if it's actually cancelled or has an error
        const queueItem = useUploadQueue.getState().queue[m.tempId];
        if (
          queueItem &&
          (queueItem.status === "cancelled" || queueItem.status === "error")
        ) {
          return false; // Ignore cancelled or errored uploads
        }
        return true;
      }
      return false;
    }),
  };
};
