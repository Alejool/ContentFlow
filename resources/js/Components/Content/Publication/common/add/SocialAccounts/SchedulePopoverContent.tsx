import Button from '@/Components/common/Modern/Button';
import DatePickerModern from '@/Components/common/Modern/DatePicker';
import { useTimezoneStore } from '@/stores/common/timezoneStore';
import { format, parseISO } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { X } from 'lucide-react';
import { memo } from 'react';
import type { SocialAccount } from '@/types/Content/socialAccounts';

interface SchedulePopoverContentProps {
  account: SocialAccount;
  customSchedule?: string | undefined;
  onScheduleChange: (date: string) => void;
  onScheduleRemove: () => void;
  onClose: () => void;
}

const SchedulePopoverContent = memo(
  ({
    account,
    customSchedule,
    onScheduleChange,
    onScheduleRemove,
    onClose,
  }: SchedulePopoverContentProps) => {
    const timezone = useTimezoneStore.getState().effectiveTimezone();

    // Convert UTC ISO → workspace-timezone Date for display.
    // toZonedTime shifts the Date's UTC value so that browser-local getHours()
    // returns the workspace-timezone hour — the picker then shows the right time.
    const selectedDate = customSchedule
      ? toZonedTime(parseISO(customSchedule), timezone)
      : null;

    const handleChange = (date: Date | null) => {
      if (!date) {
        onScheduleRemove();
        return;
      }
      // date.getHours() / getMinutes() are in browser-local context.
      // Because we passed toZonedTime as selected, browser-local == workspace-local,
      // so we can treat the browser-local reading as the workspace time the user chose.
      // Stringify without timezone suffix → fromZonedTime parses it as workspace-tz → UTC.
      const localStr = format(date, "yyyy-MM-dd'T'HH:mm");
      const utcDate = fromZonedTime(localStr, timezone);
      onScheduleChange(utcDate.toISOString());
    };

    return (
      <>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold capitalize text-gray-900 dark:text-neutral-100">
            {account.platform}
          </h4>
          <Button
            variant="ghost"
            size="xs"
            buttonStyle="icon"
            onClick={onClose}
            icon={X}
            className="!p-1"
          >
            {''}
          </Button>
        </div>

        <DatePickerModern
          selected={selectedDate}
          onChange={handleChange}
          showTimeSelect
          placeholder="Seleccionar fecha y hora"
          dateFormat="dd/MM/yyyy HH:mm"
          minDate={new Date()}
          withPortal
          popperPlacement="bottom-start"
          isClearable
          showTimezone
        />

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="primary" size="sm" onClick={onClose}>
            Listo
          </Button>
        </div>
      </>
    );
  },
);

export default SchedulePopoverContent;
