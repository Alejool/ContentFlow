import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/Hooks/useTheme";

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  className?: string;
}

export default function ExpandableText({
  text,
  maxLength = 50,
  className = "",
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const { t } = useTranslation();
  const { theme } = useTheme();

  if (!text || text.trim() === "") {
    return <span className={`text-gray-400 italic ${className}`}>-</span>;
  }

  const needsTruncation = text.length > maxLength;
  const displayText = isExpanded
    ? text
    : `${text.substring(0, maxLength)}${needsTruncation ? "…" : ""}`;

  return (
    <button
      onClick={() => needsTruncation && setIsExpanded(!isExpanded)}
      className={`text-left focus:outline-none focus:ring-2 rounded ${
        needsTruncation
          ? "cursor-pointer hover:opacity-80 transition-opacity"
          : "cursor-default"
      } ${className} ${theme === "dark" ? "text-white" : "text-gray-700"}`}
      aria-label={
        needsTruncation
          ? isExpanded
            ? t("logs.table.less")
            : t("logs.table.more")
          : "Texto completo"
      }
      disabled={!needsTruncation}
    >
      {displayText}
      {needsTruncation && (
        <span className="sr-only">
          {isExpanded ? t("logs.table.clickLess") : t("logs.table.clickMore")}
        </span>
      )}
    </button>
  );
}
