import React, { useState } from 'react';
import Label from '@/Components/common/Modern/Label';
import Switch from '@/Components/common/Modern/Switch';
import Select from '@/Components/common/Modern/Select';
import Input from '@/Components/common/Modern/Input';
import Checkbox from '@/Components/common/Modern/Checkbox'; 
import DatePickerModern from '@/Components/common/Modern/DatePicker';
import { AlertCircle, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useTimezoneStore } from '@/stores/common/timezoneStore';

const getPlatformColors = (platform?: string): { bg: string; text: string; border: string; hover: string } => {
  const platformColors: Record<
    string,
    { bg: string; text: string; border: string; hover: string }
  > = {
    youtube: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-700 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800',
      hover: 'hover:bg-red-100 dark:hover:bg-red-900/30',
    },
    facebook: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
      hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
    },
    instagram: {
      bg: 'bg-pink-50 dark:bg-pink-900/20',
      text: 'text-pink-700 dark:text-pink-400',
      border: 'border-pink-200 dark:border-pink-800',
      hover: 'hover:bg-pink-100 dark:hover:bg-pink-900/30',
    },
    twitter: {
      bg: 'bg-sky-50 dark:bg-sky-900/20',
      text: 'text-sky-700 dark:text-sky-400',
      border: 'border-sky-200 dark:border-sky-800',
      hover: 'hover:bg-sky-100 dark:hover:bg-sky-900/30',
    },
    linkedin: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
      hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
    },
    tiktok: {
      bg: 'bg-gray-50 dark:bg-gray-900/20',
      text: 'text-gray-700 dark:text-gray-400',
      border: 'border-gray-200 dark:border-gray-800',
      hover: 'hover:bg-gray-100 dark:hover:bg-gray-900/30',
    },
  };

  const defaultColors = platformColors['tiktok']!;
  const colors = platform ? platformColors[platform.toLowerCase()] : defaultColors;
  return colors || defaultColors;
};

export interface RecurrenceSectionProps {
  t: (key: string) => string;
  i18n?: any | undefined;
  disabled?: boolean | undefined;
  hasRecurrenceAccess?: boolean | undefined;
  isRecurring?: boolean | undefined;
  recurrenceType?: 'daily' | 'weekly' | 'monthly' | 'yearly' | undefined;
  recurrenceInterval?: number | undefined;
  recurrenceDays?: number[] | undefined;
  recurrenceEndDate?: string | undefined;
  recurrenceAccounts?: number[] | undefined;
  onRecurrenceChange?: ((data: any) => void) | undefined;
  recurrenceDaysError?: string | undefined;
  allAvailableAccounts: number[];
  socialAccounts: Array<{
    id: number;
    account_name?: string;
    platform: string;
  }>;
  selectedAccounts: number[];
  nextDatesByAccount: Record<number, Date[]>;
  hasAnyDates: boolean;
  daysOfWeek: Array<{ label: string; value: number }>;
}

