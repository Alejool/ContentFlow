import { Calendar, Edit2, Image, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface Content {
  id: number;
  title: string;
  description: string;
  image?: string;
  hashtags?: string;
  created_at: string;
}

interface ContentCardProps {
  content: Content;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ContentCard({ content, onEdit, onDelete }: ContentCardProps) {
  const { t, i18n } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl  group border bg-white border-gray-100 hover:border-gray-200 dark:bg-neutral-800/50 dark:border-neutral-700/50 dark:hover:border-neutral-600"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden ">
        {content.image ? (
          <img
            src={content.image}
            alt={content.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-neutral-700 dark:to-neutral-800"
          >
            <Image
              className="w-16 h-16 text-gray-400 dark:text-neutral-500"
            />
          </div>
        )}

        {/* Overlay with Actions */}
        <div
          className={`absolute inset-0 flex items-center justify-center space-x-3 transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"
            } bg-black/40 dark:bg-black/50`}
        >
          <button
            onClick={onEdit}
            className="px-4 py-2 rounded-lg transition-colors duration-200 font-medium flex items-center space-x-2 shadow-lg bg-white text-gray-900 hover:bg-gray-100 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600"
          >
            <Edit2 className="w-4 h-4" />
            <span>{t("manageContent.campaigns.edit")}</span>
          </button>

          <button
            onClick={onDelete}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200 font-medium flex items-center space-x-2 shadow-lg"
          >
            <Trash2 className="w-4 h-4" />
            <span>{t("manageContent.campaigns.delete")}</span>
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        {/* Title */}
        <h3
          className="text-xl font-bold mb-3 line-clamp-2 text-gray-900 dark:text-gray-200"
        >
          {content.title}
        </h3>

        {/* Description */}
        <p
          className="text-sm leading-relaxed mb-4 line-clamp-3 text-gray-600 dark:text-gray-400"
        >
          {content.description}
        </p>

        {/* Hashtags */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {(() => {
              const tags = content.hashtags?.split(" ").filter(t => t.trim()) || [];
              return (
                <>
                  {tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-xs font-medium rounded-full bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300"
                    >
                      {tag}
                    </span>
                  ))}
                  {tags.length > 3 && (
                    <span
                      className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-500 dark:bg-neutral-700 dark:text-gray-400"
                    >
                      +{tags.length - 3}
                    </span>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-neutral-700"
        >
          <div
            className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400"
          >
            <Calendar className="w-4 h-4" />
            <span>
              {new Date(content.created_at).toLocaleDateString(i18n.language)}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <div
              className="w-2 h-2 rounded-full bg-green-400 dark:bg-green-500"
            ></div>
            <span
              className="text-xs text-gray-500 dark:text-gray-400"
            >
              {t("manageContent.campaigns.active")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
