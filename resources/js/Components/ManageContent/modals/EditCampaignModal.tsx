import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/Hooks/useTheme";
import { useCampaignManagement } from "@/Hooks/useCampaignManagement";
import { Campaign } from "@/types/Campaign";
import { Save, Target, X, Loader2, AlertTriangle } from "lucide-react";

// Componentes reutilizables
import ModalHeader from "@/Components/ManageContent/modals/common/ModalHeader";
import CampaignFormFields from "@/Components/ManageContent/Campaign/common/CampaignFormFields";
import CampaignDateFields from "@/Components/ManageContent/Campaign/common/CampaignDateFields";
import PublicationSelector from "@/Components/ManageContent/Campaign/common/PublicationSelector";

// Hooks
import { useEditCampaignForm } from "@/Hooks/campaign/useEditCampaignForm";
import { usePublicationsForCampaignEdit } from "@/Hooks/campaign/usePublicationsForCampaignEdit";  

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
  const { theme } = useTheme();
  const { updateCampaign } = useCampaignManagement();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, errors } =
    useEditCampaignForm(t, campaign);

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
        budget: campaign.budget || "",
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
        toast.success(
          t("campaigns.messages.updateSuccess") ||
            "Campaign updated successfully"
        );
        if (onSubmit) {
          onSubmit(true);
        }
        handleClose();
      } else {
        toast.error(
          t("campaigns.messages.updateError") || "Failed to update campaign"
        );
      }
    } catch (error) {
      console.error("Error updating campaign:", error);
      toast.error(
        t("campaigns.messages.updateError") || "Failed to update campaign"
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
        current.filter((pid: number) => pid !== id)
      );
    } else {
      setValue("publication_ids", [...current, id]);
    }
  };

  if (!isOpen || !campaign) return null;

  // Estilos
  const modalBg = theme === "dark" ? "bg-neutral-800" : "bg-white";
  const borderColor =
    theme === "dark" ? "border-neutral-700" : "border-gray-200";
  const labelText = theme === "dark" ? "text-gray-300" : "text-gray-700";
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-500";

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
        onClick={handleClose}
      />

      <div
        className={`relative w-full max-w-2xl ${modalBg} rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300`}
      >
        <ModalHeader
          theme={theme}
          t={t}
          onClose={handleClose}
          title="campaigns.modal.edit.title"
          subtitle="campaigns.modal.edit.subtitle"
          icon={Target}
          iconColor="text-primary-500"
          size="xl"
        />

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            {/* Campos del formulario */}
            <CampaignFormFields
              register={register}
              errors={errors}
              watched={watchedFields}
              theme={theme}
              t={t}
              mode="edit"
            />

            {/* Fechas */}
            <CampaignDateFields
              startDate={watchedFields.start_date}
              endDate={watchedFields.end_date}
              errors={errors}
              setValue={setValue}
              watch={watch}
              theme={theme}
              t={t}
            />

            {/* Mensaje de error para fecha fin */}
            {errors.end_date && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.end_date.message as string}
                </p>
              </div>
            )}

            {/* Selección de Publicaciones */}
            <div className="form-group">
              <label
                className={`block text-sm font-semibold ${labelText} mb-2`}
              >
                {t("campaigns.modal.edit.associatedPublications") ||
                  "Associated Publications"}
              </label>

              <div
                className={`border ${borderColor} rounded-lg max-h-48 overflow-y-auto p-2 ${
                  theme === "dark" ? "bg-black/20" : "bg-gray-50"
                }`}
              >
                <PublicationSelector
                  publications={availablePublications}
                  selectedIds={watchedFields.publication_ids || []}
                  loading={loadingPubs}
                  theme={theme}
                  t={t}
                  getThumbnail={getThumbnail}
                  onTogglePublication={togglePublication}
                />
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-neutral-700">
              <button
                type="button"
                onClick={handleClose}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  theme === "dark"
                    ? "text-gray-300 hover:bg-neutral-800"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {t("common.cancel") || "Cancel"}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("common.saving") || "Saving..."}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {t("common.save") || "Save Changes"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
