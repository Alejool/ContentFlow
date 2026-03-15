import { AIResponse } from "@/Hooks/useAIChat";
import { CheckCircle, Lightbulb, TrendingUp } from "lucide-react";

interface AnalysisResponseProps {
  data: AIResponse;
  theme: "dark" | "light";
}

export default function AnalysisResponse({ data, theme }: AnalysisResponseProps) {
  return (
    <div className="space-y-4">
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-blue-500" />
        <h3 className="text-lg font-semibold">{data.title}</h3>
      </div>

      {data.insights && data.insights.length > 0 && (
        <div className="space-y-3">
          {data.insights.map((insight, index) => (
            <div
              key={index}
              className={`rounded-lg p-3 ${
                theme === "dark"
                  ? "bg-gradient-to-r from-blue-900/20 to-blue-800/20"
                  : "bg-gradient-to-r from-blue-50 to-blue-100"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`rounded-full p-1 ${
                    insight.impact === "High"
                      ? theme === "dark"
                        ? "bg-primary-900/30"
                        : "bg-primary-100"
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
                    className={`h-4 w-4 ${
                      insight.impact === "High"
                        ? theme === "dark"
                          ? "text-primary-400"
                          : "text-primary-600"
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
                  <p className="text-sm font-medium">{insight.insight}</p>
                  {insight.recommendation && (
                    <p
                      className={`mt-1 text-xs ${
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      <span className="font-semibold">Recomendación:</span> {insight.recommendation}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        insight.impact === "High"
                          ? theme === "dark"
                            ? "bg-primary-900/30 text-primary-300"
                            : "bg-primary-100 text-primary-700"
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
            className={`mb-2 text-sm font-medium ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Acciones prioritarias:
          </h4>
          <ul className="space-y-1">
            {data.priority_actions.map((action, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
