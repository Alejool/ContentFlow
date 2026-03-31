import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  className?: string;
}

export default function ExpandableText({
  text,
  maxLength = 50,
  className = '',
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const { t } = useTranslation();

  if (!text || text.trim() === '') {
    return <span className={`italic text-gray-400 ${className}`}>-</span>;
  }

  const needsTruncation = text.length > maxLength;
  const displayText = isExpanded
    ? text
    : `${text.substring(0, maxLength)}${needsTruncation ? '…' : ''}`;

  return (
    <button
      onClick={() => needsTruncation && setIsExpanded(!isExpanded)}
      className={`rounded text-left focus:outline-none focus:ring-2 ${
        needsTruncation ? 'cursor-pointer transition-opacity hover:opacity-80' : 'cursor-default'
      } ${className} break-words text-gray-700 dark:text-white`}
      aria-label={
        needsTruncation
          ? isExpanded
            ? t('logs.table.less')
            : t('logs.table.more')
          : 'Texto completo'
      }
      disabled={!needsTruncation}
    >
      {displayText}
      {needsTruncation && (
        <span className="sr-only">
          {isExpanded ? t('logs.table.clickLess') : t('logs.table.clickMore')}
        </span>
      )}
    </button>
  );
}
