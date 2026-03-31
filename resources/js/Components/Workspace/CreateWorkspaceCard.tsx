import { ChevronRight, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useKeyboardClick } from '@/Hooks/useKeyboardClick';

interface CreateWorkspaceCardProps {
  onClick: () => void;
}

const CreateWorkspaceCard = ({ onClick }: CreateWorkspaceCardProps) => {
  const { t } = useTranslation();
  const keyboardProps = useKeyboardClick(onClick);

  return (
    <div
      {...keyboardProps}
      className="group relative cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary-400 hover:bg-gradient-to-br hover:from-primary-50/30 hover:to-primary-100/30 hover:shadow-xl dark:border-neutral-700 dark:hover:border-primary-500 dark:hover:from-primary-900/5 dark:hover:to-primary-900/10"
    >
      <div className="flex h-full min-h-[280px] flex-col items-center justify-center p-4 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-200 transition-transform group-hover:scale-110 dark:from-primary-900/30 dark:to-primary-800/30">
          <Plus className="h-8 w-8 text-primary-600 dark:text-primary-400" />
        </div>
        <h3 className="mb-2 text-lg font-bold text-gray-700 dark:text-neutral-300">
          {t('workspace.create_new_workspace')}
        </h3>
        <p className="mb-6 text-sm text-gray-500 dark:text-neutral-500">
          {t('workspace.create_card.subtitle')}
        </p>
        <div className="flex items-center gap-2 font-semibold text-primary-600 dark:text-primary-400">
          <span>{t('workspace.create_button_subtitle')}</span>
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </div>
  );
};

export default CreateWorkspaceCard;
