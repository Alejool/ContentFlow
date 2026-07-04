import axios from 'axios';

export type OnboardingActionType =
  | 'completeBusinessInfo'
  | 'selectPlan'
  | 'skipTour'
  | 'completeTourStep'
  | 'dismissTooltip'
  | 'completeWizardStep'
  | 'skipWizard'
  | 'selectTemplate';

export interface OnboardingActionResponse {
  state?: Record<string, unknown>;
  [key: string]: unknown;
}

function resolveAction(
  type: string,
  payload: Record<string, unknown>,
): { endpoint: string; data: Record<string, unknown> } {
  switch (type) {
    case 'completeBusinessInfo':
      return { endpoint: '/api/v1/onboarding/business-info/complete', data: payload };
    case 'selectPlan':
      return { endpoint: '/api/v1/onboarding/plan/select', data: { plan_id: payload['planId'] } };
    case 'skipTour':
      return { endpoint: '/api/v1/onboarding/tour/skip', data: {} };
    case 'completeTourStep':
      return {
        endpoint: '/api/v1/onboarding/tour/complete',
        data: { step_id: payload['stepId'] },
      };
    case 'dismissTooltip':
      return {
        endpoint: '/api/v1/onboarding/tooltip/dismiss',
        data: { tooltip_id: payload['tooltipId'] },
      };
    case 'completeWizardStep':
      return {
        endpoint: '/api/v1/onboarding/wizard/complete',
        data: { step_id: payload['stepId'], data: payload['data'] },
      };
    case 'skipWizard':
      return { endpoint: '/api/v1/onboarding/wizard/skip', data: {} };
    case 'selectTemplate':
      return {
        endpoint: '/api/v1/onboarding/template/select',
        data: { template_id: payload['templateId'] },
      };
    default:
      throw new Error(`Unknown action type: ${type}`);
  }
}

export const onboardingService = {
  restart: (): Promise<OnboardingActionResponse> =>
    axios.post('/api/v1/onboarding/restart').then((r) => r.data),

  getState: (): Promise<Record<string, unknown> | undefined> =>
    axios.get('/api/v1/onboarding/state').then((r) => r.data?.state),

  updateTourStep: (step: number): Promise<void> =>
    axios.post('/api/v1/onboarding/tour/step', { step }).then(() => undefined),

  performAction: (
    type: string,
    payload: Record<string, unknown>,
  ): Promise<OnboardingActionResponse> => {
    const { endpoint, data } = resolveAction(type, payload);
    return axios.post(endpoint, data).then((r) => r.data);
  },
};
