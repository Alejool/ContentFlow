import { TFunction } from "i18next";
import PollFields from "@/Components/Content/Publication/common/PollFields";

interface PollSectionProps {
  t: TFunction;
  pollOptions: string[];
  pollDuration: number;
  errors: {
    options?: string;
    duration?: string;
  };
  onChange: (data: { options: string[]; duration: number }) => void;
}

export const PollSection = ({
  t,
  pollOptions,
  pollDuration,
  errors,
  onChange,
}: PollSectionProps) => {
  return (
    <div className="space-y-4">
      <PollFields
        options={pollOptions}
        duration={pollDuration}
        onChange={onChange}
        t={t}
        errors={errors}
      />
    </div>
  );
};
