import { useContentManagement } from "@/Hooks/useContentManagement";
import { Campaign } from "@/types/Campaign";
import { AlertTriangle, Target } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import CampaignDateFields from "@/Components/Content/Campaign/common/CampaignDateFields";
import CampaignFormFields from "@/Components/Content/Campaign/common/CampaignFormFields";
import PublicationSelector from "@/Components/Content/Campaign/common/PublicationSelector";
import ModalHeader from "@/Components/Content/modals/common/ModalHeader";

import { useEditCampaignForm } from "@/Hooks/campaign/useEditCampaignForm";
import { usePublicationsForCampaignEdit } from "@/Hooks/campaign/usePublicationsForCampaignEdit";
import { useModalFocusTrap } from "@/Hooks/useModalFocusTrap";
import { usePage } from "@inertiajs/react";
import ModalFooter from "./common/ModalFooter";

interface EditCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign | null;
  onSubmit: (success: boolean) => void;
}

export default function EditCampaignModal({
  isOpen,
  onClose,
  campaign,
  onSubmit,
}: EditCampaignModalProps) {
  const { t } = useTranslation();
  const { updateItem: updateCampaign } = useContentManagement();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { auth } = usePage<any>().props;
  const canManage = auth.current_workspace?.permissions?.includes("manage-content");
  const isDisabled = !canManage;

  // Integrate focus trap for modal accessibility
  // Requirements: 5.5
  const modalRef = useModalFocusTrap(isOpen);

  const { register, handleSubmit, setValue, watch, reset, errors } = useEditCampaignForm(
    t,
    campaign,
  );

  const {
    availablePublications,
    loading: loadingPubs,
    getThumbnail,
  } = usePublicationsForCampaignEdit(isOpen, campaign?.id);

  const watchedFields = watch();

  useEffect(() => {
    if (isOpen && campaign) {
      reset({
        name: campaign.name || campaign.title || "",
        description: campaign.description || "",
        goal: campaign.goal || "",
        budget: campaign.budget ? campaign.budget.toString() : "",
        start_date: campaign.start_date || "",
        end_date: campaign.end_date || "",
        publication_ids: campaign.publications?.map((p: any) => p.id) || [],
      });
    }
  }, [isOpen, campaign, reset]);

  const onFormSubmit = async (data: any) => {
    if (!campaign) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name,
        description: data.description,
        goal: data.goal,
        budget: data.budget ? parseFloat(data.budget) : null,
        start_date: data.start_date,
        end_date: data.end_date,
        publication_ids: data.publication_ids || [],
      };

      const success = await updateCampaign(campaign.id, payload, "campaigns");
      if (success) {
        toast.success(t("campaigns.messages.updateSuccess") || "Campaign updated successfully");
        if (onSubmit) {
          onSubmit(true);
        }
        handleClose();
      } else {
        toast.error(t("campaigns.messages.updateError") || "Failed to update campaign");
      }
    } catch (error) {
      toast.error(t("campaigns.messages.updateError") || "Failed to update campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setIsSubmitting(false);
    onClose();
  };

  const togglePublication = (id: number) => {
    const current = watchedFields.publication_ids || [];
    if (current.includes(id)) {
      setValue(
        "publication_ids",
        current.filter((pid: number) => pid !== id),
      );
    } else {
      setValue("publication_ids", [...current, id]);
    }
  };

  if (!isOpen || !campaign) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 text-gray-900 dark:text-white sm:p-6">
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm dark:bg-black/70"
        onClick={handleClose}
      />

      <div
        ref={modalRef as React.RefObject<HTMLDivElement>}
        className="animate-in fade-in zoom-in relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-gray-200/50 bg-gradient-to-br from-white to-gray-50 shadow-2xl duration-300 dark:border-neutral-800/50 dark:from-neutral-900 dark:to-neutral-950"
      >
        <ModalHeader
          t={t}
          onClose={handleClose}
          title={canManage ? "campaigns.modal.edit.title" : "campaigns.modal.view.title"}
          subtitle={canManage ? "campaigns.modal.edit.subtitle" : "campaigns.modal.view.subtitle"}
          icon={Target}
          iconColor="text-primary-500"
          size="xl"
        />

        <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
          <form id="edit-campaign-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            <CampaignFormFields
              register={register}
              setValue={setValue}
              errors={errors}
              watched={watchedFields}
              t={t}
              mode="edit"
              disabled={isDisabled}
              showAiPrompt={false}
            />

            <CampaignDateFields
              startDate={watchedFields.start_date}
              endDate={watchedFields.end_date}
              errors={errors}
              setValue={setValue}
              watch={watch}
              t={t}
              disabled={isDisabled}
            />

            {errors.end_date && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                <p className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-4 w-4" />
                  {errors.end_date.message as string}
                </p>
              </div>
            )}

            <div className="form-group">
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t("campaigns.modal.edit.associatedPublications")}
              </label>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-neutral-700 dark:bg-black/20">
                <PublicationSelector
                  publications={availablePublications}
                  selectedIds={watchedFields.publication_ids || []}
                  loading={loadingPubs}
                  t={t}
                  getThumbnail={getThumbnail}
                  onTogglePublication={togglePublication}
                  disabled={isDisabled}
                  maxHeight="max-h-48"
                />
              </div>
            </div>
          </form>
        </div>
        <ModalFooter
          onClose={handleClose}
          submitText={t("campaigns.button.edit")}
          cancelText={t("common.cancel")}
          formId="edit-campaign-form"
          hideSubmit={!canManage}
          isSubmitting={isSubmitting || isDisabled}
        />
      </div>
    </div>
  );
}
