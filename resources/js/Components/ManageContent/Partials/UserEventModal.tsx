import Button from "@/Components/common/Modern/Button";
import DatePickerModern from "@/Components/common/Modern/DatePicker";
import Input from "@/Components/common/Modern/Input";
import Textarea from "@/Components/common/Modern/Textarea";
import Modal from "@/Components/common/ui/Modal";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { format, parseISO } from "date-fns";
import {
  AlignLeft,
  Bell,
  Calendar as CalendarIcon,
  Type,
  X,
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
  start_date: z.date({
    required_error: "calendar.userEvents.modal.validation.startDateRequired",
  }),
  end_date: z.date().nullable().optional(),
  remind_at: z.date().nullable().optional(),
  color: z.string().default("#3B82F6"),
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
        });
        setSelectedColor("#3B82F6");
      }
    }
  }, [event, selectedDate, show, reset]);

  const onSubmit = async (data: EventFormValues) => {
    try {
      const payload = {
        ...data,
        start_date: format(data.start_date, "yyyy-MM-dd HH:mm:ss"),
        end_date: data.end_date
          ? format(data.end_date, "yyyy-MM-dd HH:mm:ss")
          : null,
        remind_at: data.remind_at
          ? format(data.remind_at, "yyyy-MM-dd HH:mm:ss")
          : null,
      };

      if (event) {
        const resourceId = event.id.includes("_")
          ? event.id.split("_")[2]
          : event.id;
        await axios.put(`/api/calendar/user-events/${resourceId}`, payload);
        toast.success(t("calendar.userEvents.modal.messages.successUpdate"));
      } else {
        await axios.post("/api/calendar/user-events", payload);
        toast.success(t("calendar.userEvents.modal.messages.successCreate"));
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.response?.data?.message ||
          t("calendar.userEvents.modal.messages.errorSave"),
      );
    }
  };

  const handleDelete = async () => {
    if (!confirm(t("calendar.userEvents.modal.actions.deleteConfirm"))) return;
    try {
      const resourceId = event.id.includes("_")
        ? event.id.split("_")[2]
        : event.id;
      await axios.delete(`/api/calendar/user-events/${resourceId}`);
      toast.success(t("calendar.userEvents.modal.messages.successDelete"));
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(t("calendar.userEvents.modal.messages.errorDelete"));
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
        className="p-0 overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl transition-all duration-500 transform border transition-colors"
        style={{
          borderColor: `${selectedColor}40`,
          boxShadow: `0 25px 50px -12px ${selectedColor}15`,
        }}
      >
        <div
          className="relative overflow-hidden px-8 py-6 border-b backdrop-blur-md transition-all duration-500"
          style={{
            background: `linear-gradient(135deg, ${selectedColor}15, ${selectedColor}08)`,
            borderColor: `${selectedColor}30`,
          }}
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
            <CalendarIcon size={120} style={{ color: selectedColor }} />
          </div>

          <div className="flex items-center justify-between relative z-10">
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-none transition-colors duration-500">
                {event
                  ? t("calendar.userEvents.modal.title.edit")
                  : t("calendar.userEvents.modal.title.new")}
              </h3>
              <p
                className="text-xs mt-1 font-semibold uppercase tracking-wider transition-colors duration-500"
                style={{ color: selectedColor }}
              >
                {currentColor.name} • Evento
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full transition-all duration-300 active:scale-90 backdrop-blur border hover:scale-110"
              style={{
                color: selectedColor,
                borderColor: `${selectedColor}40`,
                backgroundColor: `${selectedColor}10`,
              }}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
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
              style={
                {
                  "--ring-color": selectedColor,
                } as React.CSSProperties
              }
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
              style={
                {
                  "--ring-color": selectedColor,
                } as React.CSSProperties
              }
            />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Controller
              name="start_date"
              control={control}
              render={({ field }) => (
                <DatePickerModern
                  label={t("calendar.userEvents.modal.fields.startDate")}
                  selected={field.value}
                  onChange={field.onChange}
                  showTimeSelect
                  required
                  error={
                    errors.start_date?.message
                      ? t(errors.start_date.message)
                      : undefined
                  }
                  icon={<CalendarIcon className="w-5 h-5" />}
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
                  showTimeSelect
                  error={
                    errors.end_date?.message
                      ? t(errors.end_date.message)
                      : undefined
                  }
                  icon={<CalendarIcon className="w-5 h-5" />}
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
                showTimeSelect
                error={
                  errors.remind_at?.message
                    ? t(errors.remind_at.message)
                    : undefined
                }
                icon={<Bell className="w-5 h-5" />}
              />
            )}
          />

          <div
            className="p-5 rounded-2xl border transition-all duration-500 backdrop-blur-sm"
            style={{
              background: `linear-gradient(135deg, ${selectedColor}08, ${selectedColor}03)`,
              borderColor: `${selectedColor}20`,
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
            <div className="flex flex-wrap gap-3">
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
                />
              ))}
            </div>
          </div>

          <div
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-8 mt-8 gap-4 transition-all duration-500"
            style={{
              borderTop: `1px solid ${selectedColor}20`,
            }}
          >
            <div
              className={`flex flex-col sm:flex-row flex-end gap-3 ${event ? "order-1 sm:order-2 w-full sm:w-auto" : "order-1 w-full"}`}
            >
              <Button
                type="button"
                variant="secondary"
                buttonStyle="outline"
                onClick={onClose}
                className="w-full sm:w-auto px-7 py-3 rounded-xl transition-all duration-300 hover:shadow-md"
                style={{
                  borderColor: `${selectedColor}40`,
                  color: selectedColor,
                }}
              >
                {t("calendar.userEvents.modal.actions.cancel")}
              </Button>
              <Button
                type="submit"
                variant="primary"
                buttonStyle="solid"
                loading={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 rounded-xl shadow-lg transition-all duration-300 font-bold hover:shadow-xl active:translate-y-0.5"
                style={{
                  backgroundColor: selectedColor,
                  borderColor: selectedColor,
                }}
              >
                {event
                  ? t("calendar.userEvents.modal.actions.save")
                  : t("calendar.userEvents.modal.actions.create")}
              </Button>
            </div>
          </div>

          {!event && (
            <div className="text-center pt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("calendar.userEvents.modal.footer.note")}
              </p>
            </div>
          )}
        </form>
      </div>
    </Modal>
  );
}
