import { BarChart3 } from 'lucide-react';
import { AIResponse } from '@/Hooks/useAIChat';

interface DataResponseProps {
  data: AIResponse;
  theme: 'dark' | 'light';
}

export default function DataResponse({ data, theme }: DataResponseProps) {
  return (
    <div className="space-y-4">
      <div className="mb-3 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-green-500" />
        <h3 className="text-lg font-semibold">{data.title}</h3>
      </div>

      {data.items && data.items.length > 0 && (
        <div className="space-y-2">
          {data.items.map((item, index) => (
            <div
              key={index}
              className={`flex items-center justify-between rounded-lg p-3 ${
                theme === 'dark' ? 'bg-neutral-800/50' : 'bg-gray-50'
              }`}
            >
              <div>
                <p className="text-sm font-medium">{item.name}</p>
                {item.description && (
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {item.description}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p
                  className={`font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}
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
              className={`rounded-full px-2 py-1 text-xs ${
                theme === 'dark' ? 'bg-neutral-700 text-gray-300' : 'bg-gray-100 text-gray-600'
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
