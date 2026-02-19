import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useOnboarding } from "@/Contexts/OnboardingContext";
import type { SocialPlatform } from "@/types/onboarding";
import PlatformCard from "./PlatformCard";
import { ArrowRight, ArrowLeft, X } from "lucide-react";
import { useEffect } from "react";

interface SetupWizardProps {
  availablePlatforms: SocialPlatform[];
  connectedAccounts?: Array<{ platform: string; account_name: string }>;
  onComplete?: () => void;
}

type WizardStep = "welcome" | "platforms" | "success";

/**
 * SetupWizard provides a multi-step interface for connecting social media accounts.
 * 
 * Steps:
 * 1. Welcome screen with platform overview
 * 2. Platform selection grid
 * 3. Success confirmation with connected accounts
 */
export default function SetupWizard({
  availablePlatforms,
  connectedAccounts = [],
  onComplete,
}: SetupWizardProps) {
  const { t } = useTranslation();
  const { state, completeWizardStep, skipWizard } = useOnboarding();
  const [currentStep, setCurrentStep] = useState<WizardStep>("welcome");
  const [isSkipping, setIsSkipping] = useState(false);

  const handleNext = () => {
    if (currentStep === "welcome") {
      setCurrentStep("platforms");
    } else if (currentStep === "platforms") {
      // Check if at least one account is connected
      if (connectedAccounts.length > 0) {
        setCurrentStep("success");
      }
    }
  };

  const handleBack = () => {
    if (currentStep === "platforms") {
      setCurrentStep("welcome");
    } else if (currentStep === "success") {
      setCurrentStep("platforms");
    }
  };

  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      await skipWizard();
      onComplete?.();
    } catch (error) {
      console.error("Failed to skip wizard:", error);
    } finally {
      setIsSkipping(false);
    }
  };

  const handleComplete = async () => {
    try {
      await completeWizardStep("complete");
      onComplete?.();
    } catch (error) {
      console.error("Failed to complete wizard:", error);
    }
  };

  // Keyboard navigation (Requirement 7.5, 7.6)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case "Enter":
          if (currentStep === "welcome") {
            e.preventDefault();
            handleNext();
          } else if (currentStep === "platforms" && connectedAccounts.length > 0) {
            e.preventDefault();
            handleNext();
          } else if (currentStep === "success") {
            e.preventDefault();
            handleComplete();
          }
          break;
        case "ArrowLeft":
          if (currentStep !== "welcome") {
            e.preventDefault();
            handleBack();
          }
          break;
        case "Escape":
          e.preventDefault();
          handleSkip();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, connectedAccounts.length]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4" role="dialog" aria-modal="true" aria-labelledby="wizard-title" aria-describedby="wizard-description">
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
        {/* Header - Responsive layout (Requirement 7.1, 7.2) */}
        <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 px-4 md:px-6 py-3 md:py-4 flex items-start md:items-center justify-between gap-2 md:gap-4">
          <div className="flex-1 min-w-0">
            <h2 id="wizard-title" className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">
              {currentStep === "welcome" && t('onboarding.wizard.title.welcome')}
              {currentStep === "platforms" && t('onboarding.wizard.title.platforms')}
              {currentStep === "success" && t('onboarding.wizard.title.success')}
            </h2>
            <p id="wizard-description" className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {currentStep === "welcome" && t('onboarding.wizard.description.welcome')}
              {currentStep === "platforms" && t('onboarding.wizard.description.platforms')}
              {currentStep === "success" && t('onboarding.wizard.description.success')}
            </p>
          </div>
          <button
            onClick={handleSkip}
            disabled={isSkipping || state.isLoading}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-md"
            aria-label={t('onboarding.wizard.close')}
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        {/* Content - Responsive padding (Requirement 7.1) */}
        <div className="px-4 md:px-6 py-6 md:py-8">
          {currentStep === "welcome" && (
            <WelcomeScreen onNext={handleNext} onSkip={handleSkip} />
          )}

          {currentStep === "platforms" && (
            <PlatformsScreen
              availablePlatforms={availablePlatforms}
              connectedAccounts={connectedAccounts}
            />
          )}

          {currentStep === "success" && (
            <SuccessScreen
              connectedAccounts={connectedAccounts}
              onComplete={handleComplete}
            />
          )}
        </div>

        {/* Footer Navigation - Responsive layout (Requirement 7.1) */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-700 px-4 md:px-6 py-3 md:py-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <button
            onClick={handleBack}
            disabled={currentStep === "welcome" || state.isLoading}
            className="flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors order-2 md:order-1 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg"
            aria-label={t('onboarding.wizard.previousStep')}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="md:inline">{t('onboarding.wizard.back')}</span>
          </button>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3 order-1 md:order-2" role="group" aria-label={t('onboarding.wizard.navigation')}>
            {currentStep !== "success" && (
              <button
                onClick={handleSkip}
                disabled={isSkipping || state.isLoading}
                className="px-4 py-2 min-h-[44px] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg"
                aria-label={t('onboarding.wizard.skipSetup')}
              >
                {isSkipping ? t('onboarding.wizard.skipping') : t('onboarding.wizard.skip')}
              </button>
            )}

            {currentStep === "welcome" && (
              <button
                onClick={handleNext}
                disabled={state.isLoading}
                className="flex items-center justify-center gap-2 px-6 py-2 min-h-[44px] bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label={t('onboarding.wizard.getStartedSetup')}
              >
                {t('onboarding.wizard.getStarted')}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {currentStep === "platforms" && (
              <button
                onClick={handleNext}
                disabled={connectedAccounts.length === 0 || state.isLoading}
                className="flex items-center justify-center gap-2 px-6 py-2 min-h-[44px] bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label={t('onboarding.wizard.nextStep')}
                aria-disabled={connectedAccounts.length === 0}
              >
                {t('onboarding.wizard.continue')}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {currentStep === "success" && (
              <button
                onClick={handleComplete}
                disabled={state.isLoading}
                className="flex items-center justify-center gap-2 px-6 py-2 min-h-[44px] bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label={t('onboarding.wizard.finishSetup')}
              >
                {t('onboarding.wizard.finish')}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * WelcomeScreen displays the initial welcome message and overview.
 * Responsive layout for mobile devices (Requirement 7.1)
 */
function WelcomeScreen({
  onNext,
  onSkip,
}: {
  onNext: () => void;
  onSkip: () => void;
}) {
  const { t } = useTranslation();
  
  return (
    <div className="text-center max-w-2xl mx-auto space-y-4 md:space-y-6">
      <div className="w-16 h-16 md:w-20 md:h-20 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto">
        <svg
          className="w-8 h-8 md:w-10 md:h-10 text-primary-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      </div>

      <div>
        <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2 md:mb-3">
          {t('onboarding.wizard.welcome.heading')}
        </h3>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
          {t('onboarding.wizard.welcome.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 pt-2 md:pt-4">
        <div className="p-4 bg-gray-50 dark:bg-neutral-900 rounded-lg">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
            {t('onboarding.wizard.welcome.features.schedule.title')}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('onboarding.wizard.welcome.features.schedule.description')}
          </p>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-neutral-900 rounded-lg">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
            {t('onboarding.wizard.welcome.features.analytics.title')}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('onboarding.wizard.welcome.features.analytics.description')}
          </p>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-neutral-900 rounded-lg">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-5 h-5 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
            {t('onboarding.wizard.welcome.features.collaborate.title')}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('onboarding.wizard.welcome.features.collaborate.description')}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * PlatformsScreen displays the platform selection grid.
 * ARIA attributes for accessibility (Requirement 7.7)
 */
function PlatformsScreen({
  availablePlatforms,
  connectedAccounts,
}: {
  availablePlatforms: SocialPlatform[];
  connectedAccounts: Array<{ platform: string; account_name: string }>;
}) {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400">
          {t('onboarding.wizard.platforms.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="list" aria-label={t('onboarding.wizard.platforms.availablePlatforms')}>
        {availablePlatforms.map((platform) => {
          const isConnected = connectedAccounts.some(
            (acc) => acc.platform.toLowerCase() === platform.id.toLowerCase()
          );
          return (
            <PlatformCard
              key={platform.id}
              platform={platform}
              isConnected={isConnected}
              connectedAccount={connectedAccounts.find(
                (acc) =>
                  acc.platform.toLowerCase() === platform.id.toLowerCase()
              )}
            />
          );
        })}
      </div>

      {connectedAccounts.length === 0 && (
        <div className="text-center py-8" role="status" aria-live="polite">
          <p className="text-gray-500 dark:text-gray-400">
            {t('onboarding.wizard.platforms.noAccounts')}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * SuccessScreen displays the success confirmation.
 * Responsive layout for mobile devices (Requirement 7.1)
 */
function SuccessScreen({
  connectedAccounts,
  onComplete,
}: {
  connectedAccounts: Array<{ platform: string; account_name: string }>;
  onComplete: () => void;
}) {
  const { t } = useTranslation();
  const accountText = connectedAccounts.length === 1 
    ? t('onboarding.wizard.success.account') 
    : t('onboarding.wizard.success.accounts');
  
  return (
    <div className="text-center max-w-2xl mx-auto space-y-4 md:space-y-6">
      <div className="w-16 h-16 md:w-20 md:h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
        <svg
          className="w-8 h-8 md:w-10 md:h-10 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <div>
        <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2 md:mb-3">
          {t('onboarding.wizard.success.heading')}
        </h3>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
          {t('onboarding.wizard.success.description', { 
            count: connectedAccounts.length, 
            accountText 
          })}
        </p>
      </div>

      <div className="bg-gray-50 dark:bg-neutral-900 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">
          {t('onboarding.wizard.success.connectedAccounts')}
        </h4>
        <div className="space-y-3">
          {connectedAccounts.map((account, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-white dark:bg-neutral-800 rounded-lg"
            >
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-medium text-sm uppercase">
                  {account.platform.substring(0, 2)}
                </span>
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900 dark:text-white capitalize">
                  {account.platform}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {account.account_name}
                </p>
              </div>
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('onboarding.wizard.success.nextStep')}
        </p>
      </div>
    </div>
  );
}
