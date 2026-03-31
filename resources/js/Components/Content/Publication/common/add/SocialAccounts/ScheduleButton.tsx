import React, { memo } from 'react';
import { Clock } from 'lucide-react';
import { SocialAccount } from './types';
import SchedulePopoverContent from './SchedulePopoverContent';

interface ScheduleButtonProps {
  account: SocialAccount;
  customSchedule?: string | undefined;
  activePopover: number | null;
  onScheduleClick: (e: React.MouseEvent) => void;
  onScheduleChange: (date: string) => void;
  onScheduleRemove: () => void;
  onPopoverClose: () => void;
}

const ScheduleButton = memo(
  ({
    account,
    customSchedule,
    activePopover,
    onScheduleClick,
    onScheduleChange,
    onScheduleRemove,
    onPopoverClose,
  }: ScheduleButtonProps) => {
    return (
      <div className="relative ml-2" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onScheduleClick}
          className={`rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/10 ${
            customSchedule ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'
          }`}
          title="Set individual time"
        >
          <Clock className="h-4 w-4" />
        </button>

        {activePopover === account.id && (
          <div className="animate-in fade-in zoom-in-95 absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-xl dark:border-neutral-600 dark:bg-neutral-800">
            <SchedulePopoverContent
              account={account}
              customSchedule={customSchedule}
              onScheduleChange={onScheduleChange}
              onScheduleRemove={onScheduleRemove}
              onClose={onPopoverClose}
            />
          </div>
        )}
      </div>
    );
  },
);

export default ScheduleButton;
