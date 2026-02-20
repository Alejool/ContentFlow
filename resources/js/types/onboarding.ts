/**
 * Onboarding System Type Definitions
 * 
 * This file contains all TypeScript interfaces and types for the interactive
 * onboarding system, including tour steps, tooltips, wizards, and templates.
 */

/**
 * OnboardingState represents the current progress and completion status
 * of a user's onboarding process.
 */
export interface OnboardingState {
  tourCompleted: boolean;
  tourSkipped: boolean;
  tourCurrentStep: number;
  tourCompletedSteps: string[];
  wizardCompleted: boolean;
  wizardSkipped: boolean;
  wizardCurrentStep: number;
  templateSelected: boolean;
  templateId: string | null;
  dismissedTooltips: string[];
  completedAt: string | null;
  startedAt: string;
  completionPercentage: number;
}

/**
 * TourStep represents an individual stage within the guided tour.
 */
export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  highlightPadding: number;
  route?: string; // Optional route to navigate to if element not found
}

/**
 * TourConfiguration defines the overall tour settings and steps.
 */
export interface TourConfiguration {
  steps: TourStep[];
  autoStart: boolean;
  showProgress: boolean;
}

/**
 * TooltipDefinition defines a single tooltip's properties.
 */
export interface TooltipDefinition {
  id: string;
  content: string;
  targetSelector: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  dismissible: boolean;
}

/**
 * TooltipConfiguration defines global tooltip settings and definitions.
 */
export interface TooltipConfiguration {
  tooltips: Record<string, TooltipDefinition>;
  showOnHover: boolean;
  autoHideDelay: number;
}

/**
 * SocialPlatform represents a social media platform that can be connected.
 */
export interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

/**
 * PublicationTemplate represents a pre-configured publication format
 * that users can customize.
 */
export interface PublicationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  previewImage: string;
  content: {
    text: string;
    media?: string[];
    hashtags?: string[];
  };
}
