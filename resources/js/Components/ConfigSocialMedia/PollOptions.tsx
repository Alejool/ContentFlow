import { useTheme } from "@/Hooks/useTheme";
import { useTranslation } from "react-i18next";

interface PollOptionsProps {
  pollOptions: string[];
  pollDuration: number;
  onOptionsChange: (options: string[]) => void;
  onDurationChange: (duration: number) => void;
}

export default function PollOptions({
  pollOptions = [],
  pollDuration = 1440,
  onOptionsChange,
  onDurationChange,
}: PollOptionsProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const durations = [
    { value: 30, label: t("publications.modal.platformSettings.twitter.30m") },
    { value: 60, label: t("publications.modal.platformSettings.twitter.1h") },
    {
      value: 1440,
      label: t("publications.modal.platformSettings.twitter.24h"),
    },
  ];

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    onOptionsChange(newOptions);
  };

  return (
    <div className="space-y-6 border-t border-gray-200 dark:border-neutral-700 pt-6">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          {t("publications.modal.platformSettings.twitter.pollOptions")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="relative">
              <input
                type="text"
                placeholder={t(
                  "publications.modal.platformSettings.twitter.optionPlaceholder",
                  { index: index + 1 }
                )}
                className={`w-full px-4 py-3 rounded-lg border text-sm pl-10 ${
                  theme === "dark"
                    ? "bg-neutral-900 border-neutral-700 text-white"
                    : "bg-white border-gray-200"
                }`}
                value={pollOptions[index] || ""}
                onChange={(e) => handleOptionChange(index, e.target.value)}
              />
              <div className="absolute left-3 top-3 w-5 h-5 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center text-xs font-medium text-primary-600 dark:text-primary-400">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          {t("publications.modal.platformSettings.twitter.pollDuration")}
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {durations.map((duration) => (
            <label
              key={duration.value}
              className="flex flex-col items-center p-3 border border-gray-200 dark:border-neutral-700 rounded-lg hover:border-primary-500 cursor-pointer"
            >
              <div className="w-8 h-8 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-center justify-center mb-2">
                <svg
                  className="w-4 h-4 text-primary-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {duration.label}
              </span>
              <div
                className={`mt-2 w-4 h-4 rounded-full border flex items-center justify-center ${
                  pollDuration === duration.value
                    ? "border-primary-500 bg-primary-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              >
                {pollDuration === duration.value && (
                  <svg
                    className="w-2 h-2 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <input
                type="radio"
                value={duration.value}
                checked={pollDuration === duration.value}
                onChange={() => onDurationChange(duration.value)}
                className="hidden"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
