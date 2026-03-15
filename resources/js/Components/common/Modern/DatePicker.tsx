import Button from '@/Components/common/Modern/Button';
import Input from '@/Components/common/Modern/Input';
import Select from '@/Components/common/Modern/Select';
import { useTimezoneStore } from '@/stores/timezoneStore';
import { toLocalDate, toUTC } from '@/Utils/timezoneUtils';
import { CalendarDate } from '@internationalized/date';
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  X,
} from 'lucide-react';
import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar as AriaCalendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  I18nProvider,
} from 'react-aria-components';
import { FieldValues, UseFormRegister } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const getColor = (color: string, alpha: string = '1'): string => {
  if (!color) return color;
  const alphaMap: Record<string, string> = {
    dd: '0.86', '60': '0.37', '10': '0.06', '05': '0.03',
    '20': '0.12', '50': '0.5', '70': '0.7',
  };
  const a = alphaMap[alpha] ?? alpha;
  if (color.startsWith('primary-')) return `rgb(var(--${color}) / ${a})`;
  if (color.startsWith('#') && a !== '1') {
    const hex = color.length === 4
      ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
      : color;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  return color;
};

interface DatePickerProps<T extends FieldValues> {
  selected?: Date | null;
  onChange: (date: Date | null) => void;
  showTimeSelect?: boolean;
  placeholder?: string;
  minDate?: Date;
  minTime?: Date;
  maxTime?: Date;
  allowPastDates?: boolean;
  className?: string;
  dateFormat?: string;
  isClearable?: boolean;
  popperPlacement?: 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';
  withPortal?: boolean;
  showMonthDropdown?: boolean;
  showYearDropdown?: boolean;
  dropdownMode?: 'scroll' | 'select';
  register?: UseFormRegister<T>;
  label?: string;
  error?: string;
  name?: string;
  success?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outlined' | 'filled';
  containerClassName?: string;
  activeColor?: string;
  id?: string;
  useUTC?: boolean;
  showTimezone?: boolean;
  yearRange?: { past: number; future: number };
}

const dateToCalendarDate = (d: Date): CalendarDate =>
  new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());

const calendarDateToDate = (cd: CalendarDate): Date =>
  new Date(cd.year, cd.month - 1, cd.day);

