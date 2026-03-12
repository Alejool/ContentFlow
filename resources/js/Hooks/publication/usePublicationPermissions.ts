import { useMemo } from "react";
import { Publication } from "@/types/Publication";

interface UsePublicationPermissionsProps {
  publication: Publication | null;
  auth: any;
  isLockedByOther: boolean;
  isAnyMediaProcessing: boolean;
}

export const usePublicationPermissions = ({
  publication,
  auth,
  isLockedByOther,
  isAnyMediaProcessing,
}: UsePublicationPermissionsProps) => {
  const canManage = auth.current_workspace?.permissions?.includes("manage-content");
  const canPublish = auth.current_workspace?.permissions?.includes("publish");
  const isPendingReview = publication?.status === "pending_review";
  const isOwner = publication?.user_id === auth.user.id;

  const isApprovedStatus =
    publication?.status === "approved" || publication?.status === "scheduled";

  const hasPublishedPlatform = useMemo(() => {
    return publication?.social_post_logs?.some(
      (log: any) => log.status === "published",
    );
  }, [publication]);

  // Partial locking:
  // - Global lock: only if another user has the lock
  const isLockedByOtherEditor = isLockedByOther;

  // - Media section lock: if another user has lock OR media is processing OR pending review
  const isMediaSectionDisabled =
    isLockedByOtherEditor ||
    isAnyMediaProcessing ||
    !canManage ||
    isPendingReview;

  // - Content/Settings section lock: ONLY if another user has lock OR pending review
  const isContentSectionDisabled =
    isLockedByOtherEditor || !canManage || isPendingReview;

  // Configuration allowed:
  // 1. Admin/Owner (canPublish): Always allowed
  // 2. Editor (!canPublish): Allowed if publication is Approved (regardless of ownership)
  const allowConfiguration = canPublish || isApprovedStatus;

  return {
    canManage,
    canPublish,
    isPendingReview,
    isOwner,
    isApprovedStatus,
    hasPublishedPlatform,
    isLockedByOtherEditor,
    isMediaSectionDisabled,
    isContentSectionDisabled,
    allowConfiguration,
  };
};
