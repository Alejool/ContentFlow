import ModalFooter from '@/Components/Content/modals/common/ModalFooter';
import ModalHeader from '@/Components/Content/modals/common/ModalHeader';
import DatePickerModern from '@/Components/common/Modern/DatePicker';
import Input from '@/Components/common/Modern/Input';
import Textarea from '@/Components/common/Modern/Textarea';
import Modal from '@/Components/common/ui/Modal';
import { useUserEventForm } from '@/Hooks/Calendar/useUserEventForm';
import {
  CALENDAR_COLORS,
  findColorOption,
  getGradientStyle,
} from '@/Utils/Calendar/colorHelpers';
import { motion } from 'framer-motion';
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
        <motion.div
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15, ease: 'easeInOut' }}
          className="transition-colors duration-150"
        >
          <ModalHeader
            t={t}
            onClose={onClose}
            title={
              event ? 'calendar.userEvents.modal.title.edit' : 'calendar.userEvents.modal.title.new'
            }
            subtitle={`${currentColor.name} • Evento${getCreatorInfo()}${!isReadOnly ? '' : ' • ' + (t('common.readOnly') || 'Solo lectura')}`}
            icon={CalendarIcon}
            iconStyle={{ color: selectedColor }}
            style={getGradientStyle(selectedColor)}
          />
        </motion.div>

        <div 
          className="custom-scrollbar flex-1 overflow-y-auto transition-colors duration-150"
          style={{ backgroundColor: `${selectedColor}06` }}
        >
          <form
            id="user-event-form"
            onSubmit={onSubmit}
            className="space-y-6 p-6 md:p-8"
          >
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
              autoFocus
              className="transition-colors duration-150"
              activeColor={selectedColor}
              disabled={isReadOnly}
            />

            <Textarea
              id="description"
              name="description"
              label={t('calendar.userEvents.modal.fields.description')}
              placeholder={t('calendar.userEvents.modal.placeholders.description')}
              icon={AlignLeft}
              size='lg'
              register={register}
              rows={3}
              variant="default"
              className="transition-colors duration-150"
              activeColor={selectedColor}
              disabled={isReadOnly}
            />
          </div>

          {/* Fechas */}
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
                  size='lg'
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
                  size='lg'
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
                size='lg'
                isClearable
                error={errors.remind_at?.message ? t(errors.remind_at.message) : ''}
                icon={<Bell className="h-5 w-5" />}
                activeColor={selectedColor}
                disabled={isReadOnly}
              />
            )}
          />

          {/* Visibility Toggle */}
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
                    className={`flex flex-1 flex-col items-center justify-center gap-1.5 rounded-lg border-2 px-4 py-4 text-xs font-bold transition-all duration-150 ${
                      field.value
                        ? 'translate-y-[-2px] shadow-sm'
                        : 'border-gray-100 bg-gray-50/50 text-gray-400 hover:bg-gray-100 dark:border-neutral-800 dark:bg-gray-800/30 dark:text-gray-500 dark:hover:bg-gray-700'
                    }`}
                    style={
                      (field.value
                        ? {
                            backgroundColor: `${selectedColor}15`,
                            color: selectedColor,
                            borderColor: selectedColor,
                            boxShadow: `0 4px 12px ${selectedColor}20`,
                          }
                        : {}) as React.CSSProperties
                    }
                  >
                    <Globe className={`h-5 w-5 ${field.value ? 'animate-pulse' : ''}`} />
                    <span>{t('calendar.userEvents.modal.visibility.public')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => field.onChange(false)}
                    className={`flex flex-1 flex-col items-center justify-center gap-1.5 rounded-lg border-2 px-4 py-4 text-xs font-bold transition-all duration-150 ${
                      !field.value
                        ? 'translate-y-[-2px] shadow-sm'
                        : 'border-gray-100 bg-gray-50/50 text-gray-400 hover:bg-gray-100 dark:border-neutral-800 dark:bg-gray-800/30 dark:text-gray-500 dark:hover:bg-gray-700'
                    }`}
                    style={
                      (!field.value
                        ? {
                            backgroundColor: `${selectedColor}15`,
                            color: selectedColor,
                            borderColor: selectedColor,
                            boxShadow: `0 4px 12px ${selectedColor}20`,
                          }
                        : {}) as React.CSSProperties
                    }
                  >
                    <Lock className={`h-5 w-5 ${!field.value ? 'animate-bounce-slow' : ''}`} />
                    <span>{t('calendar.userEvents.modal.visibility.private')}</span>
                  </button>
                </div>
              )}
            />
            <p
              className="text-xs font-medium transition-colors duration-150"
              style={{ color: `${selectedColor}` }}
            >
              {watch('is_public')
                ? `● ${t('calendar.userEvents.modal.visibility.publicHint')}`
                : `○ ${t('calendar.userEvents.modal.visibility.privateHint')}`}
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0.8, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            className="rounded-lg border p-5 backdrop-blur-sm transition-all duration-150"
            style={getGradientStyle(selectedColor)}
          >
            <div className="mb-4 flex items-center justify-between">
              <label className="ml-1 block text-sm font-bold text-gray-900 dark:text-gray-200">
                {t('calendar.userEvents.modal.fields.color')}
              </label>
              <motion.span
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-150"
                style={{
                  backgroundColor: `${selectedColor}20`,
                  color: selectedColor,
                  border: `1px solid ${selectedColor}40`,
                }}
              >
                {selectedColor}
              </motion.span>
            </div>
            <div
              className={`flex flex-wrap gap-3 ${isReadOnly ? 'pointer-events-none opacity-70' : ''}`}
            >
              {CALENDAR_COLORS.map((color, index) => (
                <motion.button
                  key={color.value}
                  type="button"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.03,
                    ease: 'easeOut',
                  }}
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setValue('color', color.value);
                    setSelectedColor(color.value);
                  }}
                  className={`h-9 w-9 rounded-full shadow-md transition-all duration-150 ${
                    selectedColor === color.value
                      ? 'ring-3 scale-110 border-2 border-white ring-white ring-offset-2 dark:border-neutral-800 dark:ring-neutral-800'
                      : 'border-2 border-transparent'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={`${color.name} (${color.value})`}
                  aria-label={`Seleccionar color ${color.name}`}
                  disabled={isReadOnly}
                />
              ))}
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0.8, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            className={`rounded-lg border border-dashed px-6 pb-2 pt-2 text-center transition-all duration-150 ${isReadOnly ? 'opacity-70' : ''}`}
            style={{
              borderColor: `${selectedColor}40`,
              backgroundColor: `${selectedColor}08`,
            }}
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, delay: 0.1 }}
              className="text-xs font-bold transition-colors duration-150"
              style={{ color: selectedColor }}
            >
              {watch('is_public')
                ? t('calendar.userEvents.modal.visibility.public').toUpperCase() +
                  ': ' +
                  t('calendar.userEvents.modal.visibility.publicHint')
                : t('calendar.userEvents.modal.visibility.private').toUpperCase() +
                  ': ' +
                  t('calendar.userEvents.modal.visibility.privateHint')}
            </motion.p>
            {!event && (
              <p className="mt-1 text-[10px] italic text-gray-500 dark:text-gray-400">
                {t('calendar.userEvents.modal.footer.note')}
              </p>
            )}
          </motion.div>
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
