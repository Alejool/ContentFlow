import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { PublicationTemplate } from "@/types/onboarding";
import { Search, X } from "lucide-react";
import TemplateCard from "./TemplateCard";
import { useTemplateIntegration } from "@/Hooks/onboarding/useTemplateIntegration";
import EmptyState from "@/Components/common/EmptyState";
import { getEmptyStateByKey } from "@/Utils/emptyStateMapper";
import { useEffect } from "react";

interface TemplateGalleryProps {
  templates: PublicationTemplate[];
  onSelect?: (templateId: string) => void;
  onSkip: () => void;
}

/**
 * TemplateGallery displays publication templates for quick start.
 *
 * Features:
 * - Grid layout with template cards
 * - Category filtering
 * - Search functionality
 * - Responsive grid (1-3 columns based on viewport)
 */
export default function TemplateGallery({ templates, onSelect, onSkip }: TemplateGalleryProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isSkipping, setIsSkipping] = useState(false);
  const { applyTemplate } = useTemplateIntegration();

  const handleTemplateSelect = async (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    try {
      // If custom onSelect handler provided, use it
      if (onSelect) {
        await onSelect(templateId);
      } else {
        // Otherwise, use default integration to navigate to publication editor
        await applyTemplate(template, () => {
          // Template applied successfully, close gallery
          onSkip();
        });
      }
    } catch (error) {}
  };

  // Extract unique categories from templates
  const categories = useMemo(() => {
    const uniqueCategories = new Set(templates.map((t) => t.category));
    return ["all", ...Array.from(uniqueCategories)];
  }, [templates]);

  // Filter templates based on search and category
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch =
        searchQuery === "" ||
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [templates, searchQuery, selectedCategory]);

  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      await onSkip();
    } catch (error) {
    } finally {
      setIsSkipping(false);
    }
  };

  // Keyboard navigation (Requirement 7.5, 7.6)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleSkip();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 backdrop-blur-sm md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-gallery-title"
      aria-describedby="template-gallery-description"
    >
      <div className="flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-neutral-800 md:max-h-[90vh]">
        {/* Header - Responsive layout (Requirement 7.1, 7.2) */}
        <div className="flex items-start justify-between gap-2 border-b border-gray-200 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800 md:items-center md:gap-4 md:px-6 md:py-4">
          <div className="min-w-0 flex-1">
            <h2
              id="template-gallery-title"
              className="truncate text-xl font-bold text-gray-900 dark:text-white md:text-2xl"
            >
              {t("templates.title")}
            </h2>
            <p
              id="template-gallery-description"
              className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400 md:text-sm"
            >
              {t("templates.description")}
            </p>
          </div>
          <button
            onClick={handleSkip}
            disabled={isSkipping}
            className="flex min-h-[44px] min-w-[44px] flex-shrink-0 items-center justify-center rounded-md p-2 text-gray-400 transition-colors hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:hover:text-gray-300"
            aria-label={t("templates.close")}
          >
            <X className="h-5 w-5 md:h-6 md:w-6" />
          </button>
        </div>

        {/* Search and Filter Bar - Responsive layout (Requirement 7.1) */}
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900 md:px-6 md:py-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Search Input */}
            <div className="relative flex-1">
              <label htmlFor="template-search" className="sr-only">
                {t("templates.search")}
              </label>
              <Search
                className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
              <input
                id="template-search"
                type="text"
                placeholder={t("templates.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-gray-900 placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
                aria-label={t("templates.searchByName")}
              />
            </div>

            {/* Category Filter - Horizontal scroll on mobile */}
            <div
              className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-600 flex gap-2 overflow-x-auto pb-2 sm:pb-0"
              role="group"
              aria-label={t("templates.filterByCategory")}
            >
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`min-h-[44px] whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 md:px-4 md:text-base ${
                    selectedCategory === category
                      ? "bg-primary-600 text-white"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700"
                  }`}
                  aria-pressed={selectedCategory === category}
                  aria-label={t("templates.filterBy", { category })}
                >
                  {t(
                    `onboarding.templates.categories.${category}`,
                    category.charAt(0).toUpperCase() + category.slice(1),
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Template Grid - Responsive columns (Requirement 7.1, 7.2) */}
        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
          {filteredTemplates.length > 0 ? (
            <div
              className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3"
              role="list"
              aria-label={t("templates.list")}
            >
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={handleTemplateSelect}
                />
              ))}
            </div>
          ) : (
            <EmptyState config={getEmptyStateByKey("searchResults", t)!} />
          )}
        </div>

        {/* Footer - Responsive layout (Requirement 7.1) */}
        <div className="flex flex-col items-center justify-between gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900 md:flex-row md:gap-0 md:px-6 md:py-4">
          <p
            className="text-center text-xs text-gray-500 dark:text-gray-400 md:text-left md:text-sm"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {t("templates.available", {
              count: filteredTemplates.length,
              templateText:
                filteredTemplates.length === 1 ? t("templates.template") : t("templates.templates"),
            })}
          </p>
          <button
            onClick={handleSkip}
            disabled={isSkipping}
            className="min-h-[44px] w-full rounded-lg px-6 py-2 font-medium text-gray-600 transition-colors hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:text-white md:w-auto"
            aria-label={t("templates.skipAndCreate")}
          >
            {isSkipping ? t("templates.skipping") : t("templates.skip")}
          </button>
        </div>
      </div>
    </div>
  );
}
