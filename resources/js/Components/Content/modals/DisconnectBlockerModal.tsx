import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { AlertTriangle, Calendar, Clock, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '@/Utils/formatDate';

interface DisconnectBlockerModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountName: string;
  posts: any[];
  reason: 'publishing' | 'scheduled';
}

export default function DisconnectBlockerModal({
  isOpen,
  onClose,
  accountName,
  posts,
  reason,
}: DisconnectBlockerModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const getTitle = () => {
    if (reason === 'publishing') {
      return (
        t('manageContent.socialMedia.blockerModal.titlePublishing') || 'No se puede desconectar'
      );
    }
    return t('manageContent.socialMedia.blockerModal.titleScheduled') || 'No se puede desconectar';
  };

  const getMessage = () => {
    if (reason === 'publishing') {
      return (
        t('manageContent.socialMedia.blockerModal.messagePublishing') ||
        'Esta cuenta tiene publicaciones que se están publicando en este momento. Por favor, espera a que terminen antes de desconectar.'
      );
    }
    return (
      t('manageContent.socialMedia.blockerModal.messageScheduled') ||
      'Esta cuenta tiene publicaciones programadas. Debes eliminarlas de las publicaciones antes de poder desconectar esta cuenta.'
    );
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-lg transform overflow-hidden rounded-lg border border-gray-200 bg-white p-6 text-left align-middle shadow-xl transition-all dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>

            <div className="flex-1">
              <DialogTitle
                as="h3"
                className="mb-2 text-lg font-bold leading-6 text-gray-900 dark:text-white"
              >
                {getTitle()}
              </DialogTitle>

              <div className="mt-2 text-sm">
                <p className="mb-4 text-gray-600 dark:text-gray-300">
                  <span className="font-semibold text-red-500">{accountName}</span>
                  <br />
                  {getMessage()}
                </p>

                <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-neutral-700 dark:bg-neutral-900/50">
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-gray-400">
                        <tr>
                          <th className="px-4 py-2 font-medium">
                            {t('manageContent.socialMedia.blockerModal.table.publication') ||
                              'Publicación'}
                          </th>
                          <th className="px-4 py-2 font-medium">
                            {reason === 'publishing'
                              ? t('manageContent.socialMedia.blockerModal.table.status') || 'Estado'
                              : t('manageContent.socialMedia.blockerModal.table.scheduledDate') ||
                                'Fecha programada'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 text-gray-700 dark:divide-neutral-700 dark:text-gray-300">
                        {posts.map((post) => (
                          <tr key={post.id}>
                            <td className="px-4 py-2">
                              {post.title || t('common.untitled', 'Sin título')}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2">
                              {reason === 'publishing' ? (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3 animate-pulse opacity-60" />
                                  <span className="text-xs font-semibold text-blue-500 dark:text-blue-400">
                                    {t('status.publishing') || 'Publicando...'}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3 w-3 opacity-60" />
                                  {post.scheduled_at ? (
                                    <span className="text-xs">
                                      {formatDateTime(post.scheduled_at)}
                                    </span>
                                  ) : (
                                    <span className="text-xs opacity-50">
                                      {t('common.noDate') || 'Sin fecha'}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-900/30 dark:bg-orange-900/20">
                  <p className="text-xs text-orange-700 dark:text-orange-300">
                    <strong>
                      {t('manageContent.socialMedia.blockerModal.action') || 'Acción requerida'}:
                    </strong>{' '}
                    {reason === 'publishing'
                      ? t('manageContent.socialMedia.blockerModal.waitForPublishing') ||
                        'Espera a que las publicaciones terminen de publicarse.'
                      : t('manageContent.socialMedia.blockerModal.removeScheduled') ||
                        'Ve a la sección de Contenido y elimina estas publicaciones de la programación.'}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                  onClick={onClose}
                >
                  {t('common.understood') || 'Entendido'}
                </button>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex-shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-neutral-700 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
