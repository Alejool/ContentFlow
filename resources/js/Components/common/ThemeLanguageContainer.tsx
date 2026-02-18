import LanguageSwitcher from "@/Components/common/ui/LanguageSwitcher";
import ThemeSwitcher from "@/Components/common/ui/ThemeSwitcher";
import Button from "@/Components/common/Modern/Button";
import { Link } from "@inertiajs/react";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

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
      <div className="fixed top-6 right-6 z-50 backdrop-blur-sm rounded-lg flex items-center space-x-2">
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>
    );
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          {canLogin && (
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {t("welcome.login")}
            </Link>
          )}

          {canRegister && (
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              {t("welcome.getStarted")}
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
            variant="ghost"
            buttonStyle="ghost"
            className="!p-2 !rounded-lg hover:!bg-gray-100 dark:hover:!bg-gray-800 !shadow-none"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            ) : (
              <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            )}
          </Button>

          {/* Menú desplegable */}
          {isMobileMenuOpen && (
            <div className="absolute top-16 right-4 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 min-w-[180px] z-50">
              <div className="flex flex-col space-y-3">
                {canLogin && (
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t("welcome.login")}
                  </Link>
                )}

                {canRegister && (
                  <Link
                    href="/register"
                    className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t("welcome.getStarted")}
                  </Link>
                )}

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
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
