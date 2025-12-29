import PlatformSettingsModal from "@/Components/ConfigSocialMedia/PlatformSettingsModal";
import SocialAccountsSection from "@/Components/ManageContent/Publication/common/add/SocialAccountsSection";
import MediaUploadSection from "@/Components/ManageContent/Publication/common/edit/MediaUploadSection";
import ModalFooter from "@/Components/ManageContent/modals/common/ModalFooter";
import ModalHeader from "@/Components/ManageContent/modals/common/ModalHeader";
import PlatformPreviewModal from "@/Components/ManageContent/modals/common/PlatformPreviewModal";
import ScheduleSection from "@/Components/ManageContent/modals/common/ScheduleSection";
import Input from "@/Components/common/Modern/Input";
import Select from "@/Components/common/Modern/Select";
import Textarea from "@/Components/common/Modern/Textarea";
import { useCampaigns } from "@/Hooks/campaign/useCampaigns";
import { usePublicationForm } from "@/Hooks/publication/usePublicationForm";
import { useAccountsStore } from "@/stores/socialAccountsStore";
import { AlertTriangle, FileText, Hash, Save, Target } from "lucide-react";

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
    watched,
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
    activePlatformPreview,
    setActivePlatformPreview,
    accountSchedules,
    setAccountSchedules,
    setValue,
  } = usePublicationForm({
    onClose,
    onSubmitSuccess: onSubmit,
    isOpen,
  });

  const { register } = form;


  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center text-gray-900 dark:text-white"
    >
      <div
        className="absolute inset-0 bg-gray-900/60 dark:bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      <div
        className="relative w-full max-w-4xl bg-white dark:bg-neutral-800 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300"
      >
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
                  mediaPreviews={mediaFiles}
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
                />

                <SocialAccountsSection
                  socialAccounts={socialAccounts}
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
                  onPreviewClick={(platform) =>
                    setActivePlatformPreview(platform)
                  }
                  globalSchedule={watched.scheduled_at ?? undefined}
                  error={errors.social_accounts?.message as string}
                />

                <ScheduleSection
                  scheduledAt={watched.scheduled_at ?? undefined}
                  t={t}
                  onScheduleChange={(date) => setValue("scheduled_at", date)}
                />
              </div>

              <div className="space-y-6">
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
                    "publications.modal.add.placeholders.description"
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
                    "publications.modal.add.placeholders.hashtags"
                  )}
                  error={errors.hashtags?.message as string}
                  onChange={(e) => handleHashtagChange(e.target.value)}
                  icon={Hash}
                  variant="filled"
                  required
                  sizeType="lg"
                  hint={`${watched.hashtags
                    ? watched.hashtags
                      .split(" ")
                      .filter((tag: string) => tag.startsWith("#")).length
                    : 0
                    }/10 hashtags`}
                />

                <Select
                  id="campaign_id"
                  label={
                    t("publications.modal.edit.campaigns") || "Add to Campaign"
                  }
                  options={(campaigns || []).map((campaign: any) => ({
                    value: campaign.id.toString(),
                    label:
                      campaign.name ||
                      campaign.title ||
                      `Campaign ${campaign.id}`,
                  }))}
                  value={watched.campaign_id?.toString() ?? ""}
                  onChange={(val) => {
                    setValue("campaign_id", val.toString(), {
                      shouldValidate: true,
                    });
                  }}
                  register={register}
                  name="campaign_id"
                  placeholder={t("common.select") || "Select a campaign..."}
                  error={errors.campaign_id?.message as string}
                  icon={Target}
                  variant="filled"
                  size="lg"
                  clearable
                />
              </div>
            </div>
          </form>
        </main>
        <div>
          <ModalFooter
            onClose={handleClose}
            isSubmitting={isSubmitting}
            formId="add-publication-form"
            submitText={t("publications.button.add") || "Save Publication"}
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

        <PlatformPreviewModal
          isOpen={!!activePlatformPreview}
          onClose={() => setActivePlatformPreview(null)}
          platform={activePlatformPreview || ""}
          publication={{
            ...watched,
            media: mediaFiles.map((m) => ({
              preview: m.url,
              file_type: m.type,
            })),
          }}
          settings={
            platformSettings[activePlatformPreview?.toLowerCase() || ""] || {}
          }
        />
      </div>
    </div>
  );
}
