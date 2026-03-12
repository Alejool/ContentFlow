import Input from "@/Components/common/Modern/Input";
import { Calendar, Clock } from "lucide-react";

interface LiveFieldsProps {
  startTime: string;
  duration: number;
  onChange: (data: { startTime: string; duration: number }) => void;
  t: (key: string) => string;
  errors?: {
    startTime?: string;
    duration?: string;
  };
}

export default function LiveFields({
  startTime,
  duration = 60,
  onChange,
  t,
  errors = {},
}: LiveFieldsProps) {
  
  const handleStartTimeChange = (value: string) => {
    onChange({ startTime: value, duration });
  };

  const handleDurationChange = (value: string) => {
    const numValue = parseInt(value) || 60;
    onChange({ startTime, duration: numValue });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-neutral-700">
        <div className="w-1 h-5 bg-primary-500 rounded-full"></div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
          {t("publications.modal.live.title") || "Live Stream Settings"}
        </h3>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t("publications.modal.live.startTime") || "Start Time"}
        </label>
        <Input
          id="live-start-time"
          type="datetime-local"
          value={startTime}
          onChange={(e) => handleStartTimeChange(e.target.value)}
          variant="filled"
          sizeType="md"
          icon={Calendar}
          error={errors.startTime}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t("publications.modal.live.duration") || "Expected Duration"}
        </label>
        <div className="flex items-center gap-3">
          <Input
            id="live-duration"
            type="number"
            value={duration.toString()}
            onChange={(e) => handleDurationChange(e.target.value)}
            min={15}
            max={480}
            variant="filled"
            sizeType="md"
            className="w-32"
            icon={Clock}
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t("publications.modal.live.minutes") || "minutes"}
          </span>
        </div>
        {errors.duration && (
          <p className="text-xs text-red-500">{errors.duration}</p>
        )}
      </div>

      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
        <p className="text-xs text-purple-700 dark:text-purple-300">
          <strong>{t("common.note") || "Note"}:</strong>{" "}
          {t("publications.modal.live.note") || 
            "Live streaming is supported on YouTube and Facebook. You'll need to configure streaming settings on each platform."}
        </p>
      </div>
    </div>
  );
}
