import ModalFooter from "@/Components/ManageContent/modals/common/ModalFooter";
import ModalHeader from "@/Components/ManageContent/modals/common/ModalHeader";
import DatePickerModern from "@/Components/common/Modern/DatePicker";
import Input from "@/Components/common/Modern/Input";
import Textarea from "@/Components/common/Modern/Textarea";
import Modal from "@/Components/common/ui/Modal";
import { useCalendar } from "@/Hooks/calendar/useCalendar";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import { isBefore, parseISO, startOfDay } from "date-fns";
import {
  AlignLeft,
  Bell,
  Calendar as CalendarIcon,
  Globe,
  Lock,
  Type,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { z } from "zod";

const eventSchema = z.object({
  title: z
    .string()
    .min(1, "calendar.userEvents.modal.validation.titleRequired"),
  description: z.string().optional(),
  start_date: z
    .date({
      required_error: "calendar.userEvents.modal.validation.startDateRequired",
    })
    .refine((date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }, "calendar.userEvents.modal.validation.pastDate"),
  end_date: z.date().nullable().optional(),
  remind_at: z.date().nullable().optional(),
  color: z.string().default("#3B82F6"),
  is_public: z.boolean().default(true),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface UserEventModalProps {
  show: boolean;
  onClose: () => void;
  event?: any;
  selectedDate?: Date;
  onSuccess: () => void;
}

const getLightColor = (hex: string, opacity: number = 0.1) => {
  return `${hex}${Math.round(opacity * 255)
    .toString(16)
    .padStart(2, "0")}`;
};

export default function UserEventModal({
  show,
  onClose,
  event,
  selectedDate,
  onSuccess,
}: UserEventModalProps) {
  const { t } = useTranslation();
  const { auth } = usePage().props as any;
  const currentUser = auth.user;
  const [selectedColor, setSelectedColor] = useState("#3B82F6");

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      color: "#3B82F6",
      start_date: new Date(),
      is_public: true,
    },
  });

  // Observar cambios en el color
  const colorValue = watch("color");

  useEffect(() => {
    if (colorValue) {
      setSelectedColor(colorValue);
    }
  }, [colorValue]);

  useEffect(() => {
    if (show) {
      if (event) {
        const eventColor = event.backgroundColor || event.color || "#3B82F6";
        reset({
          title: event.title || "",
          description: event?.extendedProps?.description || "",
          start_date: event.start
            ? typeof event.start === "string"
              ? parseISO(event.start)
              : event.start
            : new Date(),
          end_date: event.end
            ? typeof event.end === "string"
              ? parseISO(event.end)
              : event.end
            : null,
          color: eventColor,
          remind_at: event.extendedProps?.remind_at
            ? typeof event.extendedProps.remind_at === "string"
              ? parseISO(event.extendedProps.remind_at)
              : event.extendedProps.remind_at
            : null,
          is_public: event.extendedProps?.is_public ?? true,
        });
        setSelectedColor(eventColor);
      } else if (selectedDate) {
        reset({
          title: "",
          description: "",
          start_date: selectedDate,
          end_date: null,
          color: "#3B82F6",
          remind_at: null,
          is_public: true,
        });
        setSelectedColor("#3B82F6");
      } else {
        reset({
          title: "",
          description: "",
          start_date: new Date(),
          end_date: null,
          color: "#3B82F6",
          remind_at: null,
          is_public: true,
        });
        setSelectedColor("#3B82F6");
      }
    }
  }, [event, selectedDate, show, reset]);

  const isOwner =
    !event ||
    (event.user?.id && Number(event.user.id) === Number(currentUser?.id)) ||
    (!event.user?.id && event.extendedProps?.user_name === currentUser?.name);
  const isPast = isBefore(
    startOfDay(watch("start_date") || new Date()),
    startOfDay(new Date()),
  );
  const isReadOnly = !isOwner || (isPast && !event);

  const onSubmit = async (data: EventFormValues) => {
    try {
      const payload = {
        ...data,
        // Send ISO strings with timezone so backend parses correctly
        start_date: data.start_date
          ? new Date(data.start_date).toISOString()
          : null,
        end_date: data.end_date ? new Date(data.end_date).toISOString() : null,
        remind_at: data.remind_at
          ? new Date(data.remind_at).toISOString()
          : null,
      };

      if (event) {
        const resourceId = event.id.includes("_")
          ? event.id.split("_")[2]
          : event.id;
        await axios.put(`/api/v1/calendar/user-events/${resourceId}`, payload);
        toast.success(t("calendar.userEvents.modal.messages.successUpdate"));
      } else {
        await axios.post("/api/v1/calendar/user-events", payload);
        toast.success(t("calendar.userEvents.modal.messages.successCreate"));
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          t("calendar.userEvents.modal.messages.errorSave"),
      );
    }
  };

  const tailwindColors = [
    { value: "#3B82F6", name: "Azul", darkValue: "#1D4ED8" },
    { value: "#EF4444", name: "Rojo", darkValue: "#DC2626" },
    { value: "#10B981", name: "Verde", darkValue: "#059669" },
    { value: "#F59E0B", name: "Ámbar", darkValue: "#D97706" },
    { value: "#8B5CF6", name: "Violeta", darkValue: "#7C3AED" },
    { value: "#EC4899", name: "Rosa", darkValue: "#DB2777" },
    { value: "#6366F1", name: "Índigo", darkValue: "#4F46E5" },
    { value: "#14B8A6", name: "Verde azulado", darkValue: "#0D9488" },
    { value: "#F97316", name: "Naranja", darkValue: "#EA580C" },
    { value: "#84CC16", name: "Lima", darkValue: "#65A30D" },
  ];

  const currentColor =
    tailwindColors.find((c) => c.value === selectedColor) || tailwindColors[0];

  return (
    <Modal show={show} onClose={onClose} maxWidth="lg">
      <div
        className="flex flex-col max-h-[90vh] md:max-h-[85vh] bg-white dark:bg-neutral-900 rounded-lg shadow-2xl overflow-hidden border transition-colors"
        style={{
          borderColor: `${selectedColor}40`,
        }}
      >
        <ModalHeader
          t={t}
          onClose={onClose}
          title={
            event
              ? "calendar.userEvents.modal.title.edit"
              : "calendar.userEvents.modal.title.new"
          }
          subtitle={`${currentColor.name} • Evento${
            event?.user?.id || event?.extendedProps?.user_name
              ? " • " +
                t("common.creator") +
                ": " +
                ((event.user?.id &&
                  Number(event.user.id) === Number(currentUser?.id)) ||
                (!event.user?.id &&
                  event.extendedProps?.user_name === currentUser?.name)
                  ? t("common.me") || "Yo"
                  : event.user?.name || event.extendedProps?.user_name)
              : ""
          }${!isOwner ? " • " + (t("common.readOnly") || "Solo lectura") : ""}`}
          icon={CalendarIcon}
          iconColor={`text-[${selectedColor}]`}
          style={{
            background: `linear-gradient(135deg, ${selectedColor}25, ${selectedColor}10)`,
            borderColor: `${selectedColor}50`,
          }}
        />

        <form
          id="user-event-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6"
        >
          <div className="space-y-4">
            <Input
              id="title"
              label={t("calendar.userEvents.modal.fields.title")}
              placeholder={t("calendar.userEvents.modal.placeholders.title")}
              icon={Type}
              register={register}
              error={
                errors.title?.message ? t(errors.title.message) : undefined
              }
              required
              variant="default"
              sizeType="lg"
              autoFocus
              className="transition-colors duration-500"
              activeColor={selectedColor}
              disabled={isReadOnly}
            />

            <Textarea
              id="description"
              name="description"
              label={t("calendar.userEvents.modal.fields.description")}
              placeholder={t(
                "calendar.userEvents.modal.placeholders.description",
              )}
              icon={AlignLeft}
              register={register}
              rows={3}
              variant="default"
              className="transition-colors duration-500"
              activeColor={selectedColor}
              disabled={isReadOnly}
            />
          </div>

          {/* Fechas */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${isReadOnly ? "opacity-70 pointer-events-none" : ""}`}
          >
            <Controller
              name="start_date"
              control={control}
              render={({ field }) => (
                <DatePickerModern
                  label={t("calendar.userEvents.modal.fields.startDate")}
                  selected={field.value}
                  onChange={field.onChange}
                  dateFormat="dd/MM/yyyy HH:mm"
                  showTimeSelect
                  isClearable
                  required
                  minDate={new Date()}
                  error={
                    errors.start_date?.message
                      ? t(errors.start_date.message)
                      : undefined
                  }
                  icon={<CalendarIcon className="w-5 h-5" />}
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
                  label={t("calendar.userEvents.modal.fields.endDate")}
                  selected={field.value}
                  onChange={field.onChange}
                  dateFormat="dd/MM/yyyy HH:mm"
                  showTimeSelect
                  isClearable
                  error={
                    errors.end_date?.message
                      ? t(errors.end_date.message)
                      : undefined
                  }
                  icon={<CalendarIcon className="w-5 h-5" />}
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
                label={t("calendar.userEvents.modal.fields.remindAt")}
                hint={t("calendar.userEvents.modal.placeholders.remindAtHint")}
                selected={field.value}
                onChange={field.onChange}
                dateFormat="dd/MM/yyyy HH:mm"
                showTimeSelect
                isClearable
                error={
                  errors.remind_at?.message
                    ? t(errors.remind_at.message)
                    : undefined
                }
                icon={<Bell className="w-5 h-5" />}
                activeColor={selectedColor}
                disabled={isReadOnly}
              />
            )}
          />

          {/* Visibility Toggle */}
          <div
            className={`space-y-2 ${isReadOnly ? "opacity-70 pointer-events-none" : ""}`}
          >
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t("calendar.userEvents.modal.fields.visibility")}
            </label>
            <Controller
              name="is_public"
              control={control}
              render={({ field }) => (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => field.onChange(true)}
                    className={`flex-1 flex flex-col items-center justify-center gap-1.5 px-4 py-4 rounded-lg font-bold text-xs transition-all duration-300 border-2 ${
                      field.value
                        ? "shadow-sm translate-y-[-2px]"
                        : "bg-gray-50/50 dark:bg-gray-800/30 text-gray-400 dark:text-gray-500 border-gray-100 dark:border-neutral-800 hover:bg-gray-100 dark:hover:bg-gray-700"
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
                    <Globe
                      className={`w-5 h-5 ${field.value ? "animate-pulse" : ""}`}
                    />
                    <span>
                      {t("calendar.userEvents.modal.visibility.public")}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => field.onChange(false)}
                    className={`flex-1 flex flex-col items-center justify-center gap-1.5 px-4 py-4 rounded-lg font-bold text-xs transition-all duration-300 border-2 ${
                      !field.value
                        ? "shadow-sm translate-y-[-2px]"
                        : "bg-gray-50/50 dark:bg-gray-800/30 text-gray-400 dark:text-gray-500 border-gray-100 dark:border-neutral-800 hover:bg-gray-100 dark:hover:bg-gray-700"
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
                    <Lock
                      className={`w-5 h-5 ${!field.value ? "animate-bounce-slow" : ""}`}
                    />
                    <span>
                      {t("calendar.userEvents.modal.visibility.private")}
                    </span>
                  </button>
                </div>
              )}
            />
            <p
              className="text-xs font-medium transition-colors duration-300"
              style={{ color: `${selectedColor}` }}
            >
              {watch("is_public")
                ? `● ${t("calendar.userEvents.modal.visibility.publicHint")}`
                : `○ ${t("calendar.userEvents.modal.visibility.privateHint")}`}
            </p>
          </div>

          <div
            className="p-5 rounded-lg border transition-all duration-500 backdrop-blur-sm"
            style={{
              background: `linear-gradient(135deg, ${selectedColor}10, ${selectedColor}05)`,
              borderColor: `${selectedColor}30`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 ml-1">
                {t("calendar.userEvents.modal.fields.color")}
              </label>
              <span
                className="text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: `${selectedColor}20`,
                  color: selectedColor,
                  border: `1px solid ${selectedColor}40`,
                }}
              >
                {selectedColor}
              </span>
            </div>
            <div
              className={`flex flex-wrap gap-3 ${isReadOnly ? "opacity-70 pointer-events-none" : ""}`}
            >
              {tailwindColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => {
                    setValue("color", color.value);
                    setSelectedColor(color.value);
                  }}
                  className={`
                    w-9 h-9 rounded-full border-3 transition-all duration-300
                    hover:scale-125 active:scale-95 shadow-md hover:shadow-lg
                    transform-gpu
                    ${
                      selectedColor === color.value
                        ? "border-white dark:border-neutral-800 ring-3 ring-offset-2 scale-110 rotate-12"
                        : "border-transparent hover:border-white/50 dark:hover:border-neutral-800/50"
                    }
                  `}
                  style={{ backgroundColor: color.value }}
                  title={`${color.name} (${color.value})`}
                  aria-label={`Seleccionar color ${color.name}`}
                  disabled={isReadOnly}
                />
              ))}
            </div>
          </div>
          <div
            className={`text-center pt-2 pb-2 px-6 rounded-lg border border-dashed transition-all duration-500 ${isReadOnly ? "opacity-70" : ""}`}
            style={{
              borderColor: `${selectedColor}40`,
              backgroundColor: `${selectedColor}08`,
            }}
          >
            <p className="text-xs font-bold" style={{ color: selectedColor }}>
              {watch("is_public")
                ? t(
                    "calendar.userEvents.modal.visibility.public",
                  ).toUpperCase() +
                  ": " +
                  t("calendar.userEvents.modal.visibility.publicHint")
                : t(
                    "calendar.userEvents.modal.visibility.private",
                  ).toUpperCase() +
                  ": " +
                  t("calendar.userEvents.modal.visibility.privateHint")}
            </p>
            {!event && (
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 italic">
                {t("calendar.userEvents.modal.footer.note")}
              </p>
            )}
          </div>
        </form>

        <ModalFooter
          formId="user-event-form"
          isSubmitting={isSubmitting}
          onClose={onClose}
          submitText={
            event
              ? t("calendar.userEvents.modal.actions.save")
              : t("calendar.userEvents.modal.actions.create")
          }
          cancelText={t("calendar.userEvents.modal.actions.cancel")}
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
