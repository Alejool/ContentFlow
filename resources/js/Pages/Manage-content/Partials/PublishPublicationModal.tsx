import IconFacebook from "@/../assets/Icons/facebook.svg";
import IconInstagram from "@/../assets/Icons/instagram.svg";
import IconTiktok from "@/../assets/Icons/tiktok.svg";
import IconTwitter from "@/../assets/Icons/x.svg";
import IconYoutube from "@/../assets/Icons/youtube.svg";
import { useTheme } from "@/Hooks/useTheme";
import { Publication } from "@/types/Publication";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import axios from "axios";
import { CheckCircle, Share2, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

interface PublishPublicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  publication: Publication | null;
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
}: PublishPublicationModalProps) {
  const { theme } = useTheme();
  const [connectedAccounts, setConnectedAccounts] = useState<SocialAccount[]>(
    []
  );
  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [thumbnails, setThumbnails] = useState<Record<number, File>>({});
  const [previews, setPreviews] = useState<Record<number, string>>({});

  useEffect(() => {
    if (isOpen) {
      fetchConnectedAccounts();
      // Reset state on open
      setSelectedPlatforms([]);
      setThumbnails({});
      setPreviews({});
    }
  }, [isOpen, publication]);

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

  const handleThumbnailChange = (mediaId: number, file: File) => {
    setThumbnails((prev) => ({ ...prev, [mediaId]: file }));
    const url = URL.createObjectURL(file);
    setPreviews((prev) => ({ ...prev, [mediaId]: url }));
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

      // Add thumbnails
      Object.entries(thumbnails).forEach(([mediaId, file]) => {
        formData.append(`thumbnails[${mediaId}]`, file);
      });

      await axios.post(`/publications/${publication.id}/publish`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Publication published successfully!");
      onClose();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Error publishing publication"
      );
    } finally {
      setPublishing(false);
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
            <div
              className={`mb-6 p-4 rounded-lg border ${
                theme === "dark"
                  ? "border-primary-500/30 bg-primary-900/10"
                  : "border-primary-200 bg-primary-50"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <img src={IconYoutube} className="w-5 h-5" />
                <h4
                  className={`font-semibold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  YouTube Thumbnails
                </h4>
              </div>
              <p
                className={`text-sm mb-4 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Upload custom thumbnails for your videos. recommended logic
                1280x720.
              </p>

              <div className="space-y-4">
                {videoFiles.map((video) => (
                  <div
                    key={video.id}
                    className={`flex items-start gap-4 p-3 rounded-lg border ${
                      theme === "dark"
                        ? "border-neutral-700 bg-neutral-800"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    {/* Video Preview/Icon */}
                    <div className="w-20 h-20 bg-black flex-shrink-0 rounded flex items-center justify-center overflow-hidden">
                      <video
                        src={video.file_path}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium truncate mb-2 ${
                          theme === "dark" ? "text-gray-200" : "text-gray-700"
                        }`}
                      >
                        {video.file_name}
                      </p>

                      <div className="flex items-center gap-4">
                        {/* Upload Button */}
                        <label className="cursor-pointer">
                          <div
                            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                              theme === "dark"
                                ? "bg-neutral-700 hover:bg-neutral-600 text-gray-200"
                                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                            }`}
                          >
                            <Upload className="w-3 h-3" />
                            {thumbnails[video.id]
                              ? "Change Thumbnail"
                              : "Upload Thumbnail"}
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleThumbnailChange(
                                  video.id,
                                  e.target.files[0]
                                );
                              }
                            }}
                          />
                        </label>

                        {/* Thumbnail Preview */}
                        {previews[video.id] && (
                          <div className="relative group">
                            <img
                              src={previews[video.id]}
                              className="h-10 w-16 object-cover rounded border border-gray-500"
                            />
                            <button
                              onClick={() => {
                                const newThumbs = { ...thumbnails };
                                delete newThumbs[video.id];
                                setThumbnails(newThumbs);

                                const newPreviews = { ...previews };
                                delete newPreviews[video.id];
                                setPreviews(newPreviews);
                              }}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
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