export const RecurrenceSection: React.FC<RecurrenceSectionProps> = ({
  t,
  i18n,
  disabled = false,
  hasRecurrenceAccess = true,
  isRecurring = false,
  recurrenceType = 'daily',
  recurrenceInterval,
  recurrenceDays = [],
  recurrenceEndDate,
  recurrenceAccounts = [],
  onRecurrenceChange,
  recurrenceDaysError,
  allAvailableAccounts,
  socialAccounts,
  selectedAccounts,
  nextDatesByAccount,
  hasAnyDates,
  daysOfWeek,
}) => {
  const [carouselIndex, setCarouselIndex] = useState(0);

  return (
    <div className="">
      <Label htmlFor="recurrence" icon={Clock} size="lg" className="mb-2">
        {t('publications.modal.schedule.recurrence.title') || 'Repetir publicación (Recurrencia)'}
      </Label>

      {!hasRecurrenceAccess ? (
        <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-primary-200 bg-primary-50 p-3 shadow-sm dark:border-primary-800 dark:bg-primary-900/20 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <div className="shrink-0 rounded-full bg-primary-100 p-1.5 dark:bg-primary-900/40">
              <svg
                className="h-4 w-4 text-primary-600 dark:text-primary-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-primary-800 dark:text-primary-300">
                {t('publications.modal.schedule.recurrence.locked_title') ||
                  'Recurrencia bloqueada'}
              </p>
              <p className="mt-0.5 text-xs text-primary-600 dark:text-primary-400">
                {t('publications.modal.schedule.recurrence.locked_desc') ||
                  'Sube de plan para configurar repeticiones automáticas (cada X días/semanas) en tus publicaciones.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => (window.location.href = route('pricing'))}
            className="shrink-0 whitespace-nowrap rounded-md bg-primary-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary-700"
          >
            {t('common.upgradePlan') || 'Ver Planes'}
          </button>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-top-2 space-y-4 duration-300">
          <Switch
            label={t('publications.modal.schedule.recurrence.enable') || 'Activar repetición'}
            isSelected={isRecurring}
            onChange={(isChecked) => {
              const updateData: any = { is_recurring: isChecked };

              // CRITICAL: If disabling recurrence, clear the days to avoid
              // stale validation errors in the form state.
              if (!isChecked) {
                updateData.recurrence_days = [];
              }

              onRecurrenceChange?.(updateData);
            }}
            isDisabled={disabled}
            size="md"
            containerClassName="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-neutral-700 dark:bg-neutral-800/50"
          />

          {isRecurring && (
            <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
              {/* Selector de redes con recurrencia - Solo si hay más de una red */}
              {allAvailableAccounts.length > 1 ? (
                <div className="space-y-3 border-b border-gray-100 pb-4 dark:border-neutral-800">
                  <div>
                    <Label size="sm">
                      {t('publications.modal.schedule.recurrence.select_accounts') ||
                        'Redes con recurrencia'}
                    </Label>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {t('publications.modal.schedule.recurrence.select_accounts_desc') ||
                        'Selecciona qué redes publicarán de forma recurrente. Las demás solo publicarán una vez.'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {/* Opción: Todas las redes */}
                    <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-neutral-700 dark:hover:bg-neutral-800/50">
                      <Checkbox
                        id="all_accounts_checkbox"
                        checked={
                          !recurrenceAccounts ||
                          recurrenceAccounts.length === 0 ||
                          recurrenceAccounts.length === allAvailableAccounts.length
                        }
                        onChange={(checked) => {
                          if (checked) {
                            onRecurrenceChange?.({ recurrence_accounts: [] });
                          } else {
                            onRecurrenceChange?.({
                              recurrence_accounts: [allAvailableAccounts[0]],
                            });
                          }
                        }}
                        disabled={disabled}
                      />
                      <div className="flex-1 cursor-pointer">
                        <label htmlFor="all_accounts_checkbox" className="text-sm font-semibold text-gray-900 dark:text-gray-100 cursor-pointer">
                          {t('publications.modal.schedule.recurrence.all_accounts') ||
                            'Aplicar a todas'}
                        </label>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {socialAccounts
                            .filter((acc) => allAvailableAccounts.includes(acc.id))
                            .map((account) => {
                                const colors = getPlatformColors(account.platform);

                              return (
                                <span
                                  key={account.id}
                                  className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium ${colors.bg} ${colors.text} ${colors.border}`}
                                >
                                  <span className="font-semibold">{account.platform}</span>
                                  <span className="opacity-75">·</span>
                                  <span className="max-w-[120px] truncate">
                                    {account.account_name}
                                  </span>
                                </span>
                              );
                            })}
                        </div>
                      </div>
                    </div>

                    {/* Opciones individuales - Solo mostrar si NO es "todas" */}
                    {recurrenceAccounts && recurrenceAccounts.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <p className="px-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                          Selección personalizada:
                        </p>
                        {socialAccounts
                          .filter((acc) => allAvailableAccounts.includes(acc.id))
                          .map((account) => {
                            const colors = getPlatformColors(account.platform);
                            const isChecked = recurrenceAccounts.includes(account.id);

                            return (
                              <div
                                key={account.id}
                                className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${colors.bg} ${colors.border} ${colors.hover} ${isChecked ? 'ring-2 ring-primary-500 dark:ring-primary-600' : ''}`}
                              >
                                <Checkbox
                                  id={`account_checkbox_${account.id}`}
                                  checked={isChecked}
                                  onChange={(checked) => {
                                    const currentAccounts = recurrenceAccounts || [];
                                    let newAccounts: number[];

                                    if (checked) {
                                      newAccounts = [...currentAccounts, account.id];
                                      if (newAccounts.length === allAvailableAccounts.length) {
                                        newAccounts = [];
                                      }
                                    } else {
                                      newAccounts = currentAccounts.filter(
                                        (id) => id !== account.id,
                                      );
                                      if (newAccounts.length === 0) {
                                        const otherAccount = allAvailableAccounts.find(
                                          (id) => id !== account.id,
                                        );
                                        if (otherAccount) {
                                          newAccounts = [otherAccount];
                                        }
                                      }
                                    }

                                    onRecurrenceChange?.({
                                      recurrence_accounts: newAccounts,
                                    });
                                  }}
                                  disabled={disabled}
                                />
                                <div className="min-w-0 flex-1">
                                  <label htmlFor={`account_checkbox_${account.id}`} className="flex cursor-pointer items-center gap-2">
                                    <span className={`text-sm font-bold ${colors.text}`}>
                                      {account.platform}
                                    </span>
                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                      ·
                                    </span>
                                    <span className="truncate text-sm text-gray-700 dark:text-gray-300">
                                      {account.account_name}
                                    </span>
                                  </label>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>
              ) : selectedAccounts.length === 1 ? (
                <div className="border-b border-gray-100 pb-4 dark:border-neutral-800">
                  {(() => {
                    const account = socialAccounts.find((a) => a.id === selectedAccounts[0]);
                    if (!account) return null;
                    const colors = getPlatformColors(account.platform);

                    return (
                      <div
                        className={`flex items-start gap-3 rounded-lg border p-3 ${colors.bg} ${colors.border}`}
                      >
                        <div
                          className={`mt-0.5 shrink-0 rounded-full p-1.5 ${colors.bg} ${colors.border} border`}
                        >
                          <CalendarIcon className={`h-4 w-4 ${colors.text}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <span className={`text-sm font-bold ${colors.text}`}>
                              {account.platform}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">·</span>
                            <span className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                              {account.account_name}
                            </span>
                          </div>
                          <p className={`text-xs ${colors.text} opacity-90`}>
                            {t('publications.modal.schedule.recurrence.single_account_note') ||
                              'Esta red publicará de forma recurrente según la configuración.'}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Select
                    id="recurrence_type"
                    label={t('publications.modal.schedule.recurrence.frequency') || 'Frecuencia'}
                    options={[
                      { value: 'daily', label: t('common.frequencies.daily') || 'Diario' },
                      { value: 'weekly', label: t('common.frequencies.weekly') || 'Semanal' },
                      { value: 'monthly', label: t('common.frequencies.monthly') || 'Mensual' },
                      { value: 'yearly', label: t('common.frequencies.yearly') || 'Anual' }
                    ]}
                    value={recurrenceType}
                    onChange={(newType) => {
                      const updateData: any = {
                        recurrence_type: newType,
                      };

                      if (newType !== 'weekly') {
                        updateData.recurrence_days = [];
                      }

                      onRecurrenceChange?.(updateData);
                    }}
                    disabled={disabled}
                    containerClassName="w-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <Input
                    id="recurrence_interval"
                    label={t('publications.modal.schedule.recurrence.interval') || 'Cada'}
                    type="number"
                    min={1}
                    value={recurrenceInterval === undefined ? '' : recurrenceInterval.toString()}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const val = e.target.value;
                      if (val === '') {
                        onRecurrenceChange?.({ recurrence_interval: undefined });
                        return;
                      }
                      const parsed = parseInt(val);
                      if (!isNaN(parsed)) {
                        onRecurrenceChange?.({ recurrence_interval: parsed });
                      }
                    }}
                    disabled={disabled}
                    suffix={
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {recurrenceType === 'daily'
                          ? t('common.units.days') || 'días'
                          : recurrenceType === 'weekly'
                            ? t('common.units.weeks') || 'semanas'
                            : recurrenceType === 'monthly'
                              ? t('common.units.months') || 'meses'
                              : t('common.units.years') || 'años'}
                      </span>
                    }
                  />
                </div>
              </div>

              {recurrenceType === 'weekly' && (
                <div className="space-y-2">
                  <Label size="sm">
                    {t('publications.modal.schedule.recurrence.days') || 'Repetir los días'}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => {
                          const newDays = recurrenceDays.includes(day.value)
                            ? recurrenceDays.filter((d) => d !== day.value)
                            : [...recurrenceDays, day.value];

                          onRecurrenceChange?.({ recurrence_days: newDays });
                        }}
                        disabled={disabled}
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                          recurrenceDays.includes(day.value)
                            ? 'bg-primary-600 text-white shadow-md ring-2 ring-primary-100 dark:ring-primary-900/30'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-neutral-800 dark:text-gray-400 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                  {recurrenceDaysError && (
                    <p className="mt-1 text-xs text-red-500">{recurrenceDaysError}</p>
                  )}
                </div>
              )}

              <div className="space-y-1.5 border-t border-gray-100 pt-2 dark:border-neutral-800">
                <Label size="sm" required>
                  {t('publications.modal.schedule.recurrence.ends') || 'Fecha de finalización'}
                </Label>
                <DatePickerModern
                  selected={
                    recurrenceEndDate
                      ? (() => {
                          const datePart = recurrenceEndDate.split('T')[0];
                          if (!datePart) return new Date(recurrenceEndDate);
                          const parts = datePart.split('-');
                          if (parts.length === 3) {
                            const [year, month, day] = parts as [string, string, string];
                            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                          }
                          return new Date(recurrenceEndDate);
                        })()
                      : null
                  }
                  onChange={(date) => {
                    if (!date) {
                      onRecurrenceChange?.({
                        recurrence_end_date: undefined,
                      });
                      return;
                    }
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const dateString = `${year}-${month}-${day}`;
                    onRecurrenceChange?.({ recurrence_end_date: dateString });
                  }}
                  placeholder={
                    t('publications.modal.schedule.recurrence.ends_placeholder') ||
                    'Selecciona cuándo termina la recurrencia'
                  }
                  dateFormat="dd/MM/yyyy"
                  minDate={new Date()}
                  size="md"
                  disabled={disabled}
                />
                {isRecurring && !recurrenceEndDate && (
                  <p className="mt-1 text-xs text-red-500">
                    {t('publications.modal.schedule.recurrence.end_date_required') ||
                      'La fecha de fin es obligatoria para publicaciones recurrentes'}
                  </p>
                )}
              </div>

              {/* Next Dates Preview - Always show when recurring is enabled */}
              {isRecurring && (
                <div className="mt-4 rounded-lg border border-primary-100/50 bg-primary-50/70 p-4 dark:border-primary-800/30 dark:bg-primary-900/20">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary-700 dark:text-primary-400">
                      <CalendarIcon className="h-4 w-4" />
                      <span className="text-sm font-semibold">
                        {t('publications.modal.schedule.recurrence.preview_title') ||
                          'Próximas fechas de publicación'}
                      </span>
                    </div>
                    {Object.keys(nextDatesByAccount).length > 1 && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setCarouselIndex((prev) => Math.max(0, prev - 1))}
                          disabled={carouselIndex === 0}
                          className="rounded p-1 transition-colors hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-primary-900/30"
                        >
                          <ChevronLeft className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                        </button>
                        <span className="min-w-[3rem] text-center text-xs font-medium text-primary-600 dark:text-primary-400">
                          {carouselIndex + 1} / {Object.keys(nextDatesByAccount).length}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setCarouselIndex((prev) =>
                              Math.min(Object.keys(nextDatesByAccount).length - 1, prev + 1),
                            )
                          }
                          disabled={carouselIndex === Object.keys(nextDatesByAccount).length - 1}
                          className="rounded p-1 transition-colors hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-primary-900/30"
                        >
                          <ChevronRight className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                        </button>
                      </div>
                    )}
                  </div>

                  {Object.keys(nextDatesByAccount).length > 0 ? (
                    <div className="relative overflow-hidden">
                      <div
                        className="flex transition-transform duration-300 ease-in-out"
                        style={{
                          transform: `translateX(-${carouselIndex * 100}%)`,
                        }}
                      >
                        {Object.entries(nextDatesByAccount).map(([accountIdStr, dates]) => {
                          const accountId = parseInt(accountIdStr);
                          const account = socialAccounts.find((a) => a.id === accountId);
                          if (!account || dates.length === 0) return null;

                          const colors = getPlatformColors(account.platform);

                          return (
                            <div key={accountId} className="w-full flex-shrink-0 px-1">
                              <div className="space-y-2">
                                <div
                                  className={`flex items-center gap-2 border-b pb-2 ${colors.border}`}
                                >
                                  <span className={`text-sm font-bold ${colors.text}`}>
                                    {account.platform}
                                  </span>
                                  <span className="text-xs text-gray-400 dark:text-gray-500">
                                    ·
                                  </span>
                                  <span className="truncate text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {account.account_name}
                                  </span>
                                </div>
                                <div className="space-y-1.5">
                                  {dates.slice(0, 5).map((date: Date, idx: number) => {
                                    // Format date in workspace timezone
                                    const timezone = useTimezoneStore
                                      .getState()
                                      .effectiveTimezone();
                                    const locale = i18n?.language === 'es' ? 'es-ES' : 'en-US';

                                    const dayName = new Intl.DateTimeFormat(locale, {
                                      weekday: 'long',
                                      timeZone: timezone || 'UTC',
                                    }).format(date);
                                    const dayNumber = new Intl.DateTimeFormat(locale, {
                                      day: 'numeric',
                                      timeZone: timezone || 'UTC',
                                    }).format(date);
                                    const monthName = new Intl.DateTimeFormat(locale, {
                                      month: 'long',
                                      timeZone: timezone || 'UTC',
                                    }).format(date);
                                    const timeStr = new Intl.DateTimeFormat(locale, {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: false,
                                      timeZone: timezone || 'UTC',
                                    }).format(date);
                                    const [hours, minutes] = timeStr.split(':');

                                    return (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between rounded-md bg-white/50 p-2 transition-colors hover:bg-white/80 dark:bg-neutral-900/30 dark:hover:bg-neutral-900/50"
                                      >
                                        <div className="flex items-center gap-2">
                                          <span
                                            className={`flex h-6 w-6 items-center justify-center rounded-full ${colors.bg} ${colors.text} text-xs font-bold`}
                                          >
                                            {idx + 1}
                                          </span>
                                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {dayName.charAt(0).toUpperCase() + dayName.slice(1)},{' '}
                                            {dayNumber} de {monthName}
                                          </span>
                                        </div>
                                        <span
                                          className={`font-mono text-sm font-semibold ${colors.text}`}
                                        >
                                          {hours}:{minutes}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center">
                      <AlertCircle className="mx-auto mb-2 h-8 w-8 text-amber-500 dark:text-amber-400" />
                      <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {!hasAnyDates
                          ? 'Configura una fecha para ver el preview'
                          : recurrenceType === 'weekly' &&
                              (!recurrenceDays || recurrenceDays.length === 0)
                            ? 'Selecciona al menos un día de la semana'
                            : 'Configura los parámetros de recurrencia'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {!hasAnyDates
                          ? "Activa la 'Programación Global' arriba o configura fechas individuales por red social"
                          : recurrenceType === 'weekly' &&
                              (!recurrenceDays || recurrenceDays.length === 0)
                            ? 'Marca los días en los que quieres que se repita la publicación'
                            : 'Verifica que todos los campos estén completos'}
                      </p>
                    </div>
                  )}

                  <p className="mt-3 flex items-start gap-1.5 text-[10px] italic text-gray-500 dark:text-gray-400">
                    <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                    <span>
                      {t('publications.modal.schedule.recurrence.preview_note') ||
                        'Estas fechas son estimadas y se reflejarán en el calendario al guardar.'}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
