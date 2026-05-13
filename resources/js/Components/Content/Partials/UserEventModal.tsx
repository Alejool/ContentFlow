import ModalFooter from '@/Components/Content/modals/common/ModalFooter';
import ModalHeader from '@/Components/Content/modals/common/ModalHeader';
import DatePickerModern from '@/Components/common/Modern/DatePicker';
import Input from '@/Components/common/Modern/Input';
import Textarea from '@/Components/common/Modern/Textarea';
import Modal from '@/Components/common/ui/Modal';
import { useUserEventForm } from '@/Hooks/Calendar/useUserEventForm';
import { cn } from '@/lib/common/utils';
import {
  CALENDAR_COLORS,
  findColorOption,
  getColorPreviewGlow,
  getGradientStyle,
  getSwatchSelectionShadow,
} from '@/Utils/Calendar/colorHelpers';
import { AlignLeft, Bell, Calendar as CalendarIcon, Globe, Lock, Type } from 'lucide-react';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

interface UserEventModalProps {
  show: boolean;
  onClose: () => void;
  event?: any;
  selectedDate?: Date;
  onSuccess: () => void;
}

export default function UserEventModal({
  show,
  onClose,
  event,
  selectedDate,
  onSuccess,
}: UserEventModalProps) {
  const { t } = useTranslation();

  const {
    form,
    selectedColor,
    setSelectedColor,
    isReadOnly,
    onSubmit,
    getCreatorInfo,
    setValue,
    watch,
  } = useUserEventForm({
    show,
    event,
    ...(selectedDate !== undefined && { selectedDate }),
    onSuccess,
    onClose,
  });

  const {
    register,
    control,
    formState: { errors, isSubmitting },
  } = form;

  const currentColor = findColorOption(selectedColor);

  return (
    <Modal show={show} onClose={onClose} maxWidth="2xl">
      <div className="flex max-h-[90vh] flex-col">
        <div className="transition-shadow duration-200 ease-out">
          <ModalHeader
            t={t}
            onClose={onClose}
            title={
              event ? 'calendar.userEvents.modal.title.edit' : 'calendar.userEvents.modal.title.new'
            }
            subtitle={`${currentColor.name} • Evento${getCreatorInfo()}${!isReadOnly ? '' : ' • ' + (t('common.readOnly') || 'Solo lectura')}`}
            icon={CalendarIcon}
            iconStyle={{ color: selectedColor }}
            style={{
              ...getGradientStyle(selectedColor),
              boxShadow: `inset 0 -1px 0 ${selectedColor}33`,
            }}
          />
        </div>

        <div
          className="custom-scrollbar flex-1 overflow-y-auto bg-gray-50 transition-colors duration-200 ease-out dark:bg-gray-950"
          style={{
            backgroundImage: `linear-gradient(180deg, ${selectedColor}24 0%, transparent 42%)`,
          }}
        >
          <form id="user-event-form" onSubmit={onSubmit} className="space-y-6 p-6 md:p-8">
            <div className="space-y-4">
              <Input
                id="title"
                label={t('calendar.userEvents.modal.fields.title')}
                placeholder={t('calendar.userEvents.modal.placeholders.title')}
                icon={Type}
                register={register}
                error={errors.title?.message ? t(errors.title.message) : undefined}
                required
                variant="default"
                sizeType="lg"
                className="transition-colors duration-200 ease-out"
                activeColor={selectedColor}
                disabled={isReadOnly}
              />

              <Textarea
                id="description"
                name="description"
                label={t('calendar.userEvents.modal.fields.description')}
                placeholder={t('calendar.userEvents.modal.placeholders.description')}
                icon={AlignLeft}
                size="lg"
                register={register}
                rows={3}
                variant="default"
                className="transition-colors duration-200 ease-out"
                activeColor={selectedColor}
                disabled={isReadOnly}
              />
            </div>

            <div
              className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${isReadOnly ? 'pointer-events-none opacity-70' : ''}`}
            >
              <Controller
                name="start_date"
                control={control}
                render={({ field }) => (
                  <DatePickerModern
                    label={t('calendar.userEvents.modal.fields.startDate')}
                    selected={field.value}
                    onChange={field.onChange}
                    dateFormat="dd/MM/yyyy HH:mm"
                    showTimeSelect
                    size="lg"
                    isClearable
                    required
                    minDate={new Date()}
                    error={errors.start_date?.message ? t(errors.start_date.message) : ''}
                    icon={<CalendarIcon className="h-5 w-5" />}
                    activeColor={selectedColor}
                    disabled={isReadOnly}
                  />
                )}
              />
              <Controller
                name="end_date"
                control={control}
                render={({ field }) => (
                  <DatePickerModern
                    label={t('calendar.userEvents.modal.fields.endDate')}
                    selected={field.value ?? null}
                    onChange={field.onChange}
                    dateFormat="dd/MM/yyyy HH:mm"
                    showTimeSelect
                    size="lg"
                    isClearable
                    error={errors.end_date?.message ? t(errors.end_date.message) : ''}
                    icon={<CalendarIcon className="h-5 w-5" />}
                    activeColor={selectedColor}
                    disabled={isReadOnly}
                  />
                )}
              />
            </div>

            <Controller
              name="remind_at"
              control={control}
              render={({ field }) => (
                <DatePickerModern
                  label={t('calendar.userEvents.modal.fields.remindAt')}
                  hint={t('calendar.userEvents.modal.placeholders.remindAtHint')}
                  selected={field.value ?? null}
                  onChange={field.onChange}
                  dateFormat="dd/MM/yyyy HH:mm"
                  showTimeSelect
                  size="lg"
                  isClearable
                  error={errors.remind_at?.message ? t(errors.remind_at.message) : ''}
                  icon={<Bell className="h-5 w-5" />}
                  activeColor={selectedColor}
                  disabled={isReadOnly}
                />
              )}
            />

            <div className={`space-y-2 ${isReadOnly ? 'pointer-events-none opacity-70' : ''}`}>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t('calendar.userEvents.modal.fields.visibility')}
              </label>
              <Controller
                name="is_public"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => field.onChange(true)}
                      className={cn(
                        'flex flex-1 flex-col items-center justify-center gap-1.5 rounded-lg border-2 px-4 py-4 text-xs font-bold transition-colors duration-200 ease-out',
                        field.value
                          ? 'shadow-md'
                          : 'border-gray-100 bg-gray-50/50 text-gray-400 hover:bg-gray-100 dark:border-neutral-800 dark:bg-gray-800/30 dark:text-gray-500 dark:hover:bg-gray-700',
                      )}
                      style={
                        (field.value
                          ? {
                              backgroundColor: `${selectedColor}18`,
                              color: selectedColor,
                              borderColor: selectedColor,
                              boxShadow: `0 4px 14px ${selectedColor}28`,
                            }
                          : {}) as React.CSSProperties
                      }
                    >
                      <Globe className="h-5 w-5 shrink-0" />
                      <span>{t('calendar.userEvents.modal.visibility.public')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange(false)}
                      className={cn(
                        'flex flex-1 flex-col items-center justify-center gap-1.5 rounded-lg border-2 px-4 py-4 text-xs font-bold transition-colors duration-200 ease-out',
                        !field.value
                          ? 'shadow-md'
                          : 'border-gray-100 bg-gray-50/50 text-gray-400 hover:bg-gray-100 dark:border-neutral-800 dark:bg-gray-800/30 dark:text-gray-500 dark:hover:bg-gray-700',
                      )}
                      style={
                        (!field.value
                          ? {
                              backgroundColor: `${selectedColor}18`,
                              color: selectedColor,
                              borderColor: selectedColor,
                              boxShadow: `0 4px 14px ${selectedColor}28`,
                            }
                          : {}) as React.CSSProperties
                      }
                    >
                      <Lock className="h-5 w-5 shrink-0" />
                      <span>{t('calendar.userEvents.modal.visibility.private')}</span>
                    </button>
                  </div>
                )}
              />
              <p
                className="text-xs font-medium transition-colors duration-200 ease-out"
                style={{ color: selectedColor }}
              >
                {watch('is_public')
                  ? `● ${t('calendar.userEvents.modal.visibility.publicHint')}`
                  : `○ ${t('calendar.userEvents.modal.visibility.privateHint')}`}
              </p>
            </div>

            {/* Selector de color: acento fuerte al tono elegido, sin animaciones pesadas */}
            <div
              className={cn(
                'overflow-hidden rounded-lg border-2 bg-white transition-[border-color,box-shadow] duration-200 ease-out dark:bg-neutral-950',
                isReadOnly && 'pointer-events-none opacity-70',
              )}
              style={{
                borderColor: `${selectedColor}66`,
                boxShadow: `0 0 0 1px ${selectedColor}22, 0 16px 48px -12px ${selectedColor}40`,
                backgroundImage: `linear-gradient(125deg, ${selectedColor}38 0%, ${selectedColor}16 36%, transparent 58%)`,
              }}
            >
              <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-stretch sm:gap-6">
                  <div className="flex shrink-0 flex-col items-center gap-2 sm:items-start">
                    <div
                      className="h-14 w-14 shrink-0 rounded-lg ring-2 ring-white/90 dark:ring-white/15"
                      style={{
                        backgroundColor: selectedColor,
                        boxShadow: getColorPreviewGlow(selectedColor),
                      }}
                      aria-hidden
                    />
                    <span className="max-w-28 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400 sm:text-left">
                      {currentColor.name}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1 space-y-4">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <label className="block text-sm font-bold text-gray-900 dark:text-gray-100">
                        {t('calendar.userEvents.modal.fields.color')}
                      </label>
                      <code
                        className="rounded-lg border px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide text-gray-800 transition-colors duration-200 dark:text-gray-100"
                        style={{
                          backgroundColor: `${selectedColor}22`,
                          borderColor: `${selectedColor}55`,
                          color: selectedColor,
                        }}
                      >
                        {selectedColor}
                      </code>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {CALENDAR_COLORS.map((color) => {
                        const isSel = selectedColor === color.value;
                        return (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => {
                              setValue('color', color.value);
                              setSelectedColor(color.value);
                            }}
                            className={cn(
                              'h-10 w-10 rounded-full border-2 transition-transform duration-150 ease-out',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
                              isSel
                                ? 'scale-105 border-white/90 dark:border-neutral-800'
                                : 'border-transparent opacity-90 hover:scale-105 hover:opacity-100',
                            )}
                            style={{
                              backgroundColor: color.value,
                              boxShadow: isSel ? getSwatchSelectionShadow(color.value) : '0 2px 10px rgba(0,0,0,0.18)',
                            }}
                            title={`${color.name} (${color.value})`}
                            aria-label={`Seleccionar color ${color.name}`}
                            aria-pressed={isSel}
                            disabled={isReadOnly}
                          />
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>

            <div
              className={cn(
                'rounded-lg border border-dashed px-5 py-3 text-center transition-colors duration-200 ease-out',
                isReadOnly && 'opacity-70',
              )}
              style={{
                borderColor: `${selectedColor}50`,
                backgroundColor: `${selectedColor}0d`,
              }}
            >
              <p
                className="text-xs font-bold transition-colors duration-200 ease-out"
                style={{ color: selectedColor }}
              >
                {watch('is_public')
                  ? t('calendar.userEvents.modal.visibility.public').toUpperCase() +
                    ': ' +
                    t('calendar.userEvents.modal.visibility.publicHint')
                  : t('calendar.userEvents.modal.visibility.private').toUpperCase() +
                    ': ' +
                    t('calendar.userEvents.modal.visibility.privateHint')}
              </p>
              {!event && (
                <p className="mt-1 text-[10px] italic text-gray-500 dark:text-gray-400">
                  {t('calendar.userEvents.modal.footer.note')}
                </p>
              )}
            </div>
          </form>
        </div>

        <ModalFooter
          formId="user-event-form"
          isSubmitting={isSubmitting}
          onClose={onClose}
          submitText={
            event
              ? t('calendar.userEvents.modal.actions.save')
              : t('calendar.userEvents.modal.actions.create')
          }
          cancelText={t('calendar.userEvents.modal.actions.cancel')}
          submitStyle="solid"
          submitVariant="primary"
          style={{
            borderColor: `${selectedColor}20`,
          }}
          activeColor={selectedColor}
          hideSubmit={isReadOnly}
        />
      </div>
    </Modal>
  );
}
