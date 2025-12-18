import Select from "@/Components/common/Modern/Select";
import Modal from "@/Components/common/ui/Modal";
import { useTheme } from "@/Hooks/useTheme";
import { Facebook, Instagram, Twitter, Video, X, Youtube } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PlatformSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: string;
  settings: any;
  onSettingsChange: (newSettings: any) => void;
}

export default function PlatformSettingsModal({
  isOpen,
  onClose,
  platform,
  settings,
  onSettingsChange,
}: PlatformSettingsModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const renderContent = () => {
    switch (platform.toLowerCase()) {
      case "youtube":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                id="yt_type"
                label={t("publications.modal.platformSettings.youtube.type")}
                options={[
                  {
                    value: "video",
                    label: t(
                      "publications.modal.platformSettings.youtube.video"
                    ),
                  },
                  {
                    value: "short",
                    label: t(
                      "publications.modal.platformSettings.youtube.short"
                    ),
                  },
                ]}
                value={settings?.type || "video"}
                onChange={(val) => onSettingsChange({ ...settings, type: val })}
                theme={theme}
                size="sm"
              />
              <Select
                id="yt_privacy"
                label={t("publications.modal.platformSettings.youtube.privacy")}
                options={[
                  {
                    value: "public",
                    label: t(
                      "publications.modal.platformSettings.youtube.public"
                    ),
                  },
                  {
                    value: "private",
                    label: t(
                      "publications.modal.platformSettings.youtube.private"
                    ),
                  },
                  {
                    value: "unlisted",
                    label: t(
                      "publications.modal.platformSettings.youtube.unlisted"
                    ),
                  },
                ]}
                value={settings?.privacy || "public"}
                onChange={(val) =>
                  onSettingsChange({ ...settings, privacy: val })
                }
                theme={theme}
                size="sm"
              />
              <div className="col-span-full flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  id="yt_kids"
                  checked={settings?.made_for_kids || false}
                  onChange={(e) =>
                    onSettingsChange({
                      ...settings,
                      made_for_kids: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                />
                <label
                  htmlFor="yt_kids"
                  className={`text-sm font-medium ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {t("publications.modal.platformSettings.youtube.madeForKids")}
                </label>
              </div>
            </div>
          </div>
        );

      case "facebook":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              id="fb_type"
              label={t("publications.modal.platformSettings.facebook.type")}
              options={[
                {
                  value: "feed",
                  label: t("publications.modal.platformSettings.facebook.feed"),
                },
                {
                  value: "reel",
                  label: t("publications.modal.platformSettings.facebook.reel"),
                },
              ]}
              value={settings?.type || "feed"}
              onChange={(val) => onSettingsChange({ ...settings, type: val })}
              theme={theme}
              size="sm"
            />
          </div>
        );

      case "instagram":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              id="ig_type"
              label={t("publications.modal.platformSettings.instagram.type")}
              options={[
                {
                  value: "feed",
                  label: t(
                    "publications.modal.platformSettings.instagram.feed"
                  ),
                },
                {
                  value: "reel",
                  label: t(
                    "publications.modal.platformSettings.instagram.reel"
                  ),
                },
                {
                  value: "story",
                  label: t(
                    "publications.modal.platformSettings.instagram.story"
                  ),
                },
              ]}
              value={settings?.type || "feed"}
              onChange={(val) => onSettingsChange({ ...settings, type: val })}
              theme={theme}
              size="sm"
            />
          </div>
        );

      case "tiktok":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              id="tt_privacy"
              label={t("publications.modal.platformSettings.tiktok.privacy")}
              options={[
                {
                  value: "public",
                  label: t("publications.modal.platformSettings.tiktok.public"),
                },
                {
                  value: "friends",
                  label: t(
                    "publications.modal.platformSettings.tiktok.friends"
                  ),
                },
                {
                  value: "private",
                  label: t(
                    "publications.modal.platformSettings.tiktok.private"
                  ),
                },
              ]}
              value={settings?.privacy || "public"}
              onChange={(val) =>
                onSettingsChange({ ...settings, privacy: val })
              }
              theme={theme}
              size="sm"
            />
            <div className="col-span-full flex flex-col gap-2">
              <label
                className={`text-xs font-bold uppercase tracking-tight ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {t("publications.modal.platformSettings.tiktok.interactions")}
              </label>
              <div className="flex flex-wrap gap-4">
                {["comment", "duet", "stitch"].map((action) => (
                  <label
                    key={action}
                    className="flex items-center gap-2 text-sm cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={!settings?.[`disable_${action}`]}
                      onChange={(e) =>
                        onSettingsChange({
                          ...settings,
                          [`disable_${action}`]: !e.target.checked,
                        })
                      }
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                    />
                    <span className="group-hover:text-primary-500 transition-colors capitalize">
                      {t(
                        `publications.modal.platformSettings.tiktok.${action}s`
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case "twitter":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                id="tw_type"
                label={t("publications.modal.platformSettings.twitter.type")}
                options={[
                  {
                    value: "tweet",
                    label: t(
                      "publications.modal.platformSettings.twitter.tweet"
                    ),
                  },
                  {
                    value: "thread",
                    label: t(
                      "publications.modal.platformSettings.twitter.thread"
                    ),
                  },
                  {
                    value: "poll",
                    label: t(
                      "publications.modal.platformSettings.twitter.poll"
                    ),
                  },
                ]}
                value={settings?.type || "tweet"}
                onChange={(val) => onSettingsChange({ ...settings, type: val })}
                theme={theme}
                size="sm"
              />
              {settings?.type === "poll" && (
                <div className="col-span-full space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[0, 1, 2, 3].map((index) => (
                      <input
                        key={index}
                        type="text"
                        placeholder={t(
                          "publications.modal.platformSettings.twitter.optionPlaceholder",
                          { index: index + 1 }
                        )}
                        className={`w-full px-4 py-2 rounded-lg border text-sm ${
                          theme === "dark"
                            ? "bg-neutral-900 border-neutral-700 text-white"
                            : "bg-white border-gray-200"
                        }`}
                        value={settings?.poll_options?.[index] || ""}
                        onChange={(e) => {
                          const newOptions = [
                            ...(settings?.poll_options || []),
                          ];
                          newOptions[index] = e.target.value;
                          onSettingsChange({
                            ...settings,
                            poll_options: newOptions,
                          });
                        }}
                      />
                    ))}
                  </div>
                  <Select
                    id="tw_poll_duration"
                    label={t(
                      "publications.modal.platformSettings.twitter.pollDuration"
                    )}
                    options={[
                      {
                        value: 30,
                        label: t(
                          "publications.modal.platformSettings.twitter.30m"
                        ),
                      },
                      {
                        value: 60,
                        label: t(
                          "publications.modal.platformSettings.twitter.1h"
                        ),
                      },
                      {
                        value: 1440,
                        label: t(
                          "publications.modal.platformSettings.twitter.24h"
                        ),
                      },
                    ]}
                    value={settings?.poll_duration || 1440}
                    onChange={(val) =>
                      onSettingsChange({
                        ...settings,
                        poll_duration: Number(val),
                      })
                    }
                    theme={theme}
                    size="sm"
                  />
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getPlatformIcon = () => {
    switch (platform.toLowerCase()) {
      case "youtube":
        return <Youtube className="w-5 h-5 text-red-500" />;
      case "facebook":
        return <Facebook className="w-5 h-5 text-blue-500" />;
      case "tiktok":
        return <Video className="w-5 h-5 text-black dark:text-white" />;
      case "twitter":
        return <Twitter className="w-5 h-5 text-sky-500" />;
      case "instagram":
        return <Instagram className="w-5 h-5 text-pink-500" />;
      default:
        return null;
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose} maxWidth="lg">
      <div
        className={`p-6 ${
          theme === "dark"
            ? "bg-neutral-800 text-white"
            : "bg-white text-gray-900"
        }`}
      >
        <div className="flex items-center justify-between mb-6 border-b pb-4 border-gray-200 dark:border-neutral-700">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                theme === "dark" ? "bg-neutral-700" : "bg-gray-100"
              }`}
            >
              {getPlatformIcon()}
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {t(
                  `publications.modal.platformSettings.${platform.toLowerCase()}.title`
                ) || `${platform} Settings`}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("common.adjustOptions")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-2">{renderContent()}</div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-all shadow-lg shadow-primary-500/20 active:scale-95 text-sm"
          >
            {t("common.done") || "Listo"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
