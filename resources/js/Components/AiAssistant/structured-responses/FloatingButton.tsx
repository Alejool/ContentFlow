import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FloatingButtonProps {
  theme: 'dark' | 'light';
  onClick: () => void;
}

export default function FloatingButton({ theme, onClick }: FloatingButtonProps) {
  const { t } = useTranslation();

  const getButtonBg = () => {
    return theme === 'dark'
      ? 'bg-gradient-to-r from-primary-600 to-primary-800 hover:from-primary-700 hover:to-primary-900'
      : 'bg-gradient-to-r from-primary-600 to-primary-600 hover:from-primary-700 hover:to-primary-700';
  };

  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 h-14 w-14 ${getButtonBg()} group z-50 flex items-center justify-center rounded-full text-white shadow-lg transition-all duration-300 hover:shadow-xl`}
    >
      <Sparkles className="h-6 w-6 transition-transform group-hover:scale-110" />
      <span
        className={`absolute right-full mr-3 whitespace-nowrap rounded px-2 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100 ${
          theme === 'dark'
            ? 'border border-neutral-700 bg-neutral-800 text-white'
            : 'bg-gray-900 text-white'
        }`}
      >
        {t('aiAssistant.buttonLabel')}
      </span>

      {/* Efecto de pulso */}
      <div
        className={`absolute inset-0 animate-ping rounded-full ${
          theme === 'dark' ? 'bg-primary-600/30' : 'bg-primary-600/30'
        }`}
      ></div>
    </button>
  );
}
