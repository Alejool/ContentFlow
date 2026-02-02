import Logo from "@/../assets/logo.png";
import ForgotPasswordSection from "@/Components/Auth/ForgotPasswordSection";
import LoginSection from "@/Components/Auth/LoginSection";
import RegisterSection from "@/Components/Auth/RegisterSection";
import ReturnToLogin from "@/Components/common/ReturnToLogin";
import ThemeLanguageContainer from "@/Components/common/ThemeLanguageContainer";
import { ReactNode, useEffect } from "react";
import { useTranslation } from "react-i18next";
interface GuestLayoutProps {
  children: ReactNode;
  section?: string;
}

export default function GuestLayout({ children, section }: GuestLayoutProps) {
  const { t } = useTranslation();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme-color", "orange");
  }, []);

  return (
    <div>
      {section !== "login" && <ReturnToLogin />}
      <ThemeLanguageContainer />
      <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="w-full lg:w-1/2 bg-primary-500 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative h-full flex flex-col items-center justify-center p-8 text-white">
            <div className="text-center max-w-xl">
              <div className="mb-8">
                <img src={Logo} alt="logo" className="w-36 h-36 mx-auto" />
                <h1 className="text-4xl font-bold  mb-4">
                  {section
                    ? t(`auth.${section}.welcome`, {
                        defaultValue: t(`auth.${section}.title`),
                      })
                    : t("auth.login.welcome")}
                </h1>
                <p className="text-lg opacity-90 mb-8">
                  {section
                    ? t(`auth.${section}.subtitle`)
                    : t("auth.login.subtitle")}
                </p>
              </div>

              {section === "login" && <LoginSection />}
              {section === "register" && <RegisterSection />}
              {section === "forgot-password" && <ForgotPasswordSection />}
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
