import Input from "@/Components/common/Modern/Input";
import Button from "@/Components/common/Modern/Button";
import { Plus, Trash2, HelpCircle } from "lucide-react";

interface PollFieldsProps {
  options: string[];
  duration: number;
  onChange: (data: { options: string[]; duration: number }) => void;
  t: (key: string) => string;
  errors?: {
    options?: string;
    duration?: string;
  };
}

export default function PollFields({
  options = ['', ''],
  duration = 24,
  onChange,
  t,
  errors = {},
}: PollFieldsProps) {
  
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    onChange({ options: newOptions, duration });
  };

  const handleAddOption = () => {
    if (options.length < 4) {
      onChange({ options: [...options, ''], duration });
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      onChange({ options: newOptions, duration });
    }
  };

  const handleDurationChange = (value: string) => {
    const numValue = parseInt(value) || 24;
    onChange({ options, duration: numValue });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-neutral-700">
        <div className="w-1 h-5 bg-primary-500 rounded-full"></div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
          {t("publications.modal.poll.title") || "Poll Options"}
        </h3>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t("publications.modal.poll.options") || "Poll Options (2-4 options)"}
        </label>
        
        {options.map((option, index) => (
          <div key={index} className="flex gap-2">
            <div className="flex-1">
              <Input
                id={`poll-option-${index}`}
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`${t("publications.modal.poll.optionPlaceholder") || "Option"} ${index + 1}`}
                variant="filled"
                sizeType="md"
                maxLength={25}
              />
            </div>
            {options.length > 2 && (
              <Button
                type="button"
                variant="icon"
                buttonStyle="outline"
                size="md"
                icon={Trash2}
                onClick={() => handleRemoveOption(index)}
                className="shrink-0"
              />
            )}
          </div>
        ))}

        {errors.options && (
          <p className="text-xs text-red-500">{errors.options}</p>
        )}

        {options.length < 4 && (
          <Button
            type="button"
            variant="ghost"
            buttonStyle="outline"
            size="sm"
            icon={Plus}
            onClick={handleAddOption}
            fullWidth
          >
            {t("publications.modal.poll.addOption") || "Add Option"}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t("publications.modal.poll.duration") || "Poll Duration"}
        </label>
        
        <div className="flex items-center gap-3">
          <Input
            id="poll-duration"
            type="number"
            value={duration.toString()}
            onChange={(e) => handleDurationChange(e.target.value)}
            min={1}
            max={168}
            variant="filled"
            sizeType="md"
            className="w-24"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t("publications.modal.poll.hours") || "hours"}
          </span>
          <div className="group relative">
            <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
              <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap">
                {t("publications.modal.poll.durationHint") || "Twitter: 5min-7days, Facebook: 1-7days"}
              </div>
            </div>
          </div>
        </div>

        {errors.duration && (
          <p className="text-xs text-red-500">{errors.duration}</p>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          <strong>{t("common.note") || "Note"}:</strong>{" "}
          {t("publications.modal.poll.note") || 
            "Polls are only supported on Twitter and Facebook. Make sure to select compatible platforms."}
        </p>
      </div>
    </div>
  );
}
