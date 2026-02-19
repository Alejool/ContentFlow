import type { TourStep } from "@/types/onboarding";

/**
 * Default tour steps configuration for the onboarding guided tour.
 * 
 * These steps highlight key features of the ContentFlow platform
 * and guide new users through the main interface.
 */
export const defaultTourSteps: TourStep[] = [
  {
    id: "step-1",
    title: "Welcome to ContentFlow",
    description: "Let's take a quick tour of the platform. We'll show you the key features to help you get started with social media management.",
    targetSelector: "#dashboard",
    position: "bottom",
    highlightPadding: 8,
  },
  {
    id: "step-2",
    title: "Navigation Sidebar",
    description: "Use the sidebar to navigate between different sections: Dashboard, Publications, Calendar, Analytics, and more.",
    targetSelector: "aside nav",
    position: "right",
    highlightPadding: 8,
  },
  {
    id: "step-3",
    title: "Create Publications",
    description: "Click here to create new social media posts. You can schedule them for multiple platforms at once.",
    targetSelector: "[href*='publications/create']",
    position: "right",
    highlightPadding: 8,
  },
  {
    id: "step-4",
    title: "Calendar View",
    description: "View and manage all your scheduled posts in a calendar format. Drag and drop to reschedule.",
    targetSelector: "[href*='calendar']",
    position: "right",
    highlightPadding: 8,
  },
  {
    id: "step-5",
    title: "Analytics Dashboard",
    description: "Track your social media performance with detailed analytics and insights across all connected platforms.",
    targetSelector: "[href*='analytics']",
    position: "right",
    highlightPadding: 8,
  },
];