const CustomTimeSelector = ({
  date,
  onChange,
  currentLocale,
  activeColor = 'primary-500',
}: {
  date: Date | null;
  onChange: (date: Date) => void;
  currentLocale: string;
  activeColor?: string;
}) => {
  const [hours, setHours] = useState(date ? date.getHours().toString().padStart(2, '0') : '12');
  const [minutes, setMinutes] = useState(date ? date.getMinutes().toString().padStart(2, '0') : '00');
  const [isFocused, setIsFocused] = useState<{ h: boolean; m: boolean }>({ h: false, m: false });

  useEffect(() => {
    if (date && !isFocused.h && !isFocused.m) {
      setHours(date.getHours().toString().padStart(2, '0'));
      setMinutes(date.getMinutes().toString().padStart(2, '0'));
    }
  }, [date, isFocused]);

  const updateTime = (h: number, m: number) => {
    const d = date ? new Date(date) : new Date();
    d.setHours(h); d.setMinutes(m);
    onChange(d);
  };

  const incH = () => { const h = (parseInt(hours) + 1) % 24; setHours(h.toString().padStart(2, '0')); updateTime(h, parseInt(minutes) || 0); };
  const decH = () => { const h = parseInt(hours) === 0 ? 23 : parseInt(hours) - 1; setHours(h.toString().padStart(2, '0')); updateTime(h, parseInt(minutes) || 0); };
  const incM = () => { const m = (parseInt(minutes) + 1) % 60; setMinutes(m.toString().padStart(2, '0')); updateTime(parseInt(hours) || 0, m); };
  const decM = () => { const m = parseInt(minutes) === 0 ? 59 : parseInt(minutes) - 1; setMinutes(m.toString().padStart(2, '0')); updateTime(parseInt(hours) || 0, m); };

  const syncTime = () => {
    const h = parseInt(hours); const m = parseInt(minutes);
    if (!isNaN(h) && h >= 0 && h <= 23 && !isNaN(m) && m >= 0 && m <= 59) updateTime(h, m);
  };

  const handleBlur = (field: 'h' | 'm') => {
    setIsFocused(prev => ({ ...prev, [field]: false }));
    if (field === 'h') setHours(prev => (prev === '' ? '00' : prev.padStart(2, '0')));
    else setMinutes(prev => (prev === '' ? '00' : prev.padStart(2, '0')));
    setTimeout(syncTime, 0);
  };

  return (
    <div className="flex w-full flex-shrink-0 flex-col border-t border-gray-100 bg-white pb-14 dark:border-neutral-800 dark:bg-neutral-900 md:w-[220px] md:border-l md:border-t-0">
      <div className="flex h-12 items-center justify-center gap-1.5 border-b border-gray-100 bg-white px-3 text-[0.8125rem] font-semibold text-gray-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-gray-300 md:h-16 md:gap-2 md:px-4 md:text-sm">
        <Clock className="h-3.5 w-3.5 md:h-4 md:w-4" />
        <span>{currentLocale === 'es' ? 'Seleccionar Hora' : 'Select Time'}</span>
      </div>
      <div className="flex flex-1 items-center justify-center gap-3 px-2 py-4 md:gap-6 md:px-4 md:py-10">
        <div className="flex flex-col items-center gap-1.5 md:gap-3">
          <Button
            type="button"
            buttonStyle="icon"
            variant="ghost"
            size="xs"
            shadow="none"
            onClick={incH}
            icon={ChevronUp}
          >
            <span className="sr-only">Increment hours</span>
          </Button>
          <Input 
            id="time-hours" 
            type="text" 
            value={hours}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { let v = e.target.value.replace(/\D/g, ''); if (v.length > 2) v = v.slice(-2); setHours(v); }}
            onFocus={() => setIsFocused(p => ({ ...p, h: true }))}
            onBlur={() => handleBlur('h')}
            className="!w-10 !p-0.5 !text-center !text-lg font-bold md:!w-16 md:!p-2 md:!text-2xl" 
            sizeType="lg" 
            maxLength={2} 
            activeColor={activeColor} 
          />
          <Button
            type="button"
            buttonStyle="icon"
            variant="ghost"
            size="xs"
            shadow="none"
            onClick={decH}
            icon={ChevronDown}
          >
            <span className="sr-only">Decrement hours</span>
          </Button>
          <span className="text-[0.5625rem] font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-600 md:text-[0.6875rem]">
            {currentLocale === 'es' ? 'Horas' : 'Hours'}
          </span>
        </div>
        <div className="-mt-0.5 self-center text-xl font-semibold text-gray-400 dark:text-neutral-600 md:-mt-2 md:text-4xl">:</div>
        <div className="flex flex-col items-center gap-1.5 md:gap-3">
          <Button
            type="button"
            buttonStyle="icon"
            variant="ghost"
            size="xs"
            shadow="none"
            onClick={incM}
            icon={ChevronUp}
          >
            <span className="sr-only">Increment minutes</span>
          </Button>
          <Input 
            id="time-minutes" 
            type="text" 
            value={minutes}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { let v = e.target.value.replace(/\D/g, ''); if (v.length > 2) v = v.slice(-2); setMinutes(v); }}
            onFocus={() => setIsFocused(p => ({ ...p, m: true }))}
            onBlur={() => handleBlur('m')}
            className="!w-10 !p-0.5 !text-center !text-lg font-bold md:!w-16 md:!p-2 md:!text-2xl" 
            sizeType="lg" 
            maxLength={2} 
            activeColor={activeColor} 
          />
          <Button
            type="button"
            buttonStyle="icon"
            variant="ghost"
            size="xs"
            shadow="none"
            onClick={decM}
            icon={ChevronDown}
          >
            <span className="sr-only">Decrement minutes</span>
          </Button>
          <span className="text-[0.5625rem] font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-600 md:text-[0.6875rem]">
            {currentLocale === 'es' ? 'Minutos' : 'Minutes'}
          </span>
        </div>
      </div>
    </div>
  );
};

