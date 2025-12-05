import { Hash } from "lucide-react";
import { AIResponse } from "@/Hooks/useAIChat";

interface ContentResponseProps {
  data: AIResponse;
  theme: "dark" | "light";
}

export default function ContentResponse({ data, theme }: ContentResponseProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Hash className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-lg">{data.title}</h3>
        </div>
        {data.platform && (
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              theme === "dark"
                ? "bg-purple-900/30 text-purple-300"
                : "bg-purple-100 text-purple-700"
            }`}
          >
            {data.platform}
          </span>
        )}
      </div>

      {data.content && (
        <div
          className={`p-4 rounded-lg ${
            theme === "dark"
              ? "bg-gradient-to-r from-purple-900/10 to-pink-900/10"
              : "bg-gradient-to-r from-purple-50 to-pink-50"
          }`}
        >
          <p className="text-sm whitespace-pre-line">{data.content}</p>
          {data.character_count && (
            <div
              className={`mt-3 pt-3 border-t ${
                theme === "dark" ? "border-purple-800/30" : "border-purple-100"
              }`}
            >
              <p
                className={`text-xs ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Caracteres: {data.character_count}
              </p>
            </div>
          )}
        </div>
      )}

      {data.sections && data.sections.length > 0 && (
        <div className="space-y-3">
          {data.sections.map((section, index) => (
            <div
              key={index}
              className={`border-l-4 pl-3 ${
                theme === "dark" ? "border-purple-400" : "border-purple-500"
              }`}
            >
              <h4 className="font-medium text-sm">{section.heading}</h4>
              <p
                className={`text-sm mt-1 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {section.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {data.keywords && data.keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.keywords.map((keyword, index) => (
            <span
              key={index}
              className={`px-2 py-1 text-xs rounded-full ${
                theme === "dark"
                  ? "bg-purple-900/30 text-purple-300"
                  : "bg-purple-100 text-purple-700"
              }`}
            >
              #{keyword}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
