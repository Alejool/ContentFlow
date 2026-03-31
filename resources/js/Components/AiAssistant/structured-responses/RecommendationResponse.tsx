import { AIResponse } from '@/Hooks/useAIChat';
import { Sparkles } from 'lucide-react';

interface RecommendationResponseProps {
  data: AIResponse;
  theme: 'dark' | 'light';
}

export default function RecommendationResponse({ data, theme }: RecommendationResponseProps) {
  return (
    <div className="space-y-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-yellow-500" />
        <h3 className="text-lg font-semibold">{data.title}</h3>
      </div>

      {data.recommendations && data.recommendations.length > 0 && (
        <div className="space-y-3">
          {data.recommendations.map((rec, index) => (
            <div
              key={index}
              className={`rounded-lg p-3 ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-yellow-900/10 to-primary-900/10'
                  : 'bg-gradient-to-r from-yellow-50 to-primary-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                    theme === 'dark' ? 'bg-yellow-900/30' : 'bg-yellow-100'
                  }`}
                >
                  <span
                    className={`text-xs font-bold ${
                      theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
                    }`}
                  >
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold">{rec.item}</h4>
                  {rec.reason && (
                    <p
                      className={`mt-1 text-xs ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                      }`}
                    >
                      <span className="font-semibold">Por qué:</span> {rec.reason}
                    </p>
                  )}
                  {rec.implementation && (
                    <p
                      className={`mt-1 text-xs ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                      }`}
                    >
                      <span className="font-semibold">Cómo implementar:</span> {rec.implementation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {data.criteria && data.criteria.length > 0 && (
        <div className="mt-4">
          <h4
            className={`mb-2 text-sm font-medium ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            Criterios de selección:
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.criteria.map((criterion, index) => (
              <span
                key={index}
                className={`rounded-full px-2 py-1 text-xs ${
                  theme === 'dark' ? 'bg-neutral-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {criterion}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
