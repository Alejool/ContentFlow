import { useTranslation } from 'react-i18next';

interface PeriodSelectorProps {
  selectedPeriod: number;
  onPeriodChange: (days: number) => void;
  theme?: 'light' | 'dark';
}

export default function PeriodSelector({
  selectedPeriod,
  onPeriodChange,
  theme = 'light',
}: PeriodSelectorProps) {
  const { t } = useTranslation();
  const periods = [7, 30, 90];

  return (
    <div className="mb-6 flex w-fit rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
      {periods.map((days) => (
        <button
          key={days}
          onClick={() => onPeriodChange(days)}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
            selectedPeriod === days
              ? 'bg-white text-gray-900 shadow-sm dark:bg-neutral-700 dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          {days} {t('analytics.days')}
        </button>
      ))}
    </div>
  );
}
