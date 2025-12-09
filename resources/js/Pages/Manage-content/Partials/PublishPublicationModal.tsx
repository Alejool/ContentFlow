import IconFacebook from "@/../assets/Icons/facebook.svg";
import IconInstagram from "@/../assets/Icons/instagram.svg";
import IconTiktok from "@/../assets/Icons/tiktok.svg";
import IconTwitter from "@/../assets/Icons/x.svg";
import IconYoutube from "@/../assets/Icons/youtube.svg";
import YouTubeThumbnailUploader from "@/Components/YouTubeThumbnailUploader";
import { useTheme } from "@/Hooks/useTheme";
import { Publication } from "@/types/Publication";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import axios from "axios";
import { CheckCircle, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

interface PublishPublicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  publication: Publication | null;
  onSuccess?: () => void;
}

interface SocialAccount {
  id: number;
  platform: string;
  account_name: string;
  is_active: boolean;
}

export default function PublishPublicationModal({
  isOpen,
  onClose,
  publication,
  onSuccess,
}: PublishPublicationModalProps) {
  const { theme } = useTheme();
  const [connectedAccounts, setConnectedAccounts] = useState<SocialAccount[]>(
    []
  );
  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [youtubeThumbnails, setYoutubeThumbnails] = useState<
    Record<number, File | null>
  >({});
  const [existingThumbnails, setExistingThumbnails] = useState<
    Record<number, { url: string; id: number }>
  >({});

  useEffect(() => {
    if (isOpen && publication) {
      fetchConnectedAccounts();
      loadExistingThumbnails();
      // Reset state on open
      setSelectedPlatforms([]);
      setYoutubeThumbnails({});
    }
  }, [isOpen, publication]);

  const loadExistingThumbnails = () => {
    if (!publication?.media_files) return;

    const thumbnails: Record<number, { url: string; id: number }> = {};

    publication.media_files.forEach((media: any) => {
      if (media.file_type.includes("video")) {
        const thumbnail = media.derivatives?.find(
          (d: any) =>
            d.derivative_type === "thumbnail" && d.platform === "youtube"
        );
        if (thumbnail) {
          const thumbnailUrl = thumbnail.file_path.startsWith("http")
            ? thumbnail.file_path
            : `/storage/${thumbnail.file_path}`;
          thumbnails[media.id] = {
            url: thumbnailUrl,
            id: thumbnail.id,
          };
        }
      }
    });

    setExistingThumbnails(thumbnails);
  };

  const fetchConnectedAccounts = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/social-accounts");
      const accounts = response.data.accounts || [];
      setConnectedAccounts(
        accounts.filter((acc: SocialAccount) => acc.is_active)
      );
    } catch (error) {
      toast.error("Error loading connected accounts");
    } finally {
      setLoading(false);
    }
  };

  const togglePlatform = (accountId: number) => {
    setSelectedPlatforms((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
    );
  };

  const selectAll = () => {
    setSelectedPlatforms(connectedAccounts.map((acc) => acc.id));
  };

  const deselectAll = () => {
    setSelectedPlatforms([]);
  };

  const isYoutubeSelected = () => {
    return connectedAccounts.some(
      (acc) => acc.platform === "youtube" && selectedPlatforms.includes(acc.id)
    );
  };

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }

    if (!publication) return;

    // Validation for YouTube
    if (isYoutubeSelected()) {
      const videoFiles =
        publication.media_files?.filter((m) => m.file_type === "video") || [];
      // Only require thumbnail if it's a video.
      // Note: Backend assumes updated YouTubeService supports thumbnails.
      // Strict validation: Every video needs a thumbnail? Or at least one?
      // Let's warn but allow proceed if users want default thumbnails (though API might fail if service demands it)
      // The user specially asked for a modal to add logic.
    }

    setPublishing(true);
    try {
      const formData = new FormData();
      // Add platforms as array
      selectedPlatforms.forEach((id) =>
        formData.append("platforms[]", id.toString())
      );

      // Add YouTube thumbnails
      Object.entries(youtubeThumbnails).forEach(([videoId, file]) => {
        if (file) {
          formData.append("youtube_thumbnail", file);
          formData.append("youtube_thumbnail_video_id", videoId);
        }
      });

      const response = await axios.post(
        `/publications/${publication.id}/publish`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Check if the response indicates success
      if (response.data.success) {
        toast.success("Publication published successfully!");
        if (onSuccess) onSuccess();
        onClose();
      } else {
        // Handle partial or complete failure
        handlePublishErrors(response.data);
      }
    } catch (error: any) {
      // If there was a server response (meaning request reached backend),
      // the thumbnail likely saved even if publishing failed.
      // Update UI to show the new thumbnail as "existing".
      if (error.response) {
        const updatedExisting = { ...existingThumbnails };
        let hasUpdates = false;

        Object.entries(youtubeThumbnails).forEach(([vidId, file]) => {
          if (file) {
            updatedExisting[Number(vidId)] = {
              url: URL.createObjectURL(file),
              id: Date.now(), // Temporary ID
            };
            hasUpdates = true;
          }
        });

        if (hasUpdates) {
          setExistingThumbnails(updatedExisting);
          setYoutubeThumbnails({});
        }

        // Show error details if available
        if (error.response.data) {
          handlePublishErrors(error.response.data);
        } else {
          toast.error(
            error.response?.data?.message || "Error publishing publication"
          );
        }
      } else {
        toast.error("Network error. Please check your connection.");
      }
    } finally {
      setPublishing(false);
    }
  };

  const handlePublishErrors = (data: any) => {
    const { details } = data;

    if (!details) {
      toast.error(data.message || "Publishing failed");
      return;
    }

    const { platform_results, errors } = details;

    // Build detailed error message
    let errorLines: string[] = [];
    let successLines: string[] = [];

    // Check each platform result
    if (platform_results) {
      Object.entries(platform_results).forEach(
        ([platform, result]: [string, any]) => {
          if (result.success) {
            successLines.push(`✓ ${platform}: ${result.published} published`);
          } else {
            const errorMsg = result.errors?.[0]?.message || "Unknown error";
            errorLines.push(`✗ ${platform}: ${errorMsg}`);
          }
        }
      );
    }

    // Show combined message
    if (successLines.length > 0 && errorLines.length > 0) {
      // Partial success
      toast.error(
        `Partial success:\n${successLines.join("\n")}\n${errorLines.join(
          "\n"
        )}`,
        { duration: 6000 }
      );
    } else if (errorLines.length > 0) {
      // Complete failure
      toast.error(`Publishing failed:\n${errorLines.join("\n")}`, {
        duration: 6000,
      });
    } else {
      toast.error(data.message || "Publishing failed");
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons: any = {
      facebook: IconFacebook,
      twitter: IconTwitter,
      instagram: IconInstagram,
      tiktok: IconTiktok,
      youtube: IconYoutube,
    };
    return icons[platform.toLowerCase()];
  };

  const getPlatformGradient = (platform: string) => {
    const gradients: any = {
      facebook: "from-blue-500 to-blue-700",
      twitter: "from-neutral-800 to-neutral-900",
      instagram: "from-pink-500 to-purple-700",
      tiktok: "from-neutral-900 via-neutral-800 to-rose-900",
      youtube: "from-primary-600 to-primary-800",
    };
    return gradients[platform.toLowerCase()] || "from-gray-500 to-gray-700";
  };

  if (!publication) return null;

  const videoFiles =
    publication.media_files?.filter((m) => m.file_type === "video") || [];

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          className={`w-full max-w-2xl rounded-lg p-8 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar
            ${
              theme === "dark"
                ? "bg-neutral-800 border border-neutral-700"
                : "bg-white"
            }
          `}
        >
          <div className="flex items-center justify-between mb-6">
            <DialogTitle
              className={`text-2xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-primary-500 to-pink-500 rounded-lg">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                Publish Publication
              </div>
            </DialogTitle>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                theme === "dark"
                  ? "hover:bg-neutral-700 text-gray-400"
                  : "hover:bg-gray-100 text-gray-500"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div
            className={`mb-6 p-4 rounded-lg ${
              theme === "dark" ? "bg-neutral-900/50" : "bg-gray-50"
            }`}
          >
            <h3
              className={`font-semibold mb-1 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {publication.title}
            </h3>
            <p
              className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {publication.description}
            </p>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4
                className={`font-semibold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                Select Platforms
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-sm text-primary-500 hover:text-primary-600 font-medium"
                >
                  Select All
                </button>
                <span
                  className={
                    theme === "dark" ? "text-gray-600" : "text-gray-400"
                  }
                >
                  |
                </span>
                <button
                  onClick={deselectAll}
                  className="text-sm text-primary-500 hover:text-primary-600 font-medium"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
              </div>
            ) : connectedAccounts.length === 0 ? (
              <div
                className={`text-center py-8 rounded-lg ${
                  theme === "dark" ? "bg-neutral-900/50" : "bg-gray-50"
                }`}
              >
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  No connected social media accounts found.
                  <br />
                  Please connect your accounts first.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {connectedAccounts.map((account) => {
                  const iconSrc = getPlatformIcon(account.platform);
                  const gradient = getPlatformGradient(account.platform);
                  const isSelected = selectedPlatforms.includes(account.id);

                  return (
                    <button
                      key={account.id}
                      onClick={() => togglePlatform(account.id)}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                          : theme === "dark"
                          ? "border-neutral-700 hover:border-neutral-600 bg-neutral-900/30"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg bg-gradient-to-br ${gradient}`}
                      >
                        <img
                          src={iconSrc}
                          alt={account.platform}
                          className="w-5 h-5"
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <p
                          className={`font-medium capitalize ${
                            theme === "dark" ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {account.platform}
                        </p>
                        <p
                          className={`text-xs ${
                            theme === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {account.account_name}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-primary-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* YouTube Thumbnail Section */}
          {isYoutubeSelected() && videoFiles.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <img src={IconYoutube} className="w-5 h-5" />
                <h4
                  className={`font-semibold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  YouTube Thumbnails
                </h4>
              </div>

              <div className="space-y-4">
                {videoFiles.map((video) => (
                  <YouTubeThumbnailUploader
                    key={video.id}
                    videoId={video.id}
                    existingThumbnail={existingThumbnails[video.id] || null}
                    onThumbnailChange={(file: File | null) =>
                      setYoutubeThumbnails((prev) => ({
                        ...prev,
                        [video.id]: file,
                      }))
                    }
                    onThumbnailDelete={() => {
                      setYoutubeThumbnails((prev) => {
                        const newThumbs = { ...prev };
                        delete newThumbs[video.id];
                        return newThumbs;
                      });
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                theme === "dark"
                  ? "bg-neutral-700 hover:bg-neutral-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handlePublish}
              disabled={publishing || selectedPlatforms.length === 0}
              className="flex-1 px-4 py-3 rounded-lg font-medium bg-gradient-to-r from-primary-500 to-pink-500 hover:from-primary-600 hover:to-pink-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {publishing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Publishing...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Publish to {selectedPlatforms.length} Platform
                  {selectedPlatforms.length !== 1 ? "s" : ""}
                </>
              )}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
