import Logo from '@/../assets/logo.png';
import ForgotPasswordSection from '@/Components/Auth/ForgotPasswordSection';
import LoginSection from '@/Components/Auth/LoginSection';
import RegisterSection from '@/Components/Auth/RegisterSection';
import ReturnToLogin from '@/Components/common/ReturnToLogin';
import ThemeLanguageContainer from '@/Components/common/ThemeLanguageContainer';
import { ReactNode, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
interface GuestLayoutProps {
  children: ReactNode;
  section?: string;
}

export default function GuestLayout({ children, section }: GuestLayoutProps) {
  const { t } = useTranslation();

  useEffect(() => {
    // Force orange theme for guest pages
    document.documentElement.setAttribute('data-theme-color', 'orange');

    // Clear any custom color properties that might persist from authenticated session
    const root = document.documentElement;
    [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].forEach((weight) => {
      root.style.removeProperty(`--primary-${weight}`);
    });
  }, []);

  return (
    <div>
      {section !== 'login' && <ReturnToLogin />}
      <ThemeLanguageContainer />
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 lg:flex-row">
        <div className="relative w-full overflow-hidden bg-primary-500 lg:w-1/2">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative flex h-full flex-col items-center justify-center p-8 text-white">
            <div className="max-w-xl text-center">
              <div className="mb-8">
                <img src={Logo} alt="Intellipost logo" className="mx-auto h-36 w-36" />
                <h1 className="mb-4 text-4xl font-bold">
                  {section
                    ? t(`auth.${section}.welcome`, {
                        defaultValue: t(`auth.${section}.title`),
                      })
                    : t('auth.login.welcome')}
                </h1>
                <p className="mb-8 text-lg opacity-90">
                  {section ? t(`auth.${section}.subtitle`) : t('auth.login.subtitle')}
                </p>
              </div>

              {section === 'login' && <LoginSection />}
              {section === 'register' && <RegisterSection />}
              {section === 'forgot-password' && <ForgotPasswordSection />}
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
