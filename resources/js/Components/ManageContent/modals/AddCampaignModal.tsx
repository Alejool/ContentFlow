import { useCampaignStore } from "@/stores/campaignStore";
import axios from "axios";
import { Target } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

import AiFieldSuggester from "@/Components/AiAssistant/AiFieldSuggester";
import AiPromptSection from "@/Components/AiAssistant/AiPromptSection";
import ModalHeader from "@/Components/ManageContent/modals/common/ModalHeader";
import Input from "@/Components/common/Modern/Input";
import Textarea from "@/Components/common/Modern/Textarea";

import CampaignDateFields from "@/Components/ManageContent/Campaign/common/CampaignDateFields";
import PublicationSelector from "@/Components/ManageContent/Campaign/common/PublicationSelector";

import { useAddCampaignForm } from "@/Hooks/campaign/useAddCampaignForm";
import { useModalFocusTrap } from "@/Hooks/useModalFocusTrap";
import { usePublicationsForCampaign } from "@/Hooks/campaign/usePublicationsForCampaign";

import { DollarSign, FileText } from "lucide-react";
import ModalFooter from "./common/ModalFooter";

interface AddCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function AddCampaignModal({
  isOpen,
  onClose,
  onSubmit,
}: AddCampaignModalProps) {
  const { t } = useTranslation();
  const { addCampaign } = useCampaignStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Integrate focus trap for modal accessibility
  // Requirements: 5.5
  const modalRef = useModalFocusTrap(isOpen);

  const { register, handleSubmit, setValue, watch, reset, errors } =
    useAddCampaignForm(t);

  const {
    availablePublications,
    loading: loadingPubs,
    getThumbnail,
  } = usePublicationsForCampaign(isOpen);

  const watchedFields = watch();

  const handleAiSuggestion = (data: any) => {
    if (data.name || data.title) {
      setValue("name", data.name || data.title, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    if (data.description) {
      setValue("description", data.description, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    if (data.goal) {
      setValue("goal", data.goal, { shouldValidate: true, shouldDirty: true });
    }
    if (data.budget !== undefined) {
      setValue("budget", data.budget.toString(), {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    if (data.start_date) {
      setValue("start_date", data.start_date, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    if (data.end_date) {
      setValue("end_date", data.end_date, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  const onFormSubmit = async (data: any) => {
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

      const response = await axios.post(`/api/v1/campaigns`, payload);

      if (response.data && response.data.campaign) {
        addCampaign(response.data.campaign);
        handleClose();
        toast.success(
          t("campaigns.messages.success") || "Campaign created successfully",
        );
        if (onSubmit) {
          onSubmit(true);
        }
      }
    } catch (error: any) {
      console.error("Error submitting campaign:", error);
      toast.error(
        error.response?.data?.message || t("campaigns.messages.error"),
      );
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 text-gray-900 dark:text-white">
      <div
        className="absolute inset-0 bg-gray-900/60 dark:bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div 
        ref={modalRef as React.RefObject<HTMLDivElement>}
        className="relative w-full max-w-2xl bg-white dark:bg-neutral-800 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300"
      >
        <ModalHeader
          t={t}
          onClose={handleClose}
          title="campaigns.modal.add.title"
          subtitle="campaigns.modal.add.subtitle"
          icon={Target}
          iconColor="text-primary-500"
          size="xl"
        />

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <AiPromptSection
            type="campaign"
            currentFields={watchedFields}
            onSuggest={handleAiSuggestion}
            disabled={isSubmitting}
          />
          <form
            id="campaign-form"
            onSubmit={handleSubmit(onFormSubmit)}
            className="space-y-6"
          >
            <div className="flex justify-between items-end mb-4 px-1">
              <AiFieldSuggester
                fields={watchedFields}
                type="campaign"
                onSuggest={handleAiSuggestion}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <Input
                id="manage-add-campaign-name"
                label={t("campaigns.modal.add.name") || "Campaign Name"}
                register={register}
                name="name"
                required
                placeholder={
                  t("campaigns.modal.add.placeholders.name") ||
                  "e.g. Summer Sale 2024"
                }
                sizeType="lg"
                variant="filled"
                error={errors.name?.message as string}
              />
            </div>

            <div className="form-group">
              <Textarea
                id="manage-add-campaign-description"
                label={t("campaigns.modal.add.description")}
                register={register}
                name="description"
                placeholder={t("campaigns.modal.add.placeholders.description")}
                error={errors.description?.message as string}
                icon={FileText}
                variant="filled"
                rows={4}
                maxLength={200}
                showCharCount
                hint={
                  t("campaigns.modal.add.placeholders.description_hint") ||
                  "Maximum 200 characters"
                }
                size="lg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <Input
                  id="goal"
                  label={t("campaigns.modal.add.goal")}
                  type="text"
                  register={register}
                  name="goal"
                  placeholder={t("campaigns.modal.add.placeholders.goal")}
                  error={errors.goal?.message as string}
                  icon={Target}
                  variant="filled"
                  sizeType="lg"
                  hint={`${watchedFields.goal?.length || 0}/200 characters`}
                />
              </div>

              <div className="form-group">
                <Input
                  id="budget"
                  label={t("campaigns.modal.add.budget")}
                  type="number"
                  register={register}
                  name="budget"
                  placeholder={t("campaigns.modal.add.placeholders.budget")}
                  error={errors.budget?.message as string}
                  icon={DollarSign}
                  variant="filled"
                  sizeType="lg"
                />
              </div>
            </div>

            <CampaignDateFields
              startDate={watchedFields.start_date}
              endDate={watchedFields.end_date}
              errors={errors}
              setValue={setValue}
              watch={watch}
              t={t}
            />

            <div className="form-group">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t("campaigns.modal.add.publications") || "Publications"}
              </label>

              <div className="border border-gray-200 dark:border-neutral-700 rounded-lg p-2 bg-gray-50 dark:bg-black/20">
                <PublicationSelector
                  publications={availablePublications}
                  selectedIds={watchedFields.publication_ids || []}
                  loading={loadingPubs}
                  t={t}
                  getThumbnail={getThumbnail}
                  onTogglePublication={togglePublication}
                  maxHeight="max-h-48"
                />
              </div>

              <p className="text-xs mt-1.5 text-gray-500 dark:text-gray-400">
                {t("campaigns.modal.add.associatedPublicationsRequired") ||
                  "Associated Publications is required"}
              </p>
            </div>
          </form>
        </div>
        <ModalFooter
          onClose={handleClose}
          submitText={t("campaigns.button.add")}
          cancelText={t("common.cancel")}
          formId="campaign-form"
        />
      </div>
    </div>
  );
}
