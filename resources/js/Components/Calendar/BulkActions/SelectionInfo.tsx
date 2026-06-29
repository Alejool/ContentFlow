import React from 'react';
import { useTranslation } from 'react-i18next';

interface SelectionInfoProps {
  selectedCount: number;
}

/**
 * Componente que muestra información sobre la selección actual
 */
export const SelectionInfo: React.FC<SelectionInfoProps> = ({
  selectedCount,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center px-2">
      <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
        {selectedCount} <span className="text-sm font-medium text-gray-500 dark:text-neutral-400 ml-1">{t('calendar.selected')}</span>
      </span>
    </div>
  );
};
