import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Crown } from "lucide-react";
import Button from "@/Components/common/Modern/Button";
import PricingPlansSection from "@/Components/Pricing/PricingPlansSection";
import axios from "axios";

interface PlanSelectionStepProps {
  onComplete: (planId: string) => void;
  onSkip: () => void;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  limits: {
    publications_per_month: number;
    storage_gb: number;
    social_accounts: number;
    team_members: number;
  };
  popular?: boolean;
  enabled?: boolean;
  trial_days?: number;
  requires_stripe?: boolean;
}

export default function PlanSelectionStep({
  onComplete,
  onSkip,
}: PlanSelectionStepProps) {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  // Check if user already has an active subscription
  useEffect(() => {
    const checkActiveSubscription = async () => {
      try {
        // First check onboarding state
        const onboardingResponse = await axios.get('/api/v1/onboarding/state');
        const onboardingState = onboardingResponse.data?.state;
        
        // If plan is already selected in onboarding, complete this step
        if (onboardingState?.planSelected && onboardingState?.selectedPlan) {
          console.log('Plan already selected in onboarding:', onboardingState.selectedPlan);
          setTimeout(() => {
            onComplete(onboardingState.selectedPlan);
          }, 500);
          return;
        }

        // Check if user has an active subscription
        try {
          const response = await axios.get('/api/v1/subscription/current-usage');
          const currentPlan = response.data?.data?.plan;
          
          // If user has an active paid plan, update onboarding and complete this step
          if (currentPlan && currentPlan !== 'free' && currentPlan !== 'demo') {
            console.log('User has active plan, updating onboarding:', currentPlan);
            
            // Update onboarding state on backend
            try {
              await axios.post('/api/v1/onboarding/plan/select', {
                plan_id: currentPlan
              });
            } catch (error) {
              console.error('Error updating onboarding state:', error);
            }
            
            // Complete this step
            setTimeout(() => {
              onComplete(currentPlan);
            }, 500);
            return;
          }
        } catch (error) {
          // 404 means no active subscription, which is expected during onboarding
          if (error.response?.status !== 404) {
            console.error('Error checking subscription:', error);
          }
        }
      } catch (error) {
        console.error('Error checking onboarding state:', error);
      } finally {
        setCheckingSubscription(false);
      }
    };

    checkActiveSubscription();
  }, [onComplete]);

  useEffect(() => {
    // Fetch plans from the API
    const fetchPlans = async () => {
      try {
        const response = await axios.get('/api/v1/plans');
        setPlans(response.data);
      } catch (error) {
        console.error('Error fetching plans:', error);
        setPlans([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handlePlanSelected = (planId: string) => {
    // Si es plan gratuito, completar el onboarding
    if (planId === "free" || planId === "demo") {
      onComplete(planId);
    }
    // Si es plan de pago, usePricing ya maneja la redirección a Stripe
  };

  if (isLoading || checkingSubscription) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto">
            <Crown className="w-8 h-8 text-primary-600 animate-pulse" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("planSelection.title")}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {checkingSubscription ? t('common.messages.checkingSubscription') : t('common.messages.loadingPlans')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="text-center space-y-3 mb-8">
        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto">
          <Crown className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("planSelection.title")}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {t("planSelection.description")}
        </p>
      </div>

      {/* Usar el mismo componente que PricingPage */}
      <PricingPlansSection
        plans={plans}
        currentPlan={undefined}
        isAuthenticated={true}
        showBillingToggle={true}
        showHeader={false}
        variant="default"
        onPlanSelected={handlePlanSelected}
      />

      <div className="text-center pt-4">
        <Button
          onClick={onSkip}
          variant="ghost"
          size="md"
        >
          {t("planSelection.decideLater")}
        </Button>
      </div>
    </div>
  );
}
