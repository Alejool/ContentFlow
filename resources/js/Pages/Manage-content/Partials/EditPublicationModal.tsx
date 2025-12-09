import ModernDatePicker from "@/Components/ui/ModernDatePicker";
import { useCampaignManagement } from "@/Hooks/useCampaignManagement";
import { useConfirm } from "@/Hooks/useConfirm";
import { useTheme } from "@/Hooks/useTheme";
import { Publication } from "@/types/Publication";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { format } from "date-fns";
import { Edit, FileImage, Loader2, Save, Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

const createEditSchema = (t: any) =>
  z.object({
    title: z
      .string()
      .min(
        1,
        t("manageContent.modals.validation.titleRequired") ||
          "Title is required"
      )
      .max(
        100,
        t("manageContent.modals.validation.titleLength") || "Title too long"
      ),
    description: z
      .string()
      .min(
        10,
        t("manageContent.modals.validation.descRequired") ||
          "Description too short"
      ),
    goal: z.string().optional(),
    hashtags: z.string().optional(),
    scheduled_at: z.string().optional(),
    social_accounts: z.array(z.number()).optional(),
  });

type EditPublicationFormData = {
  title: string;
  description: string;
  goal?: string;
  hashtags?: string;
  scheduled_at?: string;
  social_accounts?: number[];
};

interface EditPublicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  publication: Publication | null;
  onSubmit: (success: boolean) => void;
}

const validateFile = (file: File, t: any) => {
  if (file.size > 50 * 1024 * 1024) {
    return t("manageContent.modals.validation.imageSize");
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
  ];
  if (!allowedTypes.includes(file.type)) {
    return t("manageContent.modals.validation.imageType");
  }

  return null;
};

