import { useTheme } from "@/Hooks/useTheme";
import { Calendar, Edit2, Image, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function ContentCard({ content, onEdit, onDelete }) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl  group border
          ${
            theme === "dark"
              ? "bg-neutral-800/50 border-neutral-700/50 hover:border-neutral-600"
              : "bg-white border-gray-100 hover:border-gray-200"
          }`}
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
            className={`w-full h-full flex items-center justify-center
              ${
                theme === "dark"
                  ? "bg-gradient-to-br from-neutral-700 to-neutral-800"
                  : "bg-gradient-to-br from-gray-100 to-gray-200"
              }`}
          >
            <Image
              className={`w-16 h-16 ${
                theme === "dark" ? "text-neutral-500" : "text-gray-400"
              }`}
            />
          </div>
        )}

        {/* Overlay with Actions */}
        <div
          className={`absolute inset-0 flex items-center justify-center space-x-3 transition-opacity duration-300 ${
            isHovered ? "opacity-100" : "opacity-0"
          } ${theme === "dark" ? "bg-black/50" : "bg-black/40"}`}
        >
          <button
            onClick={onEdit}
            className={`px-4 py-2 rounded-lg transition-colors duration-200 font-medium flex items-center space-x-2 shadow-lg
                ${
                  theme === "dark"
                    ? "bg-neutral-700 text-gray-200 hover:bg-neutral-600"
                    : "bg-white text-gray-900 hover:bg-gray-100"
                }`}
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
          className={`text-xl font-bold mb-3 line-clamp-2
            ${theme === "dark" ? "text-gray-200" : "text-gray-900"}`}
        >
          {content.title}
        </h3>

        {/* Description */}
        <p
          className={`text-sm leading-relaxed mb-4 line-clamp-3
            ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
        >
          {content.description}
        </p>

        {/* Hashtags */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {content.hashtags
              ?.split(" ")
              .slice(0, 3)
              .map((tag, index) => (
                <span
                  key={index}
                  className={`px-3 py-1 text-xs font-medium rounded-full
                      ${
                        theme === "dark"
                          ? "bg-primary-900/30 text-primary-300"
                          : "bg-primary-50 text-primary-600"
                      }`}
                >
                  {tag}
                </span>
              ))}
            {content.hashtags?.split(" ").length > 3 && (
              <span
                className={`px-3 py-1 text-xs font-medium rounded-full
                  ${
                    theme === "dark"
                      ? "bg-neutral-700 text-gray-400"
                      : "bg-gray-100 text-gray-500"
                  }`}
              >
                +{content.hashtags.split(" ").length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className={`flex items-center justify-between pt-4 border-t
            ${theme === "dark" ? "border-neutral-700" : "border-gray-100"}`}
        >
          <div
            className={`flex items-center space-x-2 text-xs
              ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
          >
            <Calendar className="w-4 h-4" />
            <span>
              {new Date(content.created_at).toLocaleDateString(i18n.language)}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <div
              className={`w-2 h-2 rounded-full
                ${theme === "dark" ? "bg-green-500" : "bg-green-400"}`}
            ></div>
            <span
              className={`text-xs ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {t("manageContent.campaigns.active")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
