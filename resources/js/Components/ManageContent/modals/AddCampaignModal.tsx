import React, { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/Hooks/useTheme";
import { useCampaignStore } from "@/stores/campaignStore";
import { Plus, Target, X } from "lucide-react";

// Componentes reutilizables
import ModalHeader from "@/Components/ManageContent/modals/common/ModalHeader";
import Input from "@/Components/common/Modern/Input";
import Textarea from "@/Components/common/Modern/Textarea";

// Componentes específicos para campaña
import PublicationSelector from "@/Components/ManageContent/Campaign/common/PublicationSelector";
import CampaignDateFields from "@/Components/ManageContent/Campaign/common/CampaignDateFields";

// Hooks
import { useAddCampaignForm } from "@/Hooks/campaign/useAddCampaignForm";
import { usePublicationsForCampaign } from "@/Hooks/campaign/usePublicationsForCampaign";

// Iconos
import { DollarSign, FileText } from "lucide-react";

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
  const { theme } = useTheme();
  const { addCampaign } = useCampaignStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, errors } =
    useAddCampaignForm(t);

  const {
    availablePublications,
    loading: loadingPubs,
    getThumbnail,
  } = usePublicationsForCampaign(isOpen);

  const watchedFields = watch();

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

      const response = await axios.post(`/campaigns`, payload);

      if (response.data && response.data.campaign) {
        addCampaign(response.data.campaign);
        handleClose();
        toast.success(
          t("campaigns.messages.success") || "Campaign created successfully"
        );
        if (onSubmit) {
          onSubmit(true);
        }
      }
    } catch (error: any) {
      console.error("Error submitting campaign:", error);
      toast.error(
        error.response?.data?.message || t("campaigns.messages.error")
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

  if (!isOpen) return null;

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
          title="campaigns.modal.add.title"
          subtitle="campaigns.modal.add.subtitle"
          icon={Target}
          iconColor="text-primary-500"
          size="xl"
        />

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            {/* Nombre de la campaña */}
            <div className="form-group">
              <Input
                id="name"
                label={t("campaigns.modal.add.name") || "Campaign Name"}
                register={register}
                name="name"
                required
                placeholder={
                  t("campaigns.modal.add.placeholders.name") ||
                  "e.g. Summer Sale 2024"
                }
                error={errors.name?.message as string}
              />
            </div>

            {/* Descripción */}
            <div className="form-group">
              <Textarea
                id="description"
                label={t("campaigns.modal.add.description")}
                register={register}
                name="description"
                placeholder={t("campaigns.modal.add.placeholders.description")}
                error={errors.description?.message as string}
                icon={FileText}
                theme={theme}
                variant="filled"
                rows={4}
                maxLength={200}
                showCharCount
                hint="Maximum 200 characters"
              />
            </div>

            {/* Objetivo y Presupuesto */}
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
                  theme={theme}
                  variant="outlined"
                  size="md"
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
                  theme={theme}
                  variant="outlined"
                  size="md"
                />
              </div>
            </div>

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

            {/* Selección de Publicaciones */}
            <div className="form-group">
              <label
                className={`block text-sm font-semibold ${labelText} mb-2`}
              >
                {t("campaigns.modal.add.publications") || "Publications"}
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

              <p className={`text-xs mt-1.5 ${textSecondary}`}>
                {t("campaigns.modal.add.associatedPublicationsRequired") ||
                  "Associated Publications is required"}
              </p>
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
                  <>Processing...</>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    {t("campaigns.button.addCampaign") || "Create Campaign"}
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
