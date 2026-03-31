import { Hash } from 'lucide-react';
import { AIResponse } from '@/Hooks/useAIChat';

interface ContentResponseProps {
  data: AIResponse;
  theme: 'dark' | 'light';
}

export default function ContentResponse({ data, theme }: ContentResponseProps) {
  return (
    <div className="space-y-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hash className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-semibold">{data.title}</h3>
        </div>
        {data.platform && (
          <span
            className={`rounded-full px-2 py-1 text-xs ${
              theme === 'dark'
                ? 'bg-purple-900/30 text-purple-300'
                : 'bg-purple-100 text-purple-700'
            }`}
          >
            {data.platform}
          </span>
        )}
      </div>

      {data.content && (
        <div
          className={`rounded-lg p-4 ${
            theme === 'dark'
              ? 'bg-gradient-to-r from-purple-900/10 to-pink-900/10'
              : 'bg-gradient-to-r from-purple-50 to-pink-50'
          }`}
        >
          <p className="whitespace-pre-line text-sm">{data.content}</p>
          {data.character_count && (
            <div
              className={`mt-3 border-t pt-3 ${
                theme === 'dark' ? 'border-purple-800/30' : 'border-purple-100'
              }`}
            >
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
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
                theme === 'dark' ? 'border-purple-400' : 'border-purple-500'
              }`}
            >
              <h4 className="text-sm font-medium">{section.heading}</h4>
              <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
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
              className={`rounded-full px-2 py-1 text-xs ${
                theme === 'dark'
                  ? 'bg-purple-900/30 text-purple-300'
                  : 'bg-purple-100 text-purple-700'
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
