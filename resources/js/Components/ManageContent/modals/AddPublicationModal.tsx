import AiFieldSuggester from "@/Components/AiAssistant/AiFieldSuggester";
import AiPromptSection from "@/Components/AiAssistant/AiPromptSection";
import PlatformSettingsModal from "@/Components/ConfigSocialMedia/PlatformSettingsModal";
import CampaignSelector from "@/Components/ManageContent/Publication/common/CampaignSelector";
import SocialAccountsSection from "@/Components/ManageContent/Publication/common/add/SocialAccountsSection";
import MediaUploadSection from "@/Components/ManageContent/Publication/common/edit/MediaUploadSection";
import ModalFooter from "@/Components/ManageContent/modals/common/ModalFooter";
import ModalHeader from "@/Components/ManageContent/modals/common/ModalHeader";
import ScheduleSection from "@/Components/ManageContent/modals/common/ScheduleSection";
import Input from "@/Components/common/Modern/Input";
import Textarea from "@/Components/common/Modern/Textarea";
import { useCampaigns } from "@/Hooks/campaign/useCampaigns";
import { usePublicationForm } from "@/Hooks/publication/usePublicationForm";
import { useAccountsStore } from "@/stores/socialAccountsStore";
import { FileText, Hash, Save, Target } from "lucide-react";
import { useMemo } from "react";
import { useWatch } from "react-hook-form";

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
    isS3Uploading,
    isAnyMediaProcessing,
    uploadProgress,
    uploadStats,
    uploadErrors,
    uploadFile,
  } = usePublicationForm({
    onClose,
    onSubmitSuccess: onSubmit,
    isOpen,
  });

  const { register } = form; // Keep existing destructuring

  // Use individual watchers to prevent unnecessary re-renders
  const selectedSocialAccounts =
    useWatch({ control, name: "social_accounts" }) || [];
  const scheduledAt = useWatch({ control, name: "scheduled_at" });
  const useGlobalSchedule = useWatch({ control, name: "use_global_schedule" });
  const title = useWatch({ control, name: "title" });
  const goal = useWatch({ control, name: "goal" });
  const hashtags = useWatch({ control, name: "hashtags" });
  const campaign_id = useWatch({ control, name: "campaign_id" });

  const watched = useMemo(
    () => ({
      social_accounts: selectedSocialAccounts,
      scheduled_at: scheduledAt,
      use_global_schedule: useGlobalSchedule,
      title,
      goal,
      hashtags,
      campaign_id,
    }),
    [
      selectedSocialAccounts,
      scheduledAt,
      useGlobalSchedule,
      title,
      goal,
      hashtags,
      campaign_id,
    ],
  );

  const handleAiSuggestion = (data: any) => {
    if (data.title)
      setValue("title", data.title, {
        shouldValidate: true,
        shouldDirty: true,
      });
    if (data.description)
      setValue("description", data.description, {
        shouldValidate: true,
        shouldDirty: true,
      });
    if (data.goal)
      setValue("goal", data.goal, { shouldValidate: true, shouldDirty: true });
    if (data.hashtags) {
      setValue("hashtags", data.hashtags, {
        shouldValidate: true,
        shouldDirty: true,
      });
      handleHashtagChange(data.hashtags);
    }
  };

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
            onSubmit={handleSubmit}
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
                  isAnyMediaProcessing={isAnyMediaProcessing}
                  uploadProgress={uploadProgress}
                  uploadStats={uploadStats}
                  uploadErrors={uploadErrors}
                  lockedBy={remoteLock}
                />

                <SocialAccountsSection
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
                <AiPromptSection
                  type="publication"
                  currentFields={watched}
                  onSuggest={handleAiSuggestion}
                />
                <div className="flex justify-between items-end px-1">
                  <AiFieldSuggester
                    fields={watched}
                    type="publication"
                    onSuggest={handleAiSuggestion}
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
                      ? watched.hashtags
                          .split(" ")
                          .filter((tag: string) => tag.startsWith("#")).length
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
            isSubmitting={isSubmitting} // REMOVED isS3Uploading: Allow saving while uploading
            formId="add-publication-form"
            submitText={
              isS3Uploading
                ? t("publications.modal.button.saveBackground", {
                    defaultValue: "Save & Background Upload",
                  })
                : t("publications.button.add") || "Save Publication"
            }
            submitIcon={<Save className="w-4 h-4" />}
            cancelText={t("common.cancel") || "Close"}
          />
        </div>

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
