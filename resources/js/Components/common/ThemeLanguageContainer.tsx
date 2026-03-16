import LanguageSwitcher from '@/Components/common/ui/LanguageSwitcher';
import ThemeSwitcher from '@/Components/common/ui/ThemeSwitcher';
import { Link } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from './Modern/Button';

interface ThemeLanguageContainerProps {
  isWelcome?: boolean;
  canLogin?: boolean;
  canRegister?: boolean;
}

export default function ThemeLanguageContainer({
  isWelcome = false,
  canLogin = false,
  canRegister = false,
}: ThemeLanguageContainerProps) {
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!isWelcome) {
    return (
      <div className="fixed right-6 top-6 z-50 flex items-center space-x-2 rounded-lg backdrop-blur-sm">
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>
    );
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden items-center space-x-4 md:flex">
        <div className="flex items-center space-x-2">
          {canLogin && (
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
            >
              {t('welcome.login')}
            </Link>
          )}

          {canRegister && (
            <Link
              href="/register"
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              {t('welcome.getStarted')}
            </Link>
          )}
        </div>

        <div className="h-6 w-px bg-gray-300 dark:bg-gray-700"></div>

        <div className="flex items-center space-x-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </div>

      {/* Mobile con menú hamburguesa */}
      <div className="md:hidden">
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            buttonStyle="icon"
            variant="ghost"
            size="sm"
            rounded="lg"
            className="!p-2"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Menú desplegable */}
          {isMobileMenuOpen && (
            <div className="absolute right-4 top-16 z-50 min-w-[180px] rounded-lg border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-900">
              <div className="flex flex-col space-y-3">
                {canLogin && (
                  <Link
                    href="/login"
                    className="px-4 py-2 text-center text-sm font-medium text-gray-700 transition-colors hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('welcome.login')}
                  </Link>
                )}

                {canRegister && (
                  <Link
                    href="/register"
                    className="rounded-lg bg-primary-600 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-primary-700"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('welcome.getStarted')}
                  </Link>
                )}

                <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
                  <div className="flex items-center justify-center space-x-3">
                    <ThemeSwitcher />
                    <LanguageSwitcher />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
