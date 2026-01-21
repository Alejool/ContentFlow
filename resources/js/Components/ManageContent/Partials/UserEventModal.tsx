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
  Trash2,
  Type,
  X,
} from "lucide-react";
import { useEffect } from "react";
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

export default function UserEventModal({
  show,
  onClose,
  event,
  selectedDate,
  onSuccess,
}: UserEventModalProps) {
  const { t } = useTranslation();

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

  const selectedColor = watch("color");

  useEffect(() => {
    if (show) {
      if (event) {
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
          color: event.backgroundColor || event.color || "#3B82F6",
          remind_at: event.extendedProps?.remind_at
            ? typeof event.extendedProps.remind_at === "string"
              ? parseISO(event.extendedProps.remind_at)
              : event.extendedProps.remind_at
            : null,
        });
      } else if (selectedDate) {
        reset({
          title: "",
          description: "",
          start_date: selectedDate,
          end_date: null,
          color: "#3B82F6",
          remind_at: null,
        });
      } else {
        reset({
          title: "",
          description: "",
          start_date: new Date(),
          end_date: null,
          color: "#3B82F6",
          remind_at: null,
        });
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

  return (
    <Modal show={show} onClose={onClose} maxWidth="lg">
      <div className="p-0 overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl transition-all duration-300 transform border border-gray-100 dark:border-neutral-800">
        <div className="relative overflow-hidden px-8 py-6 border-b border-gray-100 dark:border-neutral-800 bg-gradient-to-r from-gray-50/80 to-white/80 dark:from-neutral-800/80 dark:to-neutral-900/80 backdrop-blur-md">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
            <CalendarIcon size={120} className="text-primary-500" />
          </div>

          <div className="flex items-center justify-between relative z-10">
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                {event
                  ? t("calendar.userEvents.modal.title.edit")
                  : t("calendar.userEvents.modal.title.new")}
              </h3>
              <p className="text-[10px] text-gray-500 dark:text-neutral-400 mt-2 font-bold uppercase tracking-widest opacity-80">
                {t("calendar.userEvents.modal.fields.title")}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-all duration-200 active:scale-90 bg-white/50 dark:bg-neutral-800/50 backdrop-blur"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          <Input
            id="title"
            label={t("calendar.userEvents.modal.fields.title")}
            placeholder={t("calendar.userEvents.modal.placeholders.title")}
            icon={Type}
            register={register}
            error={errors.title?.message ? t(errors.title.message) : undefined}
            required
            variant="default"
            sizeType="lg"
            autoFocus
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
          />

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
                  icon={<CalendarIcon className="w-5 h-5 text-gray-400" />}
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
                  icon={<CalendarIcon className="w-5 h-5 text-gray-400" />}
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
                icon={<Bell className="w-5 h-5 text-gray-400" />}
              />
            )}
          />

          <div className="bg-gray-50/50 dark:bg-neutral-800/30 p-5 rounded-2xl border border-gray-100 dark:border-neutral-800/50">
            <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-4 ml-1">
              {t("calendar.userEvents.modal.fields.color")}
            </label>
            <div className="flex flex-wrap gap-4">
              {[
                "#3B82F6", // Blue
                "#EF4444", // Red
                "#10B981", // Emerald
                "#F59E0B", // Amber
                "#8B5CF6", // Violet
                "#EC4899", // Pink
                "#6B7280", // Gray
              ].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue("color", color)}
                  className={`w-10 h-10 rounded-full border-4 transition-all duration-300 hover:scale-125 active:scale-90 shadow-sm ${
                    selectedColor === color
                      ? "border-white dark:border-neutral-700 ring-4 ring-primary-500/30 scale-110 rotate-12"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-8 border-t border-gray-100 dark:border-neutral-800 mt-6">
            {event ? (
              <Button
                type="button"
                variant="ghost"
                buttonStyle="outline"
                onClick={handleDelete}
                className="text-red-500 hover:text-white hover:bg-red-600 border-red-200 hover:border-red-600 dark:border-red-900/30 transition-all duration-300 font-bold px-6 py-3 rounded-2xl group"
                icon={
                  <Trash2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                }
              >
                {t("calendar.userEvents.modal.actions.delete")}
              </Button>
            ) : (
              <div />
            )}

            <div className="flex gap-4">
              <Button
                type="button"
                variant="ghost"
                buttonStyle="ghost"
                onClick={onClose}
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all duration-300 font-bold px-7 py-3 rounded-2xl"
              >
                {t("calendar.userEvents.modal.actions.cancel")}
              </Button>
              <Button
                type="submit"
                variant="primary"
                buttonStyle="gradient"
                loading={isSubmitting}
                className="font-black px-10 py-3 rounded-2xl shadow-xl shadow-primary-500/20 active:translate-y-1 transition-all duration-300"
              >
                {event
                  ? t("calendar.userEvents.modal.actions.save")
                  : t("calendar.userEvents.modal.actions.create")}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
