import { validateDate } from '@/Utils/dateValidation';
import { CalendarDate } from '@internationalized/date';
import { AlertTriangle } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
  Calendar as AriaCalendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  I18nProvider,
} from 'react-aria-components';
import { useTranslation } from 'react-i18next';

interface DateTimePickerProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  showWarningForPastDates?: boolean;
  className?: string;
}

const dateToCalendarDate = (d: Date) =>
  new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  selectedDate,
  onChange,
  minDate,
  showWarningForPastDates = true,
  className = '',
}) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith('es') ? 'es-ES' : 'en-US';
  const validation = useMemo(() => validateDate(selectedDate), [selectedDate]);

  const [hours, setHours] = useState(selectedDate.getHours().toString().padStart(2, '0'));
  const [minutes, setMinutes] = useState(selectedDate.getMinutes().toString().padStart(2, '0'));

  const handleCalendarChange = (val: CalendarDate | null) => {
    if (!val) return;
    const d = new Date(val.year, val.month - 1, val.day);
    d.setHours(parseInt(hours) || 0);
    d.setMinutes(parseInt(minutes) || 0);
    const result = validateDate(d);
    if (result.isValid) onChange(d);
  };

  const applyTime = (h: string, m: string) => {
    const d = new Date(selectedDate);
    d.setHours(parseInt(h) || 0);
    d.setMinutes(parseInt(m) || 0);
    const result = validateDate(d);
    if (result.isValid) onChange(d);
  };

  const minCalendarDate = minDate ? dateToCalendarDate(minDate) : undefined;

  return (
    <I18nProvider locale={locale}>
      <div className={`space-y-3 ${className}`}>
        <div className="flex justify-center">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
            <AriaCalendar
              value={dateToCalendarDate(selectedDate)}
              onChange={handleCalendarChange}
              minValue={minCalendarDate}
              className="p-3"
            >
              <CalendarGrid>
                <CalendarGridHeader>
                  {(day: string) => (
                    <CalendarHeaderCell className="w-9 pb-2 text-center text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {day}
                    </CalendarHeaderCell>
                  )}
                </CalendarGridHeader>
                <CalendarGridBody>
                  {(date: CalendarDate) => (
                    <CalendarCell
                      date={date}
                      className={({ isSelected, isDisabled, isToday }: { isSelected: boolean; isDisabled: boolean; isToday: boolean }) =>
                        [
                          'flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-sm font-medium transition-all',
                          isSelected ? 'bg-blue-500 font-bold text-white shadow scale-105'
                            : isToday ? 'border-2 border-blue-500 font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : isDisabled ? 'cursor-not-allowed opacity-30'
                            : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-200 dark:hover:bg-neutral-700',
                        ].join(' ')
                      }
                    >
                      {({ formattedDate }: { formattedDate: string }) => formattedDate}
                    </CalendarCell>
                  )}
                </CalendarGridBody>
              </CalendarGrid>
            </AriaCalendar>

            {/* Time row */}
            <div className="flex items-center justify-center gap-2 border-t border-gray-200 px-4 py-3 dark:border-neutral-700">
              <input
                type="number" min={0} max={23} value={hours}
                onChange={e => { setHours(e.target.value.padStart(2, '0')); applyTime(e.target.value, minutes); }}
                className="w-14 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-center text-lg font-bold text-gray-900 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
              />
              <span className="text-xl font-bold text-gray-600 dark:text-gray-300">:</span>
              <input
                type="number" min={0} max={59} value={minutes}
                onChange={e => { setMinutes(e.target.value.padStart(2, '0')); applyTime(hours, e.target.value); }}
                className="w-14 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-center text-lg font-bold text-gray-900 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {!validation.isValid && validation.error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                {validation.isPastDate
                  ? t('calendar.validation.past_date_error', 'Cannot Schedule in the Past')
                  : t('calendar.validation.invalid_date', 'Invalid Date')}
              </p>
              <p className="mt-1 text-xs text-red-600 dark:text-red-300">
                {validation.isPastDate
                  ? t('calendar.validation.past_date_message', 'You cannot schedule events for past dates. Please select a future date and time.')
                  : validation.error}
              </p>
            </div>
          </div>
        )}

        {validation.isValid && (
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('calendar.selected_date', 'Selected date:')}</p>
            <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
              {selectedDate.toLocaleString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}
      </div>
    </I18nProvider>
  );
};
