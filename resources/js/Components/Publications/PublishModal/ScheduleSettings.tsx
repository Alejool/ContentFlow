import { DateTimePicker } from '@/Components/common/DateTimePicker';

interface ScheduleSettingsProps {
  schedulePost: boolean;
  scheduledAt: string;
  onScheduleChange: (schedule: boolean) => void;
  onScheduledAtChange: (date: string) => void;
}

export default function ScheduleSettings({
  schedulePost,
  scheduledAt,
  onScheduleChange,
  onScheduledAtChange,
}: ScheduleSettingsProps) {
  return (
    <div className="mb-6">
      <h3 className="mb-3 text-base font-semibold text-gray-700 dark:text-gray-300">
        Configuración
      </h3>

      <label className="mb-3 flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={schedulePost}
          onChange={(e) => onScheduleChange(e.target.checked)}
          className="rounded"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">Programar publicación</span>
      </label>

      {schedulePost && (
        <div className="ml-7">
          <DateTimePicker
            value={scheduledAt}
            onChange={(value) => onScheduledAtChange(value || '')}
            required
          />
        </div>
      )}
    </div>
  );
}
