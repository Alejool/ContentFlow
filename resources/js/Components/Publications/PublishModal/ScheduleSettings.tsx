import { DateTimePicker } from '@/Components/common/DateTimePicker';
import Switch from '@/Components/common/Modern/Switch';

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

      <Switch
        label="Programar publicación"
        isSelected={schedulePost}
        onChange={onScheduleChange}
        size="sm"
        labelPosition="right"
        containerClassName="mb-3"
      />

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
