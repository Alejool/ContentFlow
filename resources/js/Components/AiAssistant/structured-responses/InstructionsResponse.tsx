// components/ai-assistant/structured-responses/InstructionsResponse.tsx
import { AIResponse } from "@/Hooks/useAIChat";
import { ChevronRight, Clock, FileText, Target } from "lucide-react";

interface InstructionsResponseProps {
  data: AIResponse;
  theme: "dark" | "light";
}

export default function InstructionsResponse({
  data,
  theme,
}: InstructionsResponseProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-5 h-5 text-primary-500" />
        <h3 className="font-semibold text-lg">{data.title}</h3>
      </div>

      {data.steps && data.steps.length > 0 && (
        <div className="space-y-3">
          <h4
            className={`font-medium text-sm flex items-center gap-2 ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          >
            <ChevronRight className="w-4 h-4" /> Pasos a seguir:
          </h4>
          <div className="space-y-2">
            {data.steps.map((step, index) => (
              <div
                key={index}
                className={`flex gap-3 p-3 rounded-lg ${
                  theme === "dark" ? "bg-neutral-800/50" : "bg-gray-50"
                }`}
              >
                <div
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    theme === "dark" ? "bg-primary-900/30" : "bg-primary-100"
                  }`}
                >
                  <span
                    className={`text-xs font-bold ${
                      theme === "dark" ? "text-primary-400" : "text-primary-600"
                    }`}
                  >
                    {step.step}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-sm">{step.description}</p>
                  {step.details && (
                    <p
                      className={`text-xs mt-1 ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {step.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.summary && (
        <div
          className={`p-3 rounded-lg ${
            theme === "dark" ? "bg-blue-900/20" : "bg-blue-50"
          }`}
        >
          <p className="text-sm">{data.summary}</p>
        </div>
      )}

      <div
        className={`flex items-center gap-4 text-xs ${
          theme === "dark" ? "text-gray-400" : "text-gray-500"
        }`}
      >
        {data.estimated_time && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{data.estimated_time}</span>
          </div>
        )}
        {data.difficulty && (
          <div className="flex items-center gap-1">
            <Target className="w-3 h-3" />
            <span>Dificultad: {data.difficulty}</span>
          </div>
        )}
      </div>
    </div>
  );
}
