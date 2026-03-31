// components/ai-assistant/structured-responses/InstructionsResponse.tsx
import { AIResponse } from '@/Hooks/useAIChat';
import { ChevronRight, Clock, FileText, Target } from 'lucide-react';

interface InstructionsResponseProps {
  data: AIResponse;
  theme: 'dark' | 'light';
}

export default function InstructionsResponse({ data, theme }: InstructionsResponseProps) {
  return (
    <div className="space-y-4">
      <div className="mb-3 flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary-500" />
        <h3 className="text-lg font-semibold">{data.title}</h3>
      </div>

      {data.steps && data.steps.length > 0 && (
        <div className="space-y-3">
          <h4
            className={`flex items-center gap-2 text-sm font-medium ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            <ChevronRight className="h-4 w-4" /> Pasos a seguir:
          </h4>
          <div className="space-y-2">
            {data.steps.map((step, index) => (
              <div
                key={index}
                className={`flex gap-3 rounded-lg p-3 ${
                  theme === 'dark' ? 'bg-neutral-800/50' : 'bg-gray-50'
                }`}
              >
                <div
                  className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                    theme === 'dark' ? 'bg-primary-900/30' : 'bg-primary-100'
                  }`}
                >
                  <span
                    className={`text-xs font-bold ${
                      theme === 'dark' ? 'text-primary-400' : 'text-primary-600'
                    }`}
                  >
                    {step.step}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">{step.description}</p>
                  {step.details && (
                    <p
                      className={`mt-1 text-xs ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
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
        <div className={`rounded-lg p-3 ${theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
          <p className="text-sm">{data.summary}</p>
        </div>
      )}

      <div
        className={`flex items-center gap-4 text-xs ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}
      >
        {data.estimated_time && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{data.estimated_time}</span>
          </div>
        )}
        {data.difficulty && (
          <div className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            <span>Dificultad: {data.difficulty}</span>
          </div>
        )}
      </div>
    </div>
  );
}
