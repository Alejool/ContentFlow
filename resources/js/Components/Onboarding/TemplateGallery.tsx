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
export default function TemplateGallery({
  templates,
  onSelect,
  onSkip,
}: TemplateGalleryProps) {
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
    } catch (error) {
      console.error("Failed to select template:", error);
    }
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

      const matchesCategory =
        selectedCategory === "all" || template.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [templates, searchQuery, selectedCategory]);

  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      await onSkip();
    } catch (error) {
      console.error("Failed to skip template selection:", error);
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4" role="dialog" aria-modal="true" aria-labelledby="template-gallery-title" aria-describedby="template-gallery-description">
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header - Responsive layout (Requirement 7.1, 7.2) */}
        <div className="bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 px-4 md:px-6 py-3 md:py-4 flex items-start md:items-center justify-between gap-2 md:gap-4">
          <div className="flex-1 min-w-0">
            <h2 id="template-gallery-title" className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">
              {t('templates.title')}
            </h2>
            <p id="template-gallery-description" className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {t('templates.description')}
            </p>
          </div>
          <button
            onClick={handleSkip}
            disabled={isSkipping}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-md"
            aria-label={t('templates.close')}
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        {/* Search and Filter Bar - Responsive layout (Requirement 7.1) */}
        <div className="bg-gray-50 dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-700 px-4 md:px-6 py-3 md:py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <label htmlFor="template-search" className="sr-only">{t('templates.search')}</label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
              <input
                id="template-search"
                type="text"
                placeholder={t('templates.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                aria-label={t('templates.searchByName')}
              />
            </div>

            {/* Category Filter - Horizontal scroll on mobile */}
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-600" role="group" aria-label={t('templates.filterByCategory')}>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 md:px-4 py-2 min-h-[44px] rounded-lg text-sm md:text-base font-medium whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    selectedCategory === category
                      ? "bg-primary-600 text-white"
                      : "bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 border border-gray-300 dark:border-neutral-600"
                  }`}
                  aria-pressed={selectedCategory === category}
                  aria-label={t('templates.filterBy', { category })}
                >
                  {t(`onboarding.templates.categories.${category}`, category.charAt(0).toUpperCase() + category.slice(1))}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Template Grid - Responsive columns (Requirement 7.1, 7.2) */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6">
          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6" role="list" aria-label={t('templates.list')}>
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={handleTemplateSelect}
                />
              ))}
            </div>
          ) : (
            <EmptyState config={getEmptyStateByKey('searchResults', t)!} />
          )}
        </div>

        {/* Footer - Responsive layout (Requirement 7.1) */}
        <div className="bg-gray-50 dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-700 px-4 md:px-6 py-3 md:py-4 flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0">
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 text-center md:text-left" role="status" aria-live="polite" aria-atomic="true">
            {t('templates.available', { 
              count: filteredTemplates.length,
              templateText: filteredTemplates.length === 1 
                ? t('templates.template') 
                : t('templates.templates')
            })}
          </p>
          <button
            onClick={handleSkip}
            disabled={isSkipping}
            className="w-full md:w-auto px-6 py-2 min-h-[44px] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg"
            aria-label={t('templates.skipAndCreate')}
          >
            {isSkipping ? t('templates.skipping') : t('templates.skip')}
          </button>
        </div>
      </div>
    </div>
  );
}
