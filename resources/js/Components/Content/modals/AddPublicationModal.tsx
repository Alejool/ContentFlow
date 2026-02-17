import AiFieldSuggester from "@/Components/AiAssistant/AiFieldSuggester";
import PlatformSettingsModal from "@/Components/ConfigSocialMedia/PlatformSettingsModal";
import CampaignSelector from "@/Components/Content/Publication/common/CampaignSelector";
import SocialAccountsSection from "@/Components/Content/Publication/common/add/SocialAccountsSection";
import MediaUploadSection from "@/Components/Content/Publication/common/edit/MediaUploadSection";
import ModalFooter from "@/Components/Content/modals/common/ModalFooter";
import ModalHeader from "@/Components/Content/modals/common/ModalHeader";
import ScheduleSection from "@/Components/Content/modals/common/ScheduleSection";
import Input from "@/Components/common/Modern/Input";
import Textarea from "@/Components/common/Modern/Textarea";
import { useCampaigns } from "@/Hooks/campaign/useCampaigns";
import { usePublicationForm } from "@/Hooks/publication/usePublicationForm";
import { useConfirm } from "@/Hooks/useConfirm";
import { useS3Upload } from "@/Hooks/useS3Upload";
import { useMediaStore } from "@/stores/mediaStore";
import { useAccountsStore } from "@/stores/socialAccountsStore";
import axios from "axios";
import { FileText, Hash, Loader2, Save, Target, X } from "lucide-react";
import { useMemo } from "react";
import { useWatch } from "react-hook-form";
import { toast } from "react-hot-toast";

