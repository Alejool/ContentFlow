import Input from "@/Components/common/Modern/Input";
import Select from "@/Components/common/Modern/Select";
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

  const durationOptions = [
    { value: 30, label: t("platformSettings.twitter.30m") },
    { value: 60, label: t("platformSettings.twitter.1h") },
    { value: 1440, label: t("platformSettings.twitter.24h") },
    { value: 4320, label: t("platformSettings.twitter.3d") },
    { value: 10080, label: t("platformSettings.twitter.7d") },
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
          {t("platformSettings.twitter.pollOptions")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((index) => (
            <Input
              key={index}
              id={`poll-option-${index}`}
              placeholder={t("platformSettings.twitter.optionPlaceholder", {
                index: index + 1,
              })}
              value={pollOptions[index] || ""}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              prefix={
                <span className="w-5 h-5 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center text-xs font-medium text-primary-600 dark:text-primary-400">
                  {index + 1}
                </span>
              }
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          {t("platformSettings.twitter.pollDuration")}
        </h3>
        <div className="w-full md:w-1/2">
          <Select
            id="poll-duration"
            options={durationOptions}
            value={pollDuration}
            onChange={(val) => onDurationChange(Number(val))}
            placeholder={t("platformSettings.twitter.pollDuration")}
            dropdownPosition="up"
          />
        </div>
      </div>
    </div>
  );
}
