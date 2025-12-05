import { TrendingUp, Lightbulb, CheckCircle } from "lucide-react";
import { AIResponse } from "@/Hooks/useAIChat";

interface AnalysisResponseProps {
  data: AIResponse;
  theme: "dark" | "light";
}

export default function AnalysisResponse({
  data,
  theme,
}: AnalysisResponseProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold text-lg">{data.title}</h3>
      </div>

      {data.insights && data.insights.length > 0 && (
        <div className="space-y-3">
          {data.insights.map((insight, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                theme === "dark"
                  ? "bg-gradient-to-r from-blue-900/20 to-blue-800/20"
                  : "bg-gradient-to-r from-blue-50 to-blue-100"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-1 rounded-full ${
                    insight.impact === "High"
                      ? theme === "dark"
                        ? "bg-red-900/30"
                        : "bg-red-100"
                      : insight.impact === "Medium"
                      ? theme === "dark"
                        ? "bg-yellow-900/30"
                        : "bg-yellow-100"
                      : theme === "dark"
                      ? "bg-green-900/30"
                      : "bg-green-100"
                  }`}
                >
                  <Lightbulb
                    className={`w-4 h-4 ${
                      insight.impact === "High"
                        ? theme === "dark"
                          ? "text-red-400"
                          : "text-red-600"
                        : insight.impact === "Medium"
                        ? theme === "dark"
                          ? "text-yellow-400"
                          : "text-yellow-600"
                        : theme === "dark"
                        ? "text-green-400"
                        : "text-green-600"
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{insight.insight}</p>
                  {insight.recommendation && (
                    <p
                      className={`text-xs mt-1 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      <span className="font-semibold">Recomendación:</span>{" "}
                      {insight.recommendation}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        insight.impact === "High"
                          ? theme === "dark"
                            ? "bg-red-900/30 text-red-300"
                            : "bg-red-100 text-red-700"
                          : insight.impact === "Medium"
                          ? theme === "dark"
                            ? "bg-yellow-900/30 text-yellow-300"
                            : "bg-yellow-100 text-yellow-700"
                          : theme === "dark"
                          ? "bg-green-900/30 text-green-300"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      Impacto: {insight.impact}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {data.priority_actions && data.priority_actions.length > 0 && (
        <div className="mt-4">
          <h4
            className={`font-medium text-sm mb-2 ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Acciones prioritarias:
          </h4>
          <ul className="space-y-1">
            {data.priority_actions.map((action, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
