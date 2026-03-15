import Button from '@/Components/common/Modern/Button';
import { useTranslation } from 'react-i18next';

interface PlatformModalFooterProps {
  onClose: () => void;
  onSave?: () => void;
}

export default function PlatformModalFooter({ onClose, onSave }: PlatformModalFooterProps) {
  const { t } = useTranslation();

  return (
    <div className="flex justify-end gap-3 border-t border-neutral-100 py-4 dark:border-neutral-800">
      <Button onClick={onClose} variant="secondary" buttonStyle="outline" size="lg" type="button">
        {t('common.cancel') || 'Cancelar'}
      </Button>
      <Button
        onClick={onSave || onClose}
        variant="primary"
        size="lg"
        id="save-button"
        type="button"
      >
        {t('platformSettings.button.save') || 'Guardar Cambios'}
      </Button>
    </div>
  );
}
