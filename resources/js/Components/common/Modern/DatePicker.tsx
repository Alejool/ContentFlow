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
    <div className="custom-time-selector">
      <div className="time-selector-header">
        <Clock className="h-4 w-4" />
        <span className="text-base font-medium">{currentLocale === 'es' ? 'Seleccionar Hora' : 'Select Time'}</span>
      </div>
      <div className="time-selector-body">
        <div className="time-input-group">
          <button type="button" className="time-spinner-btn" onClick={incH}><ChevronUp className="h-4 w-4" /></button>
          <Input id="time-hours" type="text" value={hours}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { let v = e.target.value.replace(/\D/g, ''); if (v.length > 2) v = v.slice(-2); setHours(v); }}
            onFocus={() => setIsFocused(p => ({ ...p, h: true }))}
            onBlur={() => handleBlur('h')}
            className="w-16 !p-2 !text-center !text-2xl font-bold" sizeType="lg" maxLength={2} activeColor={activeColor} />
          <button type="button" className="time-spinner-btn" onClick={decH}><ChevronDown className="h-4 w-4" /></button>
          <span className="time-label">{currentLocale === 'es' ? 'Horas' : 'Hours'}</span>
        </div>
        <div className="time-separator">:</div>
        <div className="time-input-group">
          <button type="button" className="time-spinner-btn" onClick={incM}><ChevronUp className="h-4 w-4" /></button>
          <Input id="time-minutes" type="text" value={minutes}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { let v = e.target.value.replace(/\D/g, ''); if (v.length > 2) v = v.slice(-2); setMinutes(v); }}
            onFocus={() => setIsFocused(p => ({ ...p, m: true }))}
            onBlur={() => handleBlur('m')}
            className="w-16 !p-2 !text-center !text-2xl font-bold" sizeType="lg" maxLength={2} activeColor={activeColor} />
          <button type="button" className="time-spinner-btn" onClick={decM}><ChevronDown className="h-4 w-4" /></button>
          <span className="time-label">{currentLocale === 'es' ? 'Minutos' : 'Minutes'}</span>
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
  useEffect(() => { if (displayDate) setNavDate(displayDate); }, [displayDate]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 101 }, (_, i) => currentYear - 50 + i);
  const monthsEs = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const monthsEn = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const months = currentLocale === 'es' ? monthsEs : monthsEn;
  const monthOptions = months.map((m, i) => ({ value: i, label: m }));
  const yearOptions = years.map(y => ({ value: y, label: y.toString() }));
  const focusedValue = new CalendarDate(navDate.getFullYear(), navDate.getMonth() + 1, 1);
  const isEndPlacement = popperPlacement.includes('end');
  const isTopPlacement = popperPlacement.startsWith('top');

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
            <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
            <div
              className="absolute z-[9999] mt-1 overflow-visible rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"
              style={{
                [isEndPlacement ? 'right' : 'left']: 0,
                [isTopPlacement ? 'bottom' : 'top']: '100%',
              }}
            >
              <div className="flex flex-col sm:flex-row">
                <div className="relative pb-14">
                  <div
                    className="flex h-[4.5rem] items-center justify-between gap-2 border-b border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 px-3 dark:border-neutral-700 dark:from-neutral-800 dark:to-neutral-900"
                    style={{ borderTopLeftRadius: '0.75rem', borderTopRightRadius: showTimeSelect ? 0 : '0.75rem' }}
                  >
                    <button type="button"
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition hover:scale-105 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-200"
                      onClick={() => setNavDate(d => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n; })}>
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="flex flex-1 items-center justify-center gap-2">
                      <div className="w-[130px]">
                        <Select id="dp-month" options={monthOptions} value={navDate.getMonth()}
                          onChange={(v: string | number | string[]) => setNavDate(d => { const n = new Date(d); n.setMonth(Number(v)); return n; })}
                          size="sm" usePortal={false} />
                      </div>
                      <div className="w-[100px]">
                        <Select id="dp-year" options={yearOptions} value={navDate.getFullYear()}
                          onChange={(v: string | number | string[]) => setNavDate(d => { const n = new Date(d); n.setFullYear(Number(v)); return n; })}
                          size="sm" usePortal={false} />
                      </div>
                    </div>
                    <button type="button"
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition hover:scale-105 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-200"
                      onClick={() => setNavDate(d => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n; })}>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <AriaCalendar
                    value={calendarValue}
                    onChange={handleCalendarChange}
                    minValue={minCalendarDate}
                    focusedValue={focusedValue}
                    onFocusChange={(fv: CalendarDate) => setNavDate(new Date(fv.year, fv.month - 1, fv.day))}
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
                            className={({ isSelected, isDisabled, isToday, isFocused: isFoc }: { isSelected: boolean; isDisabled: boolean; isToday: boolean; isFocused: boolean }) =>
                              [
                                'flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-sm font-medium transition-all',
                                isSelected ? 'scale-105 bg-primary-500/70 font-bold text-white shadow'
                                  : isToday ? 'border-2 border-primary-500 bg-primary-500/10 font-bold text-primary-500 dark:bg-primary-500/20'
                                  : isDisabled ? 'cursor-not-allowed opacity-30'
                                  : 'text-gray-700 hover:scale-110 hover:bg-primary-500/10 hover:text-primary-500 dark:text-gray-200 dark:hover:bg-neutral-700 dark:hover:text-white',
                                isFoc && !isSelected ? 'ring-2 ring-primary-500/50' : '',
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
                    className="absolute bottom-0 left-0 right-0 flex min-h-[3.5rem] items-center justify-between gap-3 border-t border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-2 text-sm dark:border-neutral-700 dark:from-neutral-800 dark:to-neutral-900"
                    style={{ borderBottomLeftRadius: '0.75rem', borderBottomRightRadius: showTimeSelect ? 0 : '0.75rem' }}
                  >
                    <div className="flex flex-1 items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>
                        {displayDate
                          ? showTimeSelect
                            ? displayDate.toLocaleString(currentLocale === 'es' ? 'es-ES' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })
                            : displayDate.toLocaleDateString(currentLocale === 'es' ? 'es-ES' : 'en-US', { dateStyle: 'medium' })
                          : currentLocale === 'es' ? 'Sin fecha seleccionada' : 'No date selected'}
                      </span>
                      {showTimezone && useUTC && (
                        <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">({timezoneLabel()})</span>
                      )}
                    </div>
                    {isClearable && displayDate && (
                      <button type="button"
                        onClick={e => { e.stopPropagation(); handleDateChange(null); setIsOpen(false); }}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-gradient-to-br from-gray-100 to-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:-translate-y-px hover:border-gray-400 hover:shadow dark:border-neutral-600 dark:from-neutral-700 dark:to-neutral-800 dark:text-gray-200">
                        <X className="h-4 w-4" />
                        {currentLocale === 'es' ? 'Limpiar' : 'Clear'}
                      </button>
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

        <style>{`
          .custom-time-selector {
            background-color: #ffffff; border-left: 1px solid #e5e7eb;
            width: 200px; display: flex; flex-direction: column; padding-bottom: 3.5rem;
          }
          .dark .custom-time-selector { background-color: #171717; border-left-color: #404040; }
          .time-selector-header {
            display: flex; align-items: center; gap: 0.5rem; justify-content: center;
            padding: 0.75rem 1rem; height: 4.5rem;
            background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
            border-bottom: 1px solid #e5e7eb; border-top-right-radius: 0.75rem;
            font-weight: 700; font-size: 1rem; color: #111827;
          }
          .dark .time-selector-header { background: linear-gradient(135deg,#262626 0%,#171717 100%); border-bottom-color:#404040; color:#f3f4f6; }
          .time-selector-body { display:flex; align-items:center; justify-content:center; gap:1rem; padding:2rem 1rem; flex:1; }
          .time-input-group { display:flex; flex-direction:column; align-items:center; gap:0.5rem; }
          .time-spinner-btn {
            width:100%; padding:0.5rem;
            background:linear-gradient(135deg,#f3f4f6 0%,#e5e7eb 100%);
            border:1px solid #d1d5db; border-radius:0.5rem; color:#374151;
            cursor:pointer; transition:all 0.2s ease; display:flex; align-items:center; justify-content:center;
          }
          .time-spinner-btn:hover { background:linear-gradient(135deg,${getColor(activeColor)} 0%,${getColor(activeColor,'dd')} 100%); border-color:${getColor(activeColor)}; color:white; transform:translateY(-1px); }
          .dark .time-spinner-btn { background:linear-gradient(135deg,#404040 0%,#262626 100%); border-color:#525252; color:#e5e7eb; }
          .time-separator { font-size:2.5rem; font-weight:700; color:#374151; align-self:center; margin-top:-1rem; }
          .dark .time-separator { color:#e5e7eb; }
          .time-label { font-size:0.75rem; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em; }
          .dark .time-label { color:#9ca3af; }
          @media (max-width:640px) {
            .custom-time-selector { width:100% !important; border-left:none !important; border-top:1px solid #e5e7eb; }
            .dark .custom-time-selector { border-top-color:#404040; }
            .time-selector-header { border-top-right-radius:0; }
          }
        `}</style>
      </div>
    </I18nProvider>
  );
};

export default DatePickerModern;
export { DatePickerModern as DatePicker };
