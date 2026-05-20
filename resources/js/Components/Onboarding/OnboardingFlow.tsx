/**
 * OnboardingFlow
 *
 * Orchestrates the complete onboarding experience by rendering the correct
 * step component based on the current stage.
 *
 * Stage order:
 *   businessInfo → planSelection → tour → wizard → (complete → unmounts)
 *
 * All stage-transition logic lives in `useOnboardingStage`.
 * All step components are lazy-loaded to keep the initial bundle small.
 */

import { useOnboarding } from '@/Contexts/Onboarding/OnboardingContext';
import type { PublicationTemplate, SocialPlatform, TourStep } from '@/types/Onboarding/onboarding';
import { Building2, ChevronDown, ChevronUp, Gem, Link2, Target } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingErrorBoundary } from './OnboardingErrorBoundary';
import type { OnboardingStage } from './hooks/useOnboardingStage';
import { useOnboardingStage } from './hooks/useOnboardingStage';

// Lazy-loaded step components
const BusinessInfoStep = lazy(() => import('./BusinessInfoStep'));
const PlanSelectionStep = lazy(() => import('./PlanSelectionStep'));
const TourOverlay = lazy(() => import('./TourOverlay'));
const SetupWizard = lazy(() => import('./SetupWizard'));

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OnboardingFlowProps {
  tourSteps: TourStep[];
  availablePlatforms: SocialPlatform[];
  connectedAccounts?: Array<{ platform: string; account_name: string }>;
  templates: PublicationTemplate[];
}

// ---------------------------------------------------------------------------
// Shared UI helpers
// ---------------------------------------------------------------------------

/** Full-screen modal shell shared by BusinessInfo and PlanSelection steps. */
function ModalShell({
  wide = false,
  children,
}: {
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        className={`max-h-[90vh] w-full overflow-y-auto rounded-lg bg-white p-8 shadow-2xl dark:bg-theme-bg-secondary ${
          wide ? 'max-w-7xl' : 'max-w-4xl'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

/** Spinner shown while a lazy component is loading. */
function StepLoadingFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-lg bg-white p-8 shadow-xl dark:bg-theme-bg-secondary">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Loading…</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Progress indicator
// ---------------------------------------------------------------------------

const PROGRESS_STAGES: { id: OnboardingStage; labelKey: string; Icon: React.ElementType }[] = [
  { id: 'businessInfo',  labelKey: 'progress.stages.businessInfo', Icon: Building2 },
  { id: 'planSelection', labelKey: 'progress.stages.plan',         Icon: Gem },
  { id: 'tour',          labelKey: 'progress.stages.tour',         Icon: Target },
  { id: 'wizard',        labelKey: 'progress.stages.connect',      Icon: Link2 },
];

function OnboardingProgressIndicator({
  currentStage,
  completionPercentage,
}: {
  currentStage: OnboardingStage;
  completionPercentage: number;
}) {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Tour has its own built-in progress UI
  if (currentStage === 'tour' || currentStage === 'complete') return null;

  const currentIndex = PROGRESS_STAGES.findIndex((s) => s.id === currentStage);
  const currentStageInfo = PROGRESS_STAGES[currentIndex];

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="fixed right-6 top-6 z-[99] flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-lg transition-colors hover:bg-gray-50 dark:border-neutral-700 dark:bg-theme-bg-secondary dark:hover:bg-neutral-700"
      >
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {currentIndex + 1} / {PROGRESS_STAGES.length}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>
    );
  }

  return (
    <div className="fixed right-6 top-6 z-[99] w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-xl dark:border-neutral-700 dark:bg-theme-bg-secondary">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {t('progress.title')}
        </p>
        <button
          onClick={() => setIsCollapsed(true)}
          className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-700 dark:hover:text-gray-300"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {currentStageInfo ? t(currentStageInfo.labelKey) : ''}
        </span>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {currentIndex + 1} / {PROGRESS_STAGES.length}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-700">
        <div
          className="h-full rounded-full bg-primary-500 transition-all duration-500"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function OnboardingFlow({
  tourSteps,
  availablePlatforms,
  connectedAccounts = [],
  templates: _templates, // reserved for future TemplateGallery stage
}: OnboardingFlowProps) {
  const {
    currentStage,
    completionPercentage,
    onBusinessInfoComplete,
    onBusinessInfoSkip,
    onPlanSelect,
    onPlanSkip,
    onTourNext,
    onTourComplete,
    onTourSkip,
    onWizardComplete,
  } = useOnboardingStage();

  const { state } = useOnboarding();

  // Don't render if onboarding is already completed
  // Check both the derived stage and the completedAt timestamp
  if (currentStage === 'complete' || state.completedAt !== null) {
    return null;
  }

  const currentTourStep =
    tourSteps[Math.min(/* state.tourCurrentStep */ 0, tourSteps.length - 1)] ?? tourSteps[0];

  return (
    <OnboardingErrorBoundary>
      <OnboardingProgressIndicator
        currentStage={currentStage}
        completionPercentage={completionPercentage}
      />

      {/* ── Business Info ─────────────────────────────────────────── */}
      {currentStage === 'businessInfo' && (
        <OnboardingErrorBoundary>
          <Suspense fallback={<StepLoadingFallback />}>
            <ModalShell>
              <BusinessInfoStep
                onComplete={onBusinessInfoComplete}
                onSkip={onBusinessInfoSkip}
              />
            </ModalShell>
          </Suspense>
        </OnboardingErrorBoundary>
      )}

      {/* ── Plan Selection ────────────────────────────────────────── */}
      {currentStage === 'planSelection' && (
        <OnboardingErrorBoundary>
          <Suspense fallback={<StepLoadingFallback />}>
            <ModalShell wide>
              <PlanSelectionStep onComplete={onPlanSelect} onSkip={onPlanSkip} />
            </ModalShell>
          </Suspense>
        </OnboardingErrorBoundary>
      )}

      {/* ── Tour ─────────────────────────────────────────────────── */}
      {currentStage === 'tour' && tourSteps.length > 0 && currentTourStep && (
        <OnboardingErrorBoundary>
          <Suspense fallback={<StepLoadingFallback />}>
            <TourOverlay
              currentStep={currentTourStep}
              totalSteps={tourSteps.length}
              onNext={onTourNext}
              onSkip={onTourSkip}
              onComplete={() => onTourComplete(tourSteps)}
            />
          </Suspense>
        </OnboardingErrorBoundary>
      )}

      {/* ── Setup Wizard ──────────────────────────────────────────── */}
      {currentStage === 'wizard' && (
        <OnboardingErrorBoundary>
          <Suspense fallback={<StepLoadingFallback />}>
            <SetupWizard
              availablePlatforms={availablePlatforms}
              connectedAccounts={connectedAccounts}
              onComplete={onWizardComplete}
            />
          </Suspense>
        </OnboardingErrorBoundary>
      )}
    </OnboardingErrorBoundary>
  );
}
