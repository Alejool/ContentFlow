import { Publication } from "@/types/Publication";
import { AlertTriangle, Info } from "lucide-react";

interface ContentTypeValidationBannerProps {
  publication: Publication;
  selectedPlatforms: number[];
  compatiblePlatforms: any[];
  connectedAccounts: any[];
  t: any;
}

export default function ContentTypeValidationBanner({
  publication,
  selectedPlatforms,
  compatiblePlatforms,
  connectedAccounts,
  t,
}: ContentTypeValidationBannerProps) {
  const contentType = publication.content_type || "post";
  const incompatibleAccounts = connectedAccounts.filter(
    (account) => !compatiblePlatforms.some((comp) => comp.id === account.id),
  );

  // Validaciones específicas por tipo
  const getValidationMessages = () => {
    const messages: { type: "error" | "warning" | "info"; message: string }[] = [];

    switch (contentType) {
      case "poll":
        if (!publication.poll_options || publication.poll_options.length < 2) {
          messages.push({
            type: "error",
            message: "Poll requires at least 2 options",
          });
        }
        if (!publication.poll_duration_hours || publication.poll_duration_hours < 1) {
          messages.push({
            type: "error",
            message: "Poll duration must be at least 1 hour",
          });
        }
        if (publication.media_files && publication.media_files.length > 0) {
          messages.push({
            type: "warning",
            message: "Media files will be ignored for poll posts",
          });
        }
        break;

      case "story":
        if (!publication.media_files || publication.media_files.length === 0) {
          messages.push({
            type: "error",
            message: "Story requires at least 1 media file",
          });
        }
        if (publication.media_files && publication.media_files.length > 1) {
          messages.push({
            type: "error",
            message: "Story can only have 1 media file",
          });
        }
        break;

      case "reel":
        const videoFiles = publication.media_files?.filter((m) => m.file_type === "video") || [];
        if (videoFiles.length === 0) {
          messages.push({
            type: "error",
            message: "Reel requires 1 video file",
          });
        }
        if (videoFiles.length > 1) {
          messages.push({
            type: "error",
            message: "Reel can only have 1 video file",
          });
        }
        break;

      case "carousel":
        if (!publication.media_files || publication.media_files.length < 2) {
          messages.push({
            type: "error",
            message: "Carousel requires at least 2 media files",
          });
        }
        if (publication.media_files && publication.media_files.length > 10) {
          messages.push({
            type: "error",
            message: "Carousel can have maximum 10 media files",
          });
        }
        break;
    }

    // Validar plataformas seleccionadas
    if (selectedPlatforms.length === 0) {
      messages.push({
        type: "error",
        message: "At least one platform must be selected",
      });
    }

    return messages;
  };

  const validationMessages = getValidationMessages();
  const hasErrors = validationMessages.some((msg) => msg.type === "error");
  const hasWarnings = validationMessages.some((msg) => msg.type === "warning");

  if (validationMessages.length === 0 && incompatibleAccounts.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 space-y-2">
      {/* Incompatible platforms warning */}
      {incompatibleAccounts.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Platforms not compatible with {contentType}
              </h4>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                The following platforms don't support {contentType} content:
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {incompatibleAccounts.map((account) => (
                  <span
                    key={account.id}
                    className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-1 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                  >
                    <span className="capitalize">{account.platform}</span>
                    <span className="opacity-75">@{account.account_name}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validation messages */}
      {validationMessages.map((msg, index) => (
        <div
          key={index}
          className={`rounded-lg border p-3 ${
            msg.type === "error"
              ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
              : msg.type === "warning"
                ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20"
                : "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
          }`}
        >
          <div className="flex items-start gap-2">
            {msg.type === "error" ? (
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400" />
            ) : msg.type === "warning" ? (
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            ) : (
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
            )}
            <p
              className={`text-sm ${
                msg.type === "error"
                  ? "text-red-800 dark:text-red-200"
                  : msg.type === "warning"
                    ? "text-amber-800 dark:text-amber-200"
                    : "text-blue-800 dark:text-blue-200"
              }`}
            >
              {msg.message}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
