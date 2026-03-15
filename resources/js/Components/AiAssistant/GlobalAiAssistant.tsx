import { useTheme } from '@/Hooks/useTheme';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { Brain, Loader2, Maximize2, Minimize2, Send, Sparkles, X, Zap } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface Message {
  id: number;
  role: 'assistant' | 'user';
  content: string;
  suggestion?: {
    data: Record<string, unknown>;
  };
}

interface PageProps {
  locale: string;
}

export default function GlobalAiAssistant() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { locale } = usePage<PageProps>().props;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        id: 1,
        role: 'assistant',
        content: t('aiAssistant.welcomeMessage'),
      },
    ]);
  }, [t]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: inputValue,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await axios.post('/ai-chat/process', {
        message: userMessage.content,
        source: 'assistant',
        context: {
          url: window.location.pathname,
          user_locale: locale || 'en',
        },
      });

      if (response.data.success) {
        const aiMessage: Message = {
          id: Date.now() + 1,
          role: 'assistant',
          content: response.data.message,
          suggestion: response.data.suggestion,
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (_error) {
      toast.error(t('common.error'));
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: t('aiAssistant.error'),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Estilos según el tema
  const getButtonBg = () => {
    return theme === 'dark'
      ? 'bg-gradient-to-r from-primary-600 to-primary-800 hover:from-primary-700 hover:to-primary-900'
      : 'bg-gradient-to-r from-primary-600 to-primary-600 hover:from-primary-700 hover:to-primary-700';
  };

  const getHeaderBg = () => {
    return theme === 'dark'
      ? 'bg-gradient-to-r from-primary-700 to-primary-900'
      : 'bg-gradient-to-r from-primary-600 to-primary-600';
  };

  const getMessageBg = (role: 'assistant' | 'user') => {
    if (role === 'user') {
      return theme === 'dark'
        ? 'bg-gradient-to-r from-purple-700 to-purple-800 text-white'
        : 'bg-gradient-to-r from-primary-600 to-primary-600 text-white';
    } else {
      return theme === 'dark'
        ? 'bg-neutral-700/70 text-gray-100 border border-neutral-600/50'
        : 'bg-white/80 text-gray-800 border border-gray-100';
    }
  };

  const getInputBg = () => {
    return theme === 'dark'
      ? 'bg-neutral-700/50 border border-neutral-600/50 text-gray-100 placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500/20'
      : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500/20';
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
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

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden rounded-lg shadow-2xl backdrop-blur-2xl transition-all duration-300 ${
        isMinimized ? 'w-68 h-18' : 'h-[500px] w-80 sm:w-96'
      } `}
    >
      <button
        type="button"
        className={`flex w-full shrink-0 cursor-pointer items-center justify-between p-4 text-white transition-colors ${getHeaderBg()}`}
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-3">
          <div
            className={`rounded-lg p-2 ${theme === 'dark' ? 'bg-primary-800/40' : 'bg-white/20'}`}
          >
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <span className="font-semibold">{t('aiAssistant.headerTitle')}</span>
            <p className={`text-xs ${theme === 'dark' ? 'text-primary-200/80' : 'text-white/90'}`}>
              {t('aiAssistant.subtitle')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            className={`rounded p-2 transition-colors ${
              theme === 'dark' ? 'hover:bg-primary-800/40' : 'hover:bg-white/20'
            } `}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
            className={`rounded p-2 transition-colors ${
              theme === 'dark' ? 'hover:bg-primary-800/40' : 'hover:bg-white/20'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </button>

      {!isMinimized && (
        <>
          {/* Messages Container */}
          <div className={`flex-1 space-y-4 overflow-y-auto p-4 transition-colors`}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 shadow-sm transition-all duration-300 ${getMessageBg(
                    msg.role,
                  )} ${msg.role === 'user' ? 'rounded-br-none' : 'rounded-bl-none'}`}
                >
                  <div className="text-sm leading-relaxed">{msg.content}</div>

                  {msg.suggestion && (
                    <div
                      className={`mt-3 pt-3 ${
                        theme === 'dark'
                          ? 'border-t border-neutral-600/50'
                          : 'border-t border-gray-100'
                      } `}
                    >
                      <div
                        className={`mb-1 text-xs font-medium uppercase tracking-wider ${
                          theme === 'dark' ? 'text-primary-400' : 'text-gray-500'
                        }`}
                      >
                        {t('aiAssistant.suggestion')}
                      </div>
                      <div
                        className={`rounded p-2 font-mono text-xs ${
                          theme === 'dark'
                            ? 'bg-neutral-800/50 text-gray-300'
                            : 'bg-gray-50 text-gray-600'
                        } `}
                      >
                        {JSON.stringify(msg.suggestion.data, null, 2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div
                  className={`flex items-center gap-2 rounded-lg rounded-bl-none px-4 py-3 shadow-sm ${
                    theme === 'dark'
                      ? 'border border-neutral-600/50 bg-neutral-700/70'
                      : 'border border-gray-100 bg-white'
                  }`}
                >
                  <Loader2
                    className={`h-4 w-4 animate-spin ${
                      theme === 'dark' ? 'text-primary-400' : 'text-primary-600'
                    }`}
                  />
                  <span
                    className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    {t('aiAssistant.thinking')}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Section */}
          <div
            className={`border-t p-4 transition-colors ${
              theme === 'dark'
                ? 'border-neutral-700/50 bg-neutral-800/50'
                : 'border-gray-100 bg-white/90'
            } `}
          >
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t('aiAssistant.askPlaceholder')}
                className={`flex-1 rounded-lg px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 ${getInputBg()}`}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className={`rounded-lg p-3 shadow-sm transition-all duration-300 ${
                  theme === 'dark'
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 disabled:cursor-not-allowed disabled:opacity-50'
                    : 'bg-gradient-to-r from-primary-600 to-primary-600 text-white hover:from-primary-700 hover:to-primary-700 disabled:cursor-not-allowed disabled:opacity-50'
                }`}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>

            {/* Quick Tips */}
            <div
              className={`mt-3 flex items-center gap-1 text-xs ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              <Zap className="h-3 w-3" />
              <span>{t('aiAssistant.tips')}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
