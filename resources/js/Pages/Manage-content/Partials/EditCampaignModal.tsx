import ModernDatePicker from "@/Components/ui/ModernDatePicker";
import { useCampaignManagement } from "@/Hooks/useCampaignManagement";
import { useTheme } from "@/Hooks/useTheme";
import { Campaign } from "@/types/Campaign";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { format } from "date-fns";
import {
  AlertTriangle,
  Check,
  DollarSign,
  Loader2,
  Save,
  Target,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

interface EditCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign | null;
  onSubmit: (success: boolean) => void;
}

const createSchema = (t: any) =>
  z.object({
    name: z
      .string()
      .min(
        1,
        t("manageContent.modals.validation.titleRequired") || "Name is required"
      )
      .max(
        100,
        t("manageContent.modals.validation.titleLength") || "Name too long"
      ),
    description: z.string().optional(),
    goal: z.string().optional(),
    budget: z.any().optional(), // Allow string or number
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    publication_ids: z.array(z.number()).optional(),
  });

export default function EditCampaignModal({
  isOpen,
  onClose,
  campaign,
  onSubmit,
}: EditCampaignModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  // Grouping endpoint
  const { updateCampaign } = useCampaignManagement("campaigns");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availablePublications, setAvailablePublications] = useState<any[]>([]);
  const [loadingPubs, setLoadingPubs] = useState(false);

  const schema = useMemo(() => createSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const watchedFields = watch();

  // Populate form when campaign changes
  useEffect(() => {
    if (isOpen && campaign) {
      reset({
        name: campaign.name || campaign.title || "",
        description: campaign.description || "",
        goal: campaign.goal || "",
        budget: campaign.budget || "",
        start_date: campaign.start_date || "",
        end_date: campaign.end_date || "",
        // We need to extract publication IDs from the campaign object if they exist
        // Assuming campaign.publications is populated
        publication_ids: campaign.publications?.map((p: any) => p.id) || [],
      });
      fetchPublications();
    }
  }, [isOpen, campaign, reset]);

  const fetchPublications = async () => {
    setLoadingPubs(true);
    try {
      let url = "/publications?simplified=true&exclude_assigned=true";
      if (campaign?.id) {
        url += `&include_campaign_id=${campaign.id}`;
      }
      const response = await axios.get(url);
      // Handle both simplified (array) and paginated (object with data) structures
      if (response.data?.publications) {
        if (Array.isArray(response.data.publications)) {
          setAvailablePublications(response.data.publications);
        } else if (
          response.data.publications.data &&
          Array.isArray(response.data.publications.data)
        ) {
          setAvailablePublications(response.data.publications.data);
        }
      } else if (Array.isArray(response.data)) {
        // Fallback if API returns direct array
        setAvailablePublications(response.data);
      }
    } catch (error) {
      console.error("Error fetching publications:", error);
    } finally {
      setLoadingPubs(false);
    }
  };

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

      const success = await updateCampaign(campaign.id, payload);
      if (success) {
        if (onSubmit) {
          onSubmit(true);
        }
        handleClose();
      }
    } catch (error) {
      console.error("Error updating campaign:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
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

  // Styles (copied from AddCampaignModal)
  const modalBg = theme === "dark" ? "bg-neutral-800" : "bg-white";
  const modalHeaderBg = theme === "dark" ? "bg-neutral-900" : "bg-white";
  const textPrimary = theme === "dark" ? "text-gray-100" : "text-gray-900";
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-500";
  const borderColor =
    theme === "dark" ? "border-neutral-700" : "border-gray-200";
  const inputBg = theme === "dark" ? "bg-neutral-700" : "bg-white";
  const labelText = theme === "dark" ? "text-gray-300" : "text-gray-700";

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
      ></div>

      <div
        className={`relative w-full max-w-2xl ${modalBg} rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b ${borderColor} ${modalHeaderBg} flex items-center justify-between sticky top-0 z-10`}
        >
          <div>
            <h2
              className={`text-xl font-bold ${textPrimary} flex items-center gap-2`}
            >
              <Target className="w-5 h-5 text-primary-500" />
              {t("campaigns.modal.edit.title") || "Edit Campaign Group"}
            </h2>
            <p className={`${textSecondary} text-sm mt-0.5`}>
              {t("campaigns.modal.edit.subtitle") ||
                "Update your campaign details"}
            </p>
          </div>
          <button
            onClick={handleClose}
            className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${textSecondary}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            {/* Name */}
            <div className="form-group">
              <label
                className={`block text-sm font-semibold ${labelText} mb-1.5`}
              >
                {t("campaigns.modal.edit.name") || "Campaign Name"}{" "}
                <span className="text-primary-500">*</span>
              </label>
              <input
                {...register("name")}
                className={`w-full px-4 py-2.5 rounded-lg border ${borderColor} ${inputBg} focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all`}
                placeholder="e.g. Summer Sale 2024"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />{" "}
                  {errors.name.message as string}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="form-group">
              <label
                className={`block text-sm font-semibold ${labelText} mb-1.5`}
              >
                {t("campaigns.modal.edit.description") || "Description"}
              </label>
              <textarea
                {...register("description")}
                rows={3}
                className={`w-full px-4 py-2.5 rounded-lg border ${borderColor} ${inputBg} focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none`}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Goal */}
              <div className="form-group">
                <label
                  className={`block text-sm font-semibold ${labelText} mb-1.5`}
                >
                  {t("campaigns.modal.edit.goal") || "Goal"}
                </label>
                <div className="relative">
                  <Target
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textSecondary}`}
                  />
                  <input
                    {...register("goal")}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${borderColor} ${inputBg} focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all`}
                  />
                </div>
              </div>

              {/* Budget */}
              <div className="form-group">
                <label
                  className={`block text-sm font-semibold ${labelText} mb-1.5`}
                >
                  {t("campaigns.modal.edit.budget") || "Budget"}
                </label>
                <div className="relative">
                  <DollarSign
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textSecondary}`}
                  />
                  <input
                    {...register("budget")}
                    type="number"
                    step="0.01"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${borderColor} ${inputBg} focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all`}
                  />
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label
                  className={`block text-sm font-semibold ${labelText} mb-1.5`}
                >
                  {t("campaigns.modal.edit.startDate") || "Start Date"}
                </label>
                <ModernDatePicker
                  selected={
                    watch("start_date") ? new Date(watch("start_date")!) : null
                  }
                  onChange={(date: Date | null) =>
                    setValue(
                      "start_date",
                      date ? format(date, "yyyy-MM-dd") : ""
                    )
                  }
                  placeholder="Select start date"
                  withPortal
                />
              </div>
              <div className="form-group">
                <label
                  className={`block text-sm font-semibold ${labelText} mb-1.5`}
                >
                  {t("campaigns.modal.edit.endDate") || "End Date"}
                </label>
                <ModernDatePicker
                  selected={
                    watch("end_date") ? new Date(watch("end_date")!) : null
                  }
                  onChange={(date: Date | null) =>
                    setValue("end_date", date ? format(date, "yyyy-MM-dd") : "")
                  }
                  placeholder="Select end date"
                  minDate={
                    watch("start_date")
                      ? new Date(watch("start_date")!)
                      : undefined
                  }
                  withPortal
                />
              </div>
            </div>

            {/* Associate Publications */}
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
                {loadingPubs ? (
                  <div className="text-center py-4 text-sm text-gray-500">
                    Loading publications...
                  </div>
                ) : availablePublications.length === 0 ? (
                  <div className="text-center py-4 text-sm text-gray-500">
                    No publications found.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {availablePublications.map((pub) => {
                      const isSelected = (
                        watchedFields.publication_ids || []
                      ).includes(pub.id);
                      return (
                        <div
                          key={pub.id}
                          onClick={() => togglePublication(pub.id)}
                          className={`flex items-center gap-3 p-2 rounded cursor-pointer border transition-all ${
                            isSelected
                              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                              : `${borderColor} ${
                                  theme === "dark"
                                    ? "bg-neutral-800"
                                    : "bg-white"
                                } hover:border-primary-300`
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center ${
                              isSelected
                                ? "bg-primary-500 border-primary-500"
                                : "border-gray-400"
                            }`}
                          >
                            {isSelected && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          {pub.media_files?.[0] && (
                            <img
                              src={pub.media_files[0].file_path}
                              className="w-8 h-8 rounded object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${textPrimary}`}
                            >
                              {pub.title || pub.name || "Untitled"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
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
                    Saving...
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
