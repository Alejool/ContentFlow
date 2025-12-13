import Input from "@/Components/common/Modern/Input";
import Textarea from "@/Components/common/Modern/Textarea";
import ModernDatePicker from "@/Components/common/ui/ModernDatePicker";
import { useTheme } from "@/Hooks/useTheme";
import { campaignSchema } from "@/schemas/campaign";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { format } from "date-fns";
import {
  AlertTriangle,
  Check,
  DollarSign,
  FileText,
  Plus,
  Target,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useCampaignStore } from "@/stores/campaignStore";
import toast from "react-hot-toast";

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
  const [availablePublications, setAvailablePublications] = useState<any[]>([]);
  const [loadingPubs, setLoadingPubs] = useState(false);

  const schema = useMemo(() => campaignSchema(t), [t]);

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

  useEffect(() => {
    if (isOpen) {
      fetchPublications();
    }
  }, [isOpen]);

  const fetchPublications = async () => {
    setLoadingPubs(true);
    try {
      // Fetch publications to associate
      const response = await axios.get(
        "/publications?simplified=true&exclude_assigned=true"
      );
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
          t("campaigns.messages.success") ||
          "Campaign created successfully"
        );
        if (onSubmit) {
          onSubmit(true);
        }
      }
    } catch (error) {
      console.error("Error submitting campaign:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setIsSubmitting(false);
    onClose();
  };

  const modalBg = theme === "dark" ? "bg-neutral-800" : "bg-white";
  const modalHeaderBg = theme === "dark" ? "bg-neutral-900" : "bg-white";
  const textPrimary = theme === "dark" ? "text-gray-100" : "text-gray-900";
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-500";
  const borderColor =
    theme === "dark" ? "border-neutral-700" : "border-gray-200";
  const inputBg = theme === "dark" ? "bg-neutral-700" : "bg-white";
  const labelText = theme === "dark" ? "text-gray-300" : "text-gray-700";

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

  // Helper to get thumbnail for Publication
  const getThumbnail = (pub: any) => {
    if (!pub.media_files || pub.media_files.length === 0) return null;

    // First, try to find an image
    const firstImage = pub.media_files.find((f: any) =>
      f.file_type.includes("image")
    );
    if (firstImage) {
      const url = firstImage.file_path.startsWith("http")
        ? firstImage.file_path
        : `/storage/${firstImage.file_path}`;
      return { url, type: "image" };
    }

    // If no images, check if there's a video and return video indicator
    const hasVideo = pub.media_files.some((f: any) =>
      f.file_type.includes("video")
    );
    if (hasVideo) {
      return { url: null, type: "video" };
    }

    return null;
  };

  if (!isOpen) return null;

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
        <div
          className={`px-6 py-4 border-b ${borderColor} ${modalHeaderBg} flex items-center justify-between sticky top-0 z-10`}
        >
          <div>
            <h2
              className={`text-xl font-bold ${textPrimary} flex items-center gap-2`}
            >
              <Target className="w-5 h-5 text-primary-500" />
              {t("campaigns.modal.add.title") || "New Campaign Group"}
            </h2>
            <p className={`${textSecondary} text-sm mt-0.5`}>
              {t("campaigns.modal.add.subtitle") ||
                "Group your publications together"}
            </p>
          </div>
          <button
            onClick={handleClose}
            className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${textSecondary}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
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
                required
              />
            </div>

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
                  hint={`${watchedFields.budget || 0}/200 characters`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <ModernDatePicker
                  register={register}
                  name="start_date"
                  error={errors.start_date?.message as string}
                  label={t("campaigns.modal.add.startDate") || "Start Date"}
                  selected={
                    watch("start_date") ? new Date(watch("start_date")!) : null
                  }
                  onChange={(date: Date | null) =>
                    setValue(
                      "start_date",
                      date ? format(date, "yyyy-MM-dd") : "",
                      { shouldValidate: true }
                    )
                  }
                  placeholder={
                    t("campaigns.modal.add.placeholders.startDate") ||
                    "Select start date"
                  }
                  withPortal
                />
        
              </div>
              <div className="form-group">
                <ModernDatePicker
                  register={register}
                  name="end_date"
                  error={errors.end_date?.message as string}
                  label={t("campaigns.modal.add.endDate") || "End Date"}
                  selected={
                    watch("end_date") ? new Date(watch("end_date")!) : null
                  }
                  onChange={(date: Date | null) =>
                    setValue(
                      "end_date",
                      date ? format(date, "yyyy-MM-dd") : "",
                      { shouldValidate: true }
                    )
                  }
                  placeholder={
                    t("campaigns.modal.add.placeholders.endDate") || "End Date"
                  }
                  minDate={
                    watch("start_date")
                      ? new Date(watch("start_date")!)
                      : undefined
                  }
                  withPortal
                />
              </div>
            </div>

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
                {loadingPubs ? (
                  <div className="text-center py-4 text-sm text-gray-500">
                    Loading publications...
                  </div>
                ) : availablePublications.length === 0 ? (
                  <div className="text-center py-4 text-sm text-gray-500">
                    No publications found. Create some first!
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
                          {(() => {
                            const thumbnail = getThumbnail(pub);
                            if (!thumbnail) return null;
                            if (thumbnail.type === "image" && thumbnail.url) {
                              return (
                                <img
                                  src={thumbnail.url}
                                  className="w-8 h-8 rounded object-cover"
                                  alt="Thumbnail"
                                />
                              );
                            }
                            // Video icon
                            return (
                              <div className="w-8 h-8 rounded bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                                <svg
                                  className="w-4 h-4 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                </svg>
                              </div>
                            );
                          })()}
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
              <p className={`text-xs mt-1.5 ${textSecondary}`}>
                {t("campaigns.modal.add.associatedPublicationsRequired") ||
                  "Associated Publications is required"}
              </p>
            </div>

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
