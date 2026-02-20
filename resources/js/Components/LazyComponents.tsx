import { lazy } from "react";
import { createLazyComponent } from "@/Components/common/ui/LazyLoadWrapper";

// Componentes pesados con lazy loading
export const LazyAiAssistant = createLazyComponent(
  () => import("@/Components/AiAssistant/GlobalAiAssistant")
);

export const LazyCommandPalette = createLazyComponent(
  () => import("@/Components/CommandPalette/CommandPalette")
);

export const LazyNotificationsModal = createLazyComponent(
  () => import("@/Components/Notifications/NotificationsModal")
);

export const LazyAnalyticsCharts = createLazyComponent(
  () => import("@/Components/Analytics/DetailedPlatformChart")
);

export const LazyPerformanceTable = createLazyComponent(
  () => import("@/Components/Analytics/PerformanceTable")
);

export const LazyMediaLightbox = createLazyComponent(
  () => import("@/Components/common/ui/MediaLightbox")
);

export const LazyPublishPreviewModal = createLazyComponent(
  () => import("@/Components/Publications/PublishPreviewModal")
);

export const LazyReelsCarousel = createLazyComponent(
  () => import("@/Components/ManageContent/ReelsCarousel")
);

export const LazyVideoEditor = createLazyComponent(
  () => import("@/Components/Upload/UploadItem")
);

// Modales pesados
export const LazyCreateWorkspaceModal = createLazyComponent(
  () => import("@/Components/Workspace/CreateWorkspaceModal")
);

export const LazyInviteMemberModal = createLazyComponent(
  () => import("@/Components/Workspace/InviteMemberModal")
);

export const LazyPlatformSettingsModal = createLazyComponent(
  () => import("@/Components/ConfigSocialMedia/PlatformSettingsModal")
);

// Páginas pesadas
export const LazyAnalyticsPage = lazy(() => import("@/Pages/Analytics/Index"));
export const LazyCalendarPage = lazy(() => import("@/Pages/Calendar/Index"));
export const LazyReelsGallery = lazy(() => import("@/Pages/Reels/AiReelsGallery"));
export const LazyWorkspaceSettings = lazy(() => import("@/Pages/Workspace/Settings"));

// AI Components - lazy load for better performance
export const LazyAiFieldSuggester = createLazyComponent(
  () => import("@/Components/AiAssistant/AiFieldSuggester")
);

export const LazyAiPromptSection = createLazyComponent(
  () => import("@/Components/AiAssistant/AiPromptSection")
);

// Workspace components
export const LazyWorkspaceSwitcher = createLazyComponent(
  () => import("@/Components/Workspace/WorkspaceSwitcher")
);

export const LazyMembersManagement = createLazyComponent(
  () => import("@/Components/Workspace/MembersManagement")
);

export const LazyRolesManagementTab = createLazyComponent(
  () => import("@/Components/Workspace/RolesManagementTab")
);

// Upload components
export const LazyResumeUploadsPrompt = createLazyComponent(
  () => import("@/Components/Upload/ResumeUploadsPrompt")
);

// Charts and heavy visualizations
export const LazyRechartsComponents = createLazyComponent(
  () => import("recharts")
);