const DatePickerModern = <T extends FieldValues>({
  selected,
  onChange,
  showTimeSelect = false,
  placeholder = 'Select date',
  minDate,
  allowPastDates = false,
  isClearable = true,
  popperPlacement = 'bottom-start',
  label,
  error,
  name,
  success,
  hint,
  required = false,
  disabled = false,
  icon,
  size = 'md',
  variant = 'default',
  containerClassName = '',
  activeColor = 'primary-500',
  id,
  useUTC = false,
  showTimezone = false,
  yearRange = { past: 1, future: 50 },
}: DatePickerProps<T>) => {
  const { i18n } = useTranslation();
  const { timezoneLabel } = useTimezoneStore();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const currentLocale = i18n.language.startsWith('es') ? 'es' : 'en';

  const displayDate: Date | null = useMemo(() => {
    if (!selected) return null;
    if (useUTC) return toLocalDate(selected.toISOString());
    return selected;
  }, [selected, useUTC]);

  const handleDateChange = (date: Date | null) => {
    if (!date) { onChange(null); return; }
    if (useUTC) { const s = toUTC(date); onChange(s ? new Date(s) : date); } else { onChange(date); }
  };

  const handleCalendarChange = (val: CalendarDate | null) => {
    if (!val) { handleDateChange(null); return; }
    const newDate = calendarDateToDate(val);
    if (showTimeSelect && displayDate) {
      newDate.setHours(displayDate.getHours());
      newDate.setMinutes(displayDate.getMinutes());
    } else if (showTimeSelect) {
      const n = new Date();
      newDate.setHours(n.getHours()); newDate.setMinutes(n.getMinutes());
    }
    handleDateChange(newDate);
    if (!showTimeSelect) setIsOpen(false);
  };

  const calendarValue = displayDate ? dateToCalendarDate(displayDate) : null;
  const minCalendarDate = allowPastDates ? undefined : (minDate ? dateToCalendarDate(minDate) : dateToCalendarDate(new Date()));

  const formattedValue = displayDate
    ? showTimeSelect
      ? displayDate.toLocaleString(currentLocale === 'es' ? 'es-ES' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })
      : displayDate.toLocaleDateString(currentLocale === 'es' ? 'es-ES' : 'en-US', { dateStyle: 'medium' })
    : '';

  const [navDate, setNavDate] = useState<Date>(displayDate ?? new Date());
  const [focusedValue, setFocusedValue] = useState<CalendarDate>(
    new CalendarDate(
      (displayDate ?? new Date()).getFullYear(),
      (displayDate ?? new Date()).getMonth() + 1,
      1
    )
  );
  const [userNavigating, setUserNavigating] = useState(false);
  
  // Solo sincronizar navDate con displayDate cuando displayDate cambia Y el usuario NO está navegando
  useEffect(() => { 
    if (displayDate && !userNavigating) {
      setNavDate(displayDate);
      setFocusedValue(new CalendarDate(displayDate.getFullYear(), displayDate.getMonth() + 1, 1));
    }
  }, [displayDate]);

  // Actualizar focusedValue cuando navDate cambia (por los selects o botones)
  useEffect(() => {
    setFocusedValue(new CalendarDate(navDate.getFullYear(), navDate.getMonth() + 1, 1));
  }, [navDate]);
  
  // Resetear userNavigating cuando se cierra el picker
  useEffect(() => {
    if (!isOpen) {
      setUserNavigating(false);
    }
  }, [isOpen]);

  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: yearRange.past + yearRange.future + 1 }, 
    (_, i) => currentYear - yearRange.past + i
  );
  const monthsEs = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const monthsEn = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const months = currentLocale === 'es' ? monthsEs : monthsEn;
  const monthOptions = months.map((m, i) => ({ value: i, label: m }));
  const yearOptions = years.map(y => ({ value: y, label: y.toString() }));

  const formatDisplayDate = (date: Date | null): string => {
    if (!date) return currentLocale === 'es' ? 'Sin fecha seleccionada' : 'No date selected';
    
    const options: Intl.DateTimeFormatOptions = showTimeSelect
      ? { dateStyle: 'medium', timeStyle: 'short' }
      : { dateStyle: 'medium' };
    
    const formatted = date.toLocaleString(
      currentLocale === 'es' ? 'es-ES' : 'en-US',
      options
    );
    
    // Truncar si es muy largo (más de 30 caracteres)
    return formatted.length > 30 ? `${formatted.substring(0, 27)}...` : formatted;
  };

  return (
    <I18nProvider locale={currentLocale === 'es' ? 'es-ES' : 'en-US'}>
      <div className={`relative ${containerClassName}`} ref={triggerRef}>
        {showTimezone && useUTC && (
          <div className="mb-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="h-3 w-3" />{timezoneLabel()}
          </div>
        )}
        <div onClick={() => { if (!disabled) setIsOpen(o => !o); }}>
          <Input
            id={id ?? name ?? 'datepicker-input'}
            value={formattedValue}
            onChange={() => {}}
            label={label ?? ''} error={error ?? ''} success={success ?? ''} hint={hint ?? ''}
            required={required} disabled={disabled} variant={variant}
            sizeType={size === 'md' ? 'md' : size === 'lg' ? 'lg' : 'sm'}
            icon={(icon as React.ReactNode) ?? (showTimeSelect ? Clock : Calendar)}
            activeColor={activeColor} placeholder={placeholder}
            containerClassName="w-full" autoComplete="off"
            className="cursor-pointer" readOnly
          />
        </div>
        {isOpen && !disabled && (
          <>
            <div className="fixed inset-0 z-[9998] bg-black/10 backdrop-blur-[2px]" onClick={() => setIsOpen(false)} />
            <div
              className="fixed left-1/2 top-1/2 z-[9999] max-h-[90vh] w-full  -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border-2 border-primary-100 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900 sm:max-w-fit"
            >
              <div className="flex flex-col md:flex-row max-w-full justify-center overflow-auto">
                <div className="">
                  <div
                    className="flex h-16 items-center justify-between gap-3 border-b border-gray-100 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-900"
                    style={{ borderTopLeftRadius: '0.75rem', borderTopRightRadius: showTimeSelect ? 0 : '0.75rem' }}
                  >
                    <Button
                      type="button"
                      buttonStyle="icon"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setUserNavigating(true);
                        setNavDate(d => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n; });
                      }}
                      icon={ChevronLeft}
                    >
                      <span className="sr-only">Previous month</span>
                    </Button>
                    <div className="flex flex-1 items-center justify-center gap-2">
                      <div className="w-[140px]">
                        <Select 
                          id="dp-month" 
                          options={monthOptions} 
                          value={navDate.getMonth()}
                          onChange={(v: string | number | string[]) => {
                            const month = Number(v);
                            setUserNavigating(true);
                            setNavDate(d => {
                              const n = new Date(d);
                              n.setMonth(month);
                              return n;
                            });
                          }}
                          size="sm" 
                          usePortal={false} 
                        />
                      </div>
                      <div className="w-[100px]">
                        <Select 
                          id="dp-year" 
                          options={yearOptions} 
                          value={navDate.getFullYear()}
                          onChange={(v: string | number | string[]) => {
                            const year = Number(v);
                            setUserNavigating(true);
                            setNavDate(d => {
                              const n = new Date(d);
                              n.setFullYear(year);
                              return n;
                            });
                          }}
                          size="sm" 
                          usePortal={false}
                          searchable
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      buttonStyle="icon"
                      variant="ghost"
                      size="sm"
                      rounded="lg"
                      shadow="none"
                      onClick={() => {
                        setUserNavigating(true);
                        setNavDate(d => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n; });
                      }}
                      icon={ChevronRight}
                    >
                      <span className="sr-only">Next month</span>
                    </Button>
                  </div>

                  <AriaCalendar
                    key={`${navDate.getFullYear()}-${navDate.getMonth()}`}
                    value={calendarValue}
                    onChange={handleCalendarChange}
                    minValue={minCalendarDate}
                    focusedValue={focusedValue}
                    onFocusChange={(fv: CalendarDate) => {
                      setNavDate(new Date(fv.year, fv.month - 1, fv.day));
                      setFocusedValue(fv);
                    }}
                    className="p-3"
                  >
                    <CalendarGrid className="w-full">
                      <CalendarGridHeader>
                        {(day: string) => (
                          <CalendarHeaderCell className="w-10 pb-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                            {day}
                          </CalendarHeaderCell>
                        )}
                      </CalendarGridHeader>
                      <CalendarGridBody>
                        {(date: CalendarDate) => (
                          <CalendarCell
                            date={date}
                            className={({ isSelected, isDisabled, isToday, isFocused: isFoc }: { isSelected: boolean; isDisabled: boolean; isToday: boolean; isFocused: boolean }) =>
                              [
                                'flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-sm font-medium transition-all duration-200',
                                isSelected ? 'scale-105 bg-primary-500 font-semibold text-white shadow-lg shadow-primary-500/30'
                                  : isToday ? 'border-2 border-primary-500 bg-primary-50 font-semibold text-primary-600 dark:bg-primary-500/10 dark:text-primary-400'
                                  : isDisabled ? 'cursor-not-allowed text-gray-300 dark:text-gray-700'
                                  : 'text-gray-700 hover:scale-105 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-800',
                                isFoc && !isSelected ? 'ring-2 ring-primary-400/40 ring-offset-2 dark:ring-offset-neutral-900' : '',
                              ].join(' ')
                            }
                          >
                            {({ formattedDate }: { formattedDate: string }) => formattedDate}
                          </CalendarCell>
                        )}
                      </CalendarGridBody>
                    </CalendarGrid>
                  </AriaCalendar>

                  {/* Footer */}
                  <div
                    className="absolute bottom-0 left-0 right-0 flex min-h-14 items-center justify-between gap-3 border-t border-gray-100 bg-white px-4 py-3 text-sm dark:border-neutral-800 dark:bg-neutral-900"
                    style={{ borderBottomLeftRadius: '0.75rem', borderBottomRightRadius: showTimeSelect ? 0 : '0.75rem' }}
                  >
                    <div className="flex flex-1 items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Calendar className="h-4 w-4 flex-shrink-0 text-gray-400" />
                      <span className="truncate">
                        {formatDisplayDate(displayDate)}
                      </span>
                      {showTimezone && useUTC && (
                        <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">({timezoneLabel()})</span>
                      )}
                    </div>
                    {isClearable && displayDate && (
                      <Button
                        type="button"
                        buttonStyle="ghost"
                        variant="ghost"
                        size="sm"
                        rounded="lg"
                        shadow="none"
                        className="!gap-1.5"
                        onClick={e => { e.stopPropagation(); handleDateChange(null); setIsOpen(false); }}
                        icon={X}
                      >
                        {currentLocale === 'es' ? 'Limpiar' : 'Clear'}
                      </Button>
                    )}
                  </div>
                </div>

                {showTimeSelect && (
                  <CustomTimeSelector
                    date={displayDate}
                    onChange={d => handleDateChange(d)}
                    currentLocale={currentLocale}
                    activeColor={activeColor}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </I18nProvider>
  );
};

export default DatePickerModern;
export { DatePickerModern as DatePicker };
