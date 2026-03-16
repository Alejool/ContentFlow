import enFlag from '@/../assets/Icons/Flags/en.svg';
import esFlag from '@/../assets/Icons/Flags/es.svg';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import OptimizedImage from './OptimizedImage';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { auth } = (usePage().props as any) || {};
  const [isAnimating, setIsAnimating] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: enFlag },
    { code: 'es', name: 'Español', flag: esFlag },
  ];

  const getBaseLang = (lang: string) => lang.split('-')[0];
  const currentLangCode = getBaseLang(i18n.resolvedLanguage || i18n.language || 'es');

  const currentLanguage =
    languages.find((lang) => lang.code === currentLangCode) ?? languages[0];

  const nextLanguage = languages.find((lang) => lang.code !== currentLangCode) ?? languages[1];

  if (!currentLanguage || !nextLanguage) {
    return null;
  }

  const toggleLanguage = async () => {
    if (isAnimating || !nextLanguage) return;

    setIsAnimating(true);
    const newLang = nextLanguage.code;

    setTimeout(() => {
      i18n.changeLanguage(newLang);
      setIsAnimating(false);
    }, 200);

    if (auth?.user) {
      try {
        await axios.patch(route('settings.locale'), { locale: newLang });
      } catch (error) {}
    }
  };

  return (
    <motion.button
      onClick={toggleLanguage}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="group relative overflow-hidden rounded-lg border border-gray-200/30 bg-white/60 p-2 backdrop-blur-md transition-all duration-300 hover:border-primary-200/40 hover:bg-white/70 hover:shadow-md dark:border-neutral-700/30 dark:bg-neutral-800/40 dark:hover:border-primary-500/20 dark:hover:bg-neutral-800/60"
      aria-label={`Switch to ${nextLanguage.code.toUpperCase()}`}
    >
      <div className="relative flex h-8 w-8 items-center justify-center">
        {/* Bandera actual (grande) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`current-${currentLanguage.code}`}
            initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.5, opacity: 0, rotate: 180 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="h-5 w-7 overflow-hidden rounded-sm shadow-md"
          >
            <OptimizedImage
              src={currentLanguage.flag}
              alt={currentLanguage.name}
              eager={true}
              className="h-full w-full object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {/* Bandera siguiente (pequeña) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`next-${nextLanguage.code}`}
            initial={{ scale: 0, opacity: 0, x: 10, y: 10 }}
            animate={{ scale: 1, opacity: 1, x: 0, y: 0 }}
            exit={{ scale: 0, opacity: 0, x: -10, y: -10 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="absolute -bottom-1 -right-1 h-3.5 w-5 overflow-hidden rounded-sm border border-gray-200/40 bg-white/80 p-0.5 shadow-md backdrop-blur-sm dark:border-neutral-600/40 dark:bg-neutral-800/80"
          >
            <OptimizedImage
              src={nextLanguage.flag}
              alt={nextLanguage.name}
              eager={true}
              className="h-full w-full object-cover"
            />
          </motion.div>
        </AnimatePresence>

        <motion.span
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 0, x: -5 }}
          whileHover={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute -left-1 -top-1 text-xs text-primary-500 dark:text-primary-400"
        >
          ↻
        </motion.span>
      </div>
    </motion.button>
  );
}
