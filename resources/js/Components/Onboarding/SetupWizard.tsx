import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useOnboarding } from '@/Contexts/OnboardingContext';
import type { SocialPlatform } from '@/types/onboarding';
import { SOCIAL_PLATFORMS } from '@/Constants/socialPlatforms';
import PlatformCard from './PlatformCard';
import { ArrowRight, ArrowLeft, X } from 'lucide-react';

interface SetupWizardProps {
  availablePlatforms?: SocialPlatform[];
  connectedAccounts?: Array<{ platform: string; account_name: string }>;
  onComplete?: () => void;
}

type WizardStep = 'welcome' | 'platforms' | 'success';

/**
 * SetupWizard provides a multi-step interface for connecting social media accounts.
 *
 * Steps:
 * 1. Welcome screen with platform overview
 * 2. Platform selection grid
 * 3. Success confirmation with connected accounts
 */
export default function SetupWizard({
  availablePlatforms: propsPlatforms,
  connectedAccounts = [],
  onComplete,
}: SetupWizardProps) {
  const { t } = useTranslation();
  const { state, completeWizardStep, skipWizard } = useOnboarding();
  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome');
  const [isSkipping, setIsSkipping] = useState(false);

  // Log when connected accounts change
  useEffect(() => {}, [connectedAccounts]);

  // ALWAYS use SOCIAL_PLATFORMS constant, ignore props
  const availablePlatforms = useMemo(() => {
    // Convert SOCIAL_PLATFORMS to SocialPlatform format
    const platforms = Object.values(SOCIAL_PLATFORMS)
      .filter((platform) => platform.active)
      .map((platform) => ({
        id: platform.key,
        name: platform.name,
        icon: platform.logo,
        color: platform.color,
        description: t(`platform.${platform.key}`, {
          defaultValue: `Connect your ${platform.name} account`,
        }),
      }));

    return platforms;
  }, [t]);

  const handleNext = () => {
    if (currentStep === 'welcome') {
      setCurrentStep('platforms');
    } else if (currentStep === 'platforms') {
      // Allow continuing even without connected accounts
      if (connectedAccounts.length > 0) {
        setCurrentStep('success');
      } else {
        // Skip success screen and complete directly
        handleComplete();
      }
    }
  };

  const handleBack = () => {
    if (currentStep === 'platforms') {
      setCurrentStep('welcome');
    } else if (currentStep === 'success') {
      setCurrentStep('platforms');
    }
  };

  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      await skipWizard();
      onComplete?.();
    } catch (error) {
    } finally {
      setIsSkipping(false);
    }
  };

  const handleComplete = async () => {
    try {
      // Send the final step number (3) to properly mark wizard as completed
      await completeWizardStep('step-3');
      // Don't call onComplete - let the state change trigger the transition
      // onComplete?.();
    } catch (error) {}
  };

  // Keyboard navigation (Requirement 7.5, 7.6)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'Enter':
          if (currentStep === 'welcome') {
            e.preventDefault();
            handleNext();
          } else if (currentStep === 'platforms' && connectedAccounts.length > 0) {
            e.preventDefault();
            handleNext();
          } else if (currentStep === 'success') {
            e.preventDefault();
            handleComplete();
          }
          break;
        case 'ArrowLeft':
          if (currentStep !== 'welcome') {
            e.preventDefault();
            handleBack();
          }
          break;
        case 'Escape':
          e.preventDefault();
          handleSkip();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, connectedAccounts.length]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 backdrop-blur-sm md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wizard-title"
      aria-describedby="wizard-description"
    >
      <div className="max-h-[95vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-2xl dark:bg-neutral-800 md:max-h-[90vh]">
        {/* Header - Responsive layout (Requirement 7.1, 7.2) */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-2 border-b border-gray-200 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800 md:items-center md:gap-4 md:px-6 md:py-4">
          <div className="min-w-0 flex-1">
            <h2
              id="wizard-title"
              className="truncate text-xl font-bold text-gray-900 dark:text-white md:text-2xl"
            >
              {currentStep === 'welcome' && t('wizard.title.welcome')}
              {currentStep === 'platforms' && t('wizard.title.platforms')}
              {currentStep === 'success' && t('wizard.title.success')}
            </h2>
            <p
              id="wizard-description"
              className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400 md:text-sm"
            >
              {currentStep === 'welcome' && t('wizard.description.welcome')}
              {currentStep === 'platforms' && t('wizard.description.platforms')}
              {currentStep === 'success' && t('wizard.description.success')}
            </p>
          </div>
          <button
            onClick={handleSkip}
            disabled={isSkipping || state.isLoading}
            className="flex min-h-[44px] min-w-[44px] flex-shrink-0 items-center justify-center rounded-md p-2 text-gray-400 transition-colors hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:hover:text-gray-300"
            aria-label={t('wizard.close')}
          >
            <X className="h-5 w-5 md:h-6 md:w-6" />
          </button>
        </div>

        {/* Content - Responsive padding (Requirement 7.1) */}
        <div className="px-4 py-6 dark:bg-neutral-900 md:px-6">
          {currentStep === 'welcome' && <WelcomeScreen onNext={handleNext} onSkip={handleSkip} />}

          {currentStep === 'platforms' && (
            <PlatformsScreen
              availablePlatforms={availablePlatforms}
              connectedAccounts={connectedAccounts}
            />
          )}

          {currentStep === 'success' && (
            <SuccessScreen connectedAccounts={connectedAccounts} onComplete={handleComplete} />
          )}
        </div>

        {/* Footer Navigation - Responsive layout (Requirement 7.1) */}
        <div className="sticky bottom-0 z-10 flex flex-col items-stretch justify-between gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900 md:flex-row md:items-center md:px-6 md:py-4">
          <button
            onClick={handleBack}
            disabled={currentStep === 'welcome' || state.isLoading}
            className="order-2 flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 py-2 text-gray-600 transition-colors hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:text-white md:order-1"
            aria-label={t('wizard.previousStep')}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="md:inline">{t('wizard.back')}</span>
          </button>

          <div
            className="order-1 flex flex-col items-stretch gap-2 md:order-2 md:flex-row md:items-center md:gap-3"
            role="group"
            aria-label={t('wizard.navigation')}
          >
            {currentStep !== 'success' && (
              <button
                onClick={handleSkip}
                disabled={isSkipping || state.isLoading}
                className="min-h-[44px] rounded-lg px-4 py-2 text-center text-gray-600 transition-colors hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:text-white"
                aria-label={t('wizard.skipSetup')}
              >
                {isSkipping ? t('wizard.skipping') : t('wizard.skip')}
              </button>
            )}

            {currentStep === 'welcome' && (
              <button
                onClick={handleNext}
                disabled={state.isLoading}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-2 font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={t('wizard.getStartedSetup')}
              >
                {t('wizard.getStarted')}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {currentStep === 'platforms' && (
              <button
                onClick={handleNext}
                disabled={state.isLoading}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-2 font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={t('wizard.nextStep')}
              >
                {connectedAccounts.length > 0
                  ? t('wizard.continue')
                  : t('wizard.continueWithout', 'Continue Without Connecting')}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {currentStep === 'success' && (
              <button
                onClick={handleComplete}
                disabled={state.isLoading}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-2 font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={t('wizard.finishSetup')}
              >
                {t('wizard.finish')}
                <ArrowRight className="h-4 w-4" />
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
function WelcomeScreen({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-2xl space-y-4 text-center md:space-y-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/20 md:h-20 md:w-20">
        <svg
          className="h-8 w-8 text-primary-600 md:h-10 md:w-10"
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
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white md:mb-3 md:text-xl">
          {t('wizard.welcome.heading')}
        </h3>
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400 md:text-base">
          {t('wizard.welcome.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 pt-2 md:grid-cols-3 md:gap-4 md:pt-4">
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-neutral-900">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
            <svg
              className="h-5 w-5 text-blue-600"
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
          <h4 className="mb-1 font-medium text-gray-900 dark:text-white">
            {t('wizard.welcome.features.schedule.title')}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('wizard.welcome.features.schedule.description')}
          </p>
        </div>

        <div className="rounded-lg bg-gray-50 p-4 dark:bg-neutral-900">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
            <svg
              className="h-5 w-5 text-green-600"
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
          <h4 className="mb-1 font-medium text-gray-900 dark:text-white">
            {t('wizard.welcome.features.analytics.title')}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('wizard.welcome.features.analytics.description')}
          </p>
        </div>

        <div className="rounded-lg bg-gray-50 p-4 dark:bg-neutral-900">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
            <svg
              className="h-5 w-5 text-purple-600"
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
          <h4 className="mb-1 font-medium text-gray-900 dark:text-white">
            {t('wizard.welcome.features.collaborate.title')}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('wizard.welcome.features.collaborate.description')}
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
        <p className="text-gray-600 dark:text-gray-200">{t('wizard.platforms.description')}</p>
      </div>

      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        role="list"
        aria-label={t('wizard.platforms.availablePlatforms')}
      >
        {availablePlatforms.length === 0 ? (
          <div className="col-span-full py-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No platforms available. Please check your configuration.
            </p>
          </div>
        ) : (
          availablePlatforms.map((platform) => {
            const isConnected = connectedAccounts.some(
              (acc) => acc.platform.toLowerCase() === platform.id.toLowerCase(),
            );
            return (
              <PlatformCard
                key={platform.id}
                platform={platform}
                isConnected={isConnected}
                connectedAccount={connectedAccounts.find(
                  (acc) => acc.platform.toLowerCase() === platform.id.toLowerCase(),
                )}
              />
            );
          })
        )}
      </div>

      {connectedAccounts.length === 0 && (
        <div className="py-8 text-center" role="status" aria-live="polite">
          <p className="text-gray-500 dark:text-gray-400">{t('wizard.platforms.noAccounts')}</p>
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
  const accountText =
    connectedAccounts.length === 1 ? t('wizard.success.account') : t('wizard.success.accounts');

  return (
    <div className="mx-auto max-w-2xl space-y-4 text-center md:space-y-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20 md:h-20 md:w-20">
        <svg
          className="h-8 w-8 text-green-600 md:h-10 md:w-10"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white md:mb-3 md:text-xl">
          {t('wizard.success.heading')}
        </h3>
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400 md:text-base">
          {t('wizard.success.description', {
            count: connectedAccounts.length,
            accountText,
          })}
        </p>
      </div>

      <div className="rounded-lg bg-gray-50 p-6 dark:bg-neutral-900">
        <h4 className="mb-4 font-medium text-gray-900 dark:text-white">
          {t('wizard.success.connectedAccounts')}
        </h4>
        <div className="space-y-3">
          {connectedAccounts.map((account, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-lg bg-white p-3 dark:bg-neutral-900"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/20">
                <span className="text-sm font-medium uppercase text-primary-600">
                  {account.platform.substring(0, 2)}
                </span>
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium capitalize text-gray-900 dark:text-white">
                  {account.platform}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{account.account_name}</p>
              </div>
              <svg
                className="h-5 w-5 text-green-600"
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
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('wizard.success.nextStep')}</p>
      </div>
    </div>
  );
}
