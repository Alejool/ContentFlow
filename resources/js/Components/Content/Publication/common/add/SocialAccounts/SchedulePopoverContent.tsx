import React, { memo } from 'react';
import Button from '@/Components/common/Modern/Button';
import DatePickerModern from '@/Components/common/Modern/DatePicker';
import { parseISO } from 'date-fns';
import { X } from 'lucide-react';
import { SocialAccount } from './types';

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
    return (
      <>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Schedule for {account.platform}
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
          selected={customSchedule ? parseISO(customSchedule) : null}
          onChange={(date: Date | null) => {
            if (date) {
              onScheduleChange(date.toISOString());
            } else {
              onScheduleRemove();
            }
          }}
          showTimeSelect
          placeholder="Select date & time"
          dateFormat="dd/MM/yyyy HH:mm"
          minDate={new Date()}
          withPortal
          popperPlacement="bottom-start"
          isClearable
        />

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </>
    );
  },
);

export default SchedulePopoverContent;