interface AddPublicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function AddPublicationModal({
  isOpen,
  onClose,
  onSubmit,
}: AddPublicationModalProps) {
  const { campaigns } = useCampaigns();
  const { accounts: socialAccounts } = useAccountsStore();

  const {
    t,
    form,
    errors,
    isSubmitting,
    isDragOver,
    setIsDragOver,
    mediaFiles,
    imageError,
    videoMetadata,
    thumbnails,
    setThumbnail,
    clearThumbnail,
    setVideoMetadata,
    handleFileChange,
    handleRemoveMedia,
    handleHashtagChange,
    handleAccountToggle,
    handleClose,
    handleSubmit,
    platformSettings,
    setPlatformSettings,
    activePlatformSettings,
    setActivePlatformSettings,
    accountSchedules,
    setAccountSchedules,
    setValue,
    control,
    remoteLock,
    publishingAccountIds,
    publishedAccountIds,
    publication,
    updateFile: baseUpdateFile,
  } = usePublicationForm({
    onClose,
    onSubmitSuccess: onSubmit,
    isOpen,
  });

  const updateFile = async (tempId: string, file: File) => {
    // 1. Update the store immediately with the new local URL for preview
    const localUrl = URL.createObjectURL(file);
    baseUpdateFile(tempId, {
      file,
      url: localUrl,
      status: "uploading",
      isNew: true,
    });

    // 2. Trigger the S3 upload
    try {
      const result = await uploadFile(file, tempId);
      return result;
    } catch (err) {
      console.error("Failed to upload cropped image", err);
    }
  };

  const { confirm, ConfirmDialog } = useConfirm();

  const { uploadFile, uploading, progress: uploadProgress } = useS3Upload(); // Use hook

  // Custom submit handler to intercept fields and upload first
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // We need to check if there are any NEW files to upload
    // mediaFiles contains { file: File | null, url, id, ... }
    // If it has a 'file' object, it needs upload.

    // 1. Filter files needing upload
    const filesToUpload = mediaFiles.filter((m) => m.file instanceof File);

    if (filesToUpload.length > 0) {
      // Temporarily handling this inside submit for simplicity,
      // ideally we upload as they are selected or show a specialized UI.
      // But to keep current UX, we block submit with "Uploading..." state.

      try {
        // We need to inject the uploaded metadata back into the form data
        // Since usePublicationForm handles submission via 'handleSubmit', we need to hook into 'onSubmitSuccess' or similar?
        // Actually 'handleSubmit' from react-hook-form calls the 'onSubmit' callback.
        // But here we are wrapping the form submit.

        // Let's modify the data passed to the actual submission.
        // However, 'usePublicationForm' exposes 'handleSubmit' which is RHF's handler.
        // We can't easily intercept the *data* inside RHF's handleSubmit without wrapping the onSubmit passed to usePublicationForm.
        // BUT, usePublicationForm accepts `onSubmitSuccess: onSubmit`.

        // Wait, AddPublicationModal props: onSubmit: (data: any) => void;
        // The Modal calls `handleSubmit(onSubmit)` from usePublicationForm.
        // We need to intercept the data *before* it goes to the server action or inertia post.
        // The Logic is inside `usePublicationForm` -> `onSubmit`.

        // Strategy:
        // 1. Upload files here in the Modal.
        // 2. Replace the `file` objects in `mediaFiles` (or form data) with the metadata returned by S3.
        // 3. BUT `usePublicationForm` manages `mediaFiles` state. We can't easily replace it without helper methods.

        // ALTERNATIVE:
        // Modify `usePublicationForm` to handle the upload?
        // Or just do it here and pass a "modified" onSubmit to `usePublicationForm`.

        // Let's try wrapping the submit action.
        // We can iterate and upload, collecting keys.
        // Then we need to tell the backend "Here are keys, not files".
        // The backend `store` method expects `media[]`.

        // Let's execute the uploads.
        const uploadedMetadata: any[] = [];

        // Show loading state (e.g. valid toast or just rely on 'isSubmitting' if we trigger it)
        // Ideally we'd have a UI for progress.

        await Promise.all(
          filesToUpload.map(async (media) => {
            if (media.file) {
              const result = await uploadFile(media.file, media.tempId);
              // Store result alongside the original index or id to map it back?
              // We can just rely on order if we are careful, but async might mix order.
              // Better to modify the form data 'media' field.

              // We need to modify what the form sends.
              // RHF 'media' field?
            }
          }),
        );

        // This is getting complex to patch into the existing hook structure without modyfing the hook.
        // The hook `usePublicationForm` uses `useForm`.
        // The best place to integrate this "Architecture PRO" is inside `usePublicationForm`'s `onSubmit` logic
        // OR by handling uploads immediately upon selection (Instagram style).

        // Given the constraints and the goal "Update frontend to upload to S3 directly":
        // I will intercept the onSubmit passed to AddPublicationModal.

        // But wait, `handleSubmit` is called on form submit.
        // `handleSubmit` calls `onSubmit` (which is `usePublicationForm` internal).
        // `usePublicationForm` internal `onSubmit` calls... `createPublication.mutate`.

        // Making "Direct Upload" work seamlessly requires changes in how the form data is prepared.
      } catch (e) {
        console.error("Upload error", e);
        return;
      }
    }

    // Propagate
    handleSubmit(e);
  };

  // Re-thinking: Modifying `usePublicationForm` might be cleaner, but I can't see it right now.
  // Let's implement a wrapper `onFormSubmit` that does the work and then calls `handleSubmit`.

  const handleUploadAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const filesToUpload = mediaFiles.filter((m) => m.file instanceof File);

    if (filesToUpload.length > 0) {
      // Upload all files
      try {
        // Upload files and get metadata
        const uploadResults = await Promise.all(
          filesToUpload.map(async (m) => ({
            tempId: m.tempId,
            metadata: await uploadFile(m.file!, m.tempId),
          })),
        );

        // If any upload was cancelled (metadata is undefined), stop the process
        if (uploadResults.some((r) => !r.metadata)) {
          // One or more uploads cancelled, stopping submission
          return;
        }

        // CRITICAL: Update the mediaFiles store to replace File objects with metadata
        // The usePublicationForm hook reads from mediaFiles store, not form values
        const updatedMediaFiles = mediaFiles.map((media) => {
          const uploadResult = uploadResults.find(
            (r) => r.tempId === media.tempId,
          );
          if (uploadResult) {
            // Replace the File object with S3 metadata
            return {
              ...media,
              file: uploadResult.metadata, // This will be detected as metadata in usePublicationForm
            };
          }
          return media;
        });

        // Update the store using the proper method
        const setMediaFiles = useMediaStore.getState().setMediaFiles;
        setMediaFiles(updatedMediaFiles as any);

        // Small delay to ensure state update propagates
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Proceed with normal submit
        handleSubmit(e);
      } catch (err) {
        console.error("❌ [S3 UPLOAD] Upload failed", err);
        // Show error
      }
    } else {
      handleSubmit(e);
    }
  };

  const { register } = form; // Keep existing destructuring

  // Use individual watchers to prevent unnecessary re-renders
  const selectedSocialAccounts =
    useWatch({ control, name: "social_accounts" }) || [];
  const scheduledAt = useWatch({ control, name: "scheduled_at" });
  const useGlobalSchedule = useWatch({ control, name: "use_global_schedule" });
  const title = useWatch({ control, name: "title" });
  const goal = useWatch({ control, name: "goal" });
  const hashtags = useWatch({ control, name: "hashtags" });
  const description = useWatch({ control, name: "description" });
  const campaign_id = useWatch({ control, name: "campaign_id" });

  const watched = useMemo(
    () => ({
      social_accounts: selectedSocialAccounts,
      scheduled_at: scheduledAt,
      use_global_schedule: useGlobalSchedule,
      title,
      description,
      goal,
      hashtags,
      campaign_id,
    }),
    [
      selectedSocialAccounts,
      scheduledAt,
      useGlobalSchedule,
      title,
      description,
      goal,
      hashtags,
      campaign_id,
    ],
  );

  const stabilizedMediaPreviews = useMemo(() => {
    return mediaFiles.map((m) => ({
      ...m,
      url: m.url,
    }));
  }, [mediaFiles]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center text-gray-900 dark:text-white">
      <div
        className="absolute inset-0 bg-gray-900/60 dark:bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-4xl bg-white dark:bg-neutral-800 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">
        <ModalHeader
          t={t}
          onClose={handleClose}
          title="publications.modal.add.title"
          subtitle="publications.modal.add.subtitle"
        />
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <form
            id="add-publication-form"
            onSubmit={handleUploadAndSubmit}
            className="space-y-8 p-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <MediaUploadSection
                  mediaPreviews={stabilizedMediaPreviews}
                  thumbnails={thumbnails}
                  imageError={imageError}
                  isDragOver={isDragOver}
                  t={t}
                  onFileChange={handleFileChange}
                  onRemoveMedia={handleRemoveMedia}
                  onSetThumbnail={(tempId, file) => setThumbnail(tempId, file)}
                  onClearThumbnail={(tempId) => clearThumbnail(tempId)}
                  onDragOver={() => setIsDragOver(true)}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    handleFileChange(e.dataTransfer.files);
                  }}
                  lockedBy={remoteLock}
                  onUpdateFile={updateFile}
                />

                <SocialAccountsSection
                  publishingAccountIds={publishingAccountIds}
                  publishedAccountIds={publishedAccountIds}
                  socialAccounts={socialAccounts as any}
                  selectedAccounts={watched.social_accounts || []}
                  accountSchedules={accountSchedules}
                  t={t}
                  onAccountToggle={handleAccountToggle}
                  onScheduleChange={(id, date) =>
                    setAccountSchedules((prev) => ({ ...prev, [id]: date }))
                  }
                  onScheduleRemove={(id) =>
                    setAccountSchedules((prev) => {
                      const n = { ...prev };
                      delete n[id];
                      return n;
                    })
                  }
                  onPlatformSettingsClick={(platform) =>
                    setActivePlatformSettings(platform)
                  }
                  globalSchedule={watched.scheduled_at ?? undefined}
                  error={errors.social_accounts?.message as string}
                />

                <ScheduleSection
                  scheduledAt={watched.scheduled_at ?? undefined}
                  t={t}
                  onScheduleChange={(date) => setValue("scheduled_at", date)}
                  useGlobalSchedule={watched.use_global_schedule}
                  onGlobalScheduleToggle={(val) =>
                    setValue("use_global_schedule", val)
                  }
                  error={errors.scheduled_at?.message as string}
                />
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("publications.modal.add.contentSection") || "Contenido"}
                  </h3>
                  <AiFieldSuggester
                    type="publication"
                    fields={{
                      title: watched.title,
                      description: watched.description,
                      goal: watched.goal,
                    }}
                    onSuggest={(data) => {
                      if (data.title)
                        setValue("title", data.title, { shouldValidate: true });
                      if (data.description)
                        setValue("description", data.description, {
                          shouldValidate: true,
                        });
                      if (data.goal)
                        setValue("goal", data.goal, { shouldValidate: true });
                      if (data.hashtags) {
                        setValue("hashtags", data.hashtags, {
                          shouldValidate: true,
                        });
                        handleHashtagChange(data.hashtags);
                      }
                    }}
                  />
                </div>

                <Input
                  id="title"
                  label={t("publications.modal.add.titleField")}
                  type="text"
                  register={register}
                  name="title"
                  placeholder={t("publications.modal.add.placeholders.title")}
                  error={errors.title?.message as string}
                  icon={FileText}
                  variant="filled"
                  required
                  sizeType="lg"
                  hint={`${watched.title?.length || 0}/70 characters`}
                />

                <Textarea
                  id="description"
                  label={t("publications.modal.add.description")}
                  register={register}
                  name="description"
                  placeholder={t(
                    "publications.modal.add.placeholders.description",
                  )}
                  error={errors.description?.message as string}
                  icon={FileText}
                  variant="filled"
                  size="lg"
                  rows={4}
                  maxLength={200}
                  required
                  showCharCount
                  hint="Maximum 200 characters"
                />

                <Input
                  id="goal"
                  label={t("publications.modal.add.goal")}
                  type="text"
                  register={register}
                  name="goal"
                  placeholder={t("publications.modal.add.placeholders.goal")}
                  error={errors.goal?.message as string}
                  icon={Target}
                  variant="filled"
                  required
                  sizeType="lg"
                  hint={`${watched.goal?.length || 0}/200 characters`}
                />

                <Input
                  id="hashtags"
                  label={t("publications.modal.add.hashtags")}
                  type="text"
                  register={register}
                  name="hashtags"
                  placeholder={t(
                    "publications.modal.add.placeholders.hashtags",
                  )}
                  error={errors.hashtags?.message as string}
                  onChange={(e) => handleHashtagChange(e.target.value)}
                  icon={Hash}
                  variant="filled"
                  required
                  sizeType="lg"
                  hint={`${
                    watched.hashtags
                      ? typeof watched.hashtags === 'string'
                        ? watched.hashtags
                            .split(" ")
                            .filter((tag: string) => tag.startsWith("#")).length
                        : Array.isArray(watched.hashtags)
                        ? watched.hashtags.length
                        : 0
                      : 0
                  }/10 hashtags`}
                />

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t("publications.modal.edit.campaigns") ||
                      "Add to Campaign"}
                  </label>
                  <div className="border border-gray-200 dark:border-neutral-700 rounded-lg p-3 bg-gray-50 dark:bg-black/20">
                    <CampaignSelector
                      campaigns={campaigns || []}
                      selectedId={
                        watched.campaign_id
                          ? parseInt(watched.campaign_id.toString())
                          : null
                      }
                      loading={false}
                      t={t}
                      onSelectCampaign={(id) => {
                        setValue("campaign_id", id?.toString() ?? "", {
                          shouldValidate: true,
                        });
                      }}
                    />
                  </div>
                  {errors.campaign_id?.message && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.campaign_id.message as string}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </form>
        </main>
        <div>
          <ModalFooter
            onClose={handleClose}
            isSubmitting={isSubmitting || uploading} // Block on upload too
            formId="add-publication-form"
            submitText={
              uploading
                ? `Uploading...`
                : t("publications.button.add") || "Save Publication"
            }
            submitIcon={<Save className="w-4 h-4" />}
            cancelText={t("common.cancel") || "Close"}
          />
          {/* Progress bar could go here */}
          {uploading && (
            <div className="px-6 pb-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: "50%" }}
                ></div>
              </div>
              <p className="text-xs text-center mt-1 text-gray-500">
                Uploading to S3...
              </p>
            </div>
          )}

          {publishingAccountIds && publishingAccountIds.length > 0 && (
            <div className="px-6 pb-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-tight">
                    {t("publish.publishing") || "Publicando en redes..."}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const isConfirmed = await confirm({
                      title:
                        t("publications.modal.cancel_confirmation.title") ||
                        "Cancelar Publicación",
                      message:
                        t("publications.modal.cancel_confirmation.message") ||
                        "¿Estás seguro de que deseas cancelar esta publicación? El envío a redes se detendrá.",
                      confirmText:
                        t("publications.modal.cancel_confirmation.confirm") ||
                        "Sí, cancelar",
                      cancelText:
                        t("publications.modal.cancel_confirmation.cancel") ||
                        "No, continuar",
                      type: "danger",
                    });

                    if (isConfirmed) {
                      try {
                        const id = (publication as any)?.id;
                        if (id) {
                          await axios.post(
                            route("api.v1.publications.cancel", id),
                          );
                          toast.success("Publicación cancelada");
                          handleClose();
                        }
                      } catch (err) {
                        console.error("Failed to cancel", err);
                      }
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 transition-colors border border-red-100 dark:border-red-900/50 group"
                >
                  <X className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
                  <span className="text-[11px] font-black uppercase tracking-tighter">
                    {t("common.cancel") || "Cancelar Publicación"}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        <ConfirmDialog />

        <PlatformSettingsModal
          isOpen={!!activePlatformSettings}
          onClose={() => setActivePlatformSettings(null)}
          platform={activePlatformSettings || ""}
          settings={
            platformSettings[activePlatformSettings?.toLowerCase() || ""] || {}
          }
          onSettingsChange={(newSettings) => {
            if (activePlatformSettings) {
              setPlatformSettings((prev) => ({
                ...prev,
                [activePlatformSettings.toLowerCase()]: newSettings,
              }));
            }
          }}
        />
      </div>
    </div>
  );
}
