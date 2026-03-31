import { useTranslation } from 'react-i18next';

interface PeriodOption {
  days: number;
  labelKey: string;
  fallback: string;
}

const PERIOD_OPTIONS: PeriodOption[] = [
  { days: 7, labelKey: 'analytics.period.7d', fallback: '7d' },
  { days: 30, labelKey: 'analytics.period.30d', fallback: '30d' },
  { days: 90, labelKey: 'analytics.period.90d', fallback: '90d' },
];

interface PeriodSelectorProps {
  selectedPeriod: number;
  onPeriodChange: (days: number) => void;
  theme?: 'light' | 'dark';
}

export default function PeriodSelector({ selectedPeriod, onPeriodChange }: PeriodSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="flex w-fit rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
      {PERIOD_OPTIONS.map(({ days, labelKey, fallback }) => (
        <button
          key={days}
          onClick={() => onPeriodChange(days)}
          className={`rounded-md px-3 py-2 text-sm font-medium transition-all ${
            selectedPeriod === days
              ? 'bg-white text-gray-900 shadow-sm dark:bg-neutral-700 dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          {t(labelKey, fallback)}
        </button>
      ))}
    </div>
  );
}
