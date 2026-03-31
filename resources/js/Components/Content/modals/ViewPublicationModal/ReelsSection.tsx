import ReelsCarousel from '@/Components/Content/ReelsCarousel';
import { FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ReelsSectionProps {
  reels: any[];
}

export default function ReelsSection({ reels }: ReelsSectionProps) {
  const { t } = useTranslation();

  if (reels.length === 0) return null;

  return (
    <div className="rounded-lg border-2 border-purple-200 bg-purple-50/50 p-4 dark:border-purple-800 dark:bg-purple-900/10">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
          <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t('reels.section.title')} ({reels.length})
        </h3>
      </div>
      <ReelsCarousel reels={reels} />
    </div>
  );
}
