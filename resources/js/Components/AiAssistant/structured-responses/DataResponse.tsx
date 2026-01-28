import { BarChart3 } from "lucide-react";
import { AIResponse } from "@/Hooks/useAIChat";

interface DataResponseProps {
  data: AIResponse;
  theme: "dark" | "light";
}

export default function DataResponse({ data, theme }: DataResponseProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-5 h-5 text-green-500" />
        <h3 className="font-semibold text-lg">{data.title}</h3>
      </div>

      {data.items && data.items.length > 0 && (
        <div className="space-y-2">
          {data.items.map((item, index) => (
            <div
              key={index}
              className={`flex justify-between items-center p-3 rounded-lg ${
                theme === "dark" ? "bg-neutral-800/50" : "bg-gray-50"
              }`}
            >
              <div>
                <p className="font-medium text-sm">{item.name}</p>
                {item.description && (
                  <p
                    className={`text-xs ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {item.description}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p
                  className={`font-bold ${
                    theme === "dark" ? "text-green-400" : "text-green-600"
                  }`}
                >
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {data.categories && data.categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.categories.map((category, index) => (
            <span
              key={index}
              className={`px-2 py-1 text-xs rounded-full ${
                theme === "dark"
                  ? "bg-neutral-700 text-gray-300"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {category}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