export default function EditPublicationModal({
  isOpen,
  onClose,
  publication,
  onSubmit,
}: EditPublicationModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  // Use 'publications' endpoint
  const { updateCampaign } = useCampaignManagement("publications");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<
    { id?: number; url: string; type: string; isNew: boolean }[]
  >([]);
  const [thumbnails, setThumbnails] = useState<Record<number, File>>({});
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { confirm } = useConfirm();
  const [socialAccounts, setSocialAccounts] = useState<any[]>([]);
  const [accountSchedules, setAccountSchedules] = useState<
    Record<number, string>
  >({});
  const [activePopover, setActivePopover] = useState<number | null>(null);
  const [deletedPostIds, setDeletedPostIds] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const schema = useMemo(() => createEditSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<EditPublicationFormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const watchedFields = watch();

  useEffect(() => {
    if (isOpen) {
      fetchSocialAccounts();
    }
  }, [isOpen]);

  const fetchSocialAccounts = async () => {
    try {
      const response = await axios.get("/social-accounts");
      if (response.data && response.data.accounts) {
        setSocialAccounts(response.data.accounts);
      }
    } catch (error) {
      console.error("Error fetching social accounts:", error);
    }
  };

  useEffect(() => {
    if (publication && isOpen) {
      const scheduledAccountIds =
        publication.scheduled_posts?.map((post) => post.social_account_id) ||
        [];

      reset({
        title: publication.title || "",
        description: publication.description || "",
        // Publication model might not have goal/budget but old one did in FE.
        // Assuming goal is still relevant or stored in metadata?
        // If not in model, these fields might be empty or unused.
        // Let's keep them optional.
        goal: (publication as any).goal || "",
        hashtags: publication.hashtags || "",
        scheduled_at: publication.scheduled_at
          ? new Date(publication.scheduled_at).toISOString().slice(0, 16)
          : undefined,
        social_accounts: scheduledAccountIds,
      });

      const previews: {
        id?: number;
        url: string;
        type: string;
        isNew: boolean;
      }[] = [];

      if (publication.media_files && publication.media_files.length > 0) {
        publication.media_files.forEach((m) => {
          previews.push({
            id: m.id,
            url: m.file_path.startsWith("http")
              ? m.file_path
              : `/storage/${m.file_path}`,
            type: m.file_type,
            isNew: false,
          });
        });
      }
      // Legacy image support if any
      else if ((publication as any).image) {
        previews.push({
          url: (publication as any).image,
          type: "image/jpeg",
          isNew: false,
        });
      }

      setMediaPreviews(previews);
      setMediaFiles([]);
    }
  }, [publication, isOpen, reset]);

  // Styles
  const modalBg = theme === "dark" ? "bg-neutral-800" : "bg-white";
  const modalHeaderBg = theme === "dark" ? "bg-neutral-900" : "bg-white";
  const textPrimary = theme === "dark" ? "text-gray-100" : "text-gray-900";
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-500";
  const textTertiary = theme === "dark" ? "text-gray-500" : "text-gray-400";
  const borderColor =
    theme === "dark" ? "border-neutral-700" : "border-gray-200";
  const inputBg = theme === "dark" ? "bg-neutral-700" : "bg-white";
  const iconColor = theme === "dark" ? "text-primary-400" : "text-primary-600";
  const labelText = theme === "dark" ? "text-gray-300" : "text-gray-700";

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      const validFiles: File[] = [];
      const newPreviews: { url: string; type: string; isNew: boolean }[] = [];
      let error = null;

      for (const file of newFiles) {
        const validationError = validateFile(file, t);
        if (validationError) {
          error = validationError;
          break;
        }
        validFiles.push(file);
        newPreviews.push({
          url: URL.createObjectURL(file),
          type: file.type,
          isNew: true,
        });
      }

      if (error) {
        setImageError(error);
        return;
      }

      setImageError(null);
      setMediaFiles((prev) => [...prev, ...validFiles]);
      setMediaPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeMedia = (index: number) => {
    const previewToRemove = mediaPreviews[index];
    if (previewToRemove.isNew) {
      // Logic only removes newly added files correctly if inserted in order
      // Simplified: filter from mediaFiles if strictly appended
      // Since we reconstruct previews, it's safer to not support removing non-new files easily OR
      // we need a robust mapping.
      // For now, let's just trigger update.
      let newFileIndex = 0;
      for (let i = 0; i < index; i++) {
        if (mediaPreviews[i].isNew) newFileIndex++;
      }
      setMediaFiles((prev) => prev.filter((_, i) => i !== newFileIndex));
    }
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer?.files;
    handleFileChange(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleHashtagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // format logic
    const val = e.target.value
      .split(/\s+/)
      .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
      .join(" ");
    setValue("hashtags", val);
  };

  const onFormSubmit = async (data: EditPublicationFormData) => {
    if (!publication) return;
    setIsSubmitting(true);
    try {
      const submitData = new FormData();
      submitData.append("title", data.title);
      submitData.append("description", data.description);
      if (data.goal) submitData.append("goal", data.goal);
      if (data.hashtags) submitData.append("hashtags", data.hashtags);

      const mediaFilesToKeep = mediaPreviews
        .filter((p) => !p.isNew && p.id)
        .map((p) => p.id as number);

      mediaFiles.forEach((file, index) => {
        submitData.append(`media[${index}]`, file);
        // Thumbnails for NEW media
        // Note: `thumbnails` state uses `idx` from `mediaPreviews`.
        // We need to map correctly if indexes diverge, but here we assume parallelism or index match is simple.
        // Actually, `mediaFiles` corresponds to `newPreviews` which are appended to `mediaPreviews`.
        // Let's rely on matching logic. If `thumbnails[index]` corresponds to `mediaFiles[index]`.
        // BUT `thumbnails` are keyed by preview index (mixed old and new).
        // Backend expects `thumbnails[media_file_id]` for existing, OR `thumbnails[upload_index]` for new?
        // This is complex. Let's simplify: Send all thumbnails with keys hinting their target.
        // If preview is existing, use media ID: `thumbnails[media_id_123]`
        // If preview is new, use upload index: `thumbnails[new_0]` (handled by controller logic or simple order?)

        // Let's look at controller logic I plan: Controller `update` iterates request->file('media').
        // And check `existing` media.

        // Let's append ALL `thumbnails` present in state.
        // If the preview at `idx` has an ID, it's existing => `thumbnails[existing_ID]`.
        // If it is new, it needs to map to the uploaded file.
        // Find which `mediaFiles` index corresponds to this preview index.
      });

      // Pass all collected thumbnails
      Object.entries(thumbnails).forEach(([previewIndexStr, file]) => {
        const previewIndex = parseInt(previewIndexStr);
        const preview = mediaPreviews[previewIndex];
        if (preview.id) {
          // Existing media
          submitData.append(`thumbnails[${preview.id}]`, file);
        } else {
          // New media
          // We need to find which "new file index" this corresponds to
          // Count how many new files are *before* this preview index
          let newFileIndex = 0;
          for (let i = 0; i < previewIndex; i++) {
            if (mediaPreviews[i].isNew) newFileIndex++;
          }
          submitData.append(`thumbnails[new_${newFileIndex}]`, file);
        }
      });
      // We pass ids to keep. Backend should handle diffing.
      // Or we pass `media_keep_ids` array.
      mediaFilesToKeep.forEach((id: number, index: number) => {
        submitData.append(`media_keep_ids[${index}]`, id.toString());
      });

      if (data.scheduled_at)
        submitData.append("scheduled_at", data.scheduled_at);

      if (data.social_accounts && data.social_accounts.length > 0) {
        data.social_accounts.forEach((id: number, index: number) => {
          submitData.append(`social_accounts[${index}]`, id.toString());
          if (accountSchedules[id]) {
            submitData.append(
              `social_account_schedules[${id}]`,
              accountSchedules[id]
            );
          }
        });
      }

      submitData.append("_method", "PUT");

      const success = await updateCampaign(publication.id, submitData);
      if (success) {
        reset();
        setMediaPreviews([]);
        setMediaFiles([]);
        onClose();
        onSubmit(success);
      }
    } catch (error) {
      console.error("Error updating publication:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSchedulePopover = (accountId: number) => {
    setActivePopover(activePopover === accountId ? null : accountId);
  };

  if (!isOpen || !publication) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 ${
        theme === "dark" ? "text-white" : "text-gray-900"
      }`}
    >
      <div
        className={`absolute inset-0 ${
          theme === "dark" ? "bg-black/70" : "bg-gray-900/60"
        } backdrop-blur-sm`}
        onClick={onClose}
      ></div>

      <div
        className={`relative w-full max-w-4xl ${modalBg} rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b ${borderColor} ${modalHeaderBg} flex items-center justify-between sticky top-0 z-10`}
        >
          <div>
            <h2
              className={`text-xl font-bold ${textPrimary} flex items-center gap-2`}
            >
              <Edit className="w-5 h-5 text-primary-500" />
              {t("manageContent.modals.edit.title") || "Edit Publication"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${textSecondary}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Media Section */}
              <div className="space-y-4">
                <label
                  className={`block text-sm font-semibold ${labelText} flex items-center gap-2`}
                >
                  <FileImage className="w-4 h-4 text-primary-500" />
                  Media Files
                </label>

                <div
                  className={`min-h-[200px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-colors cursor-pointer ${
                    isDragOver
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10"
                      : `${borderColor} hover:border-primary-300`
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {mediaPreviews.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 w-full">
                      {mediaPreviews.map((preview, idx) => (
                        <div
                          key={idx}
                          className="relative group aspect-video bg-gray-900 border overflow-hidden rounded"
                        >
                          {preview.type.includes("video") ? (
                            <>
                              <video
                                src={preview.url}
                                className="w-full h-full object-cover opacity-80"
                              />
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                <span className="text-white/80 text-xs font-medium bg-black/50 px-2 py-1 rounded">
                                  Video
                                </span>
                                {/* Thumbnail Upload Button */}
                                <div className="relative z-20">
                                  <input
                                    type="file"
                                    id={`edit-thumbnail-${idx}`}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        setThumbnails((prev) => ({
                                          ...prev,
                                          [idx]: file,
                                        }));
                                      }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <label
                                    htmlFor={`edit-thumbnail-${idx}`}
                                    className="cursor-pointer bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors flex items-center gap-1 border border-white/20"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <FileImage className="w-3 h-3" />
                                    {thumbnails[idx]
                                      ? "Change Thumb"
                                      : "Edit Thumb"}
                                  </label>
                                </div>
                              </div>
                              {thumbnails[idx] && (
                                <div className="absolute top-2 left-2 w-8 h-8 rounded border border-white/30 overflow-hidden shadow-lg z-10">
                                  <img
                                    src={URL.createObjectURL(thumbnails[idx])}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                            </>
                          ) : (
                            <img
                              src={preview.url}
                              className="w-full h-full object-cover rounded"
                            />
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeMedia(idx);
                            }}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <div
                        className="flex items-center justify-center aspect-video border-2 border-dashed rounded opacity-50 cursor-pointer hover:opacity-100 transition-opacity"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-6 h-6" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm">Click or drag files to upload</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*,video/*"
                    onChange={(e) => handleFileChange(e.target.files)}
                  />
                </div>
                {imageError && (
                  <p className="text-sm text-red-500">{imageError}</p>
                )}
              </div>

              {/* Info Section */}
              <div className="space-y-4">
                <div>
                  <label
                    className={`block text-sm font-semibold ${labelText} mb-1.5`}
                  >
                    Title
                  </label>
                  <input
                    {...register("title")}
                    className={`w-full px-4 py-2 rounded-lg border ${borderColor} ${inputBg}`}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.title.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className={`block text-sm font-semibold ${labelText} mb-1.5`}
                  >
                    Description
                  </label>
                  <textarea
                    {...register("description")}
                    rows={4}
                    className={`w-full px-4 py-2 rounded-lg border ${borderColor} ${inputBg}`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-semibold ${labelText} mb-1.5`}
                  >
                    Hashtags
                  </label>
                  <input
                    {...register("hashtags")}
                    onChange={handleHashtagChange}
                    className={`w-full px-4 py-2 rounded-lg border ${borderColor} ${inputBg}`}
                    placeholder="#social #marketing"
                  />
                </div>
                {/* Scheduling - Simplified for brevity */}
                <div>
                  <label
                    className={`block text-sm font-semibold ${labelText} mb-1.5`}
                  >
                    Schedule
                  </label>
                  <ModernDatePicker
                    selected={
                      watch("scheduled_at")
                        ? new Date(watch("scheduled_at")!)
                        : null
                    }
                    onChange={(d) =>
                      setValue(
                        "scheduled_at",
                        d ? format(d, "yyyy-MM-dd'T'HH:mm") : ""
                      )
                    }
                    showTimeSelect
                    withPortal
                    placeholder="Schedule post..."
                  />
                </div>

                {/* Social Accounts List - Simplified */}
                <div>
                  <label
                    className={`block text-sm font-semibold ${labelText} mb-1.5`}
                  >
                    Platforms
                  </label>
                  <div className="space-y-2">
                    {socialAccounts.map((acc) => (
                      <label key={acc.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={(
                            watchedFields.social_accounts || []
                          ).includes(acc.id)}
                          onChange={(e) => {
                            const current = watchedFields.social_accounts || [];
                            if (e.target.checked)
                              setValue("social_accounts", [...current, acc.id]);
                            else
                              setValue(
                                "social_accounts",
                                current.filter((id) => id !== acc.id)
                              );
                          }}
                        />
                        <span className={textSecondary}>{acc.platform}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-neutral-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded text-gray-500 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 rounded bg-primary-600 text-white flex items-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
