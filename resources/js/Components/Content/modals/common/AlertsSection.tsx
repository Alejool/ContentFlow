import { TFunction } from 'i18next';
import { AlertCircle, Lock } from 'lucide-react';
import { Trans } from 'react-i18next';

interface LockInfo {
  locked_by?: string;
  user_name?: string;
  user_agent?: string;
  ip_address?: string;
}

interface AlertsSectionProps {
  t: TFunction;
  isLockedByMe: boolean;
  isLockedByOther: boolean;
  lockInfo: LockInfo | null;
  activeUsers: any[];
  hasPublishedPlatform: boolean;
  allowConfiguration: boolean;
  publicationStatus?: string;
  parseUserAgent: (userAgent?: string) => string;
  maskIpAddress: (ip?: string) => string;
}

export const AlertsSection = ({
  t,
  isLockedByMe,
  isLockedByOther,
  lockInfo,
  activeUsers,
  hasPublishedPlatform,
  allowConfiguration,
  publicationStatus,
  parseUserAgent,
  maskIpAddress,
}: AlertsSectionProps) => {
  return (
    <div className="space-y-3">
      {/* Alerta: Bloqueado por otro usuario */}
      {!isLockedByMe &&
        isLockedByOther &&
        !hasPublishedPlatform &&
        allowConfiguration &&
        publicationStatus !== 'pending_review' && (
          <div className="animate-in shake flex gap-3 rounded-lg border border-amber-500 bg-amber-50 p-4 text-sm text-amber-700 duration-500 dark:bg-amber-900/20 dark:text-amber-300">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <p className="mb-1 font-semibold">
                {lockInfo?.locked_by === 'session'
                  ? t('publications.modal.edit.lockedBySession') || 'Sesión Duplicada'
                  : t('publications.modal.edit.lockedByOther') || 'En cola de espera'}
              </p>
              <div className="opacity-80">
                {lockInfo?.locked_by === 'session' ? (
                  <>
                    <Trans
                      i18nKey="publications.modal.edit.locking.sessionMessage"
                      values={{
                        browser: parseUserAgent(lockInfo?.user_agent),
                      }}
                      components={{
                        1: <span className="font-medium" />,
                      }}
                    />
                    {lockInfo?.ip_address && (
                      <span className="text-xs opacity-70">
                        {' '}
                        ({maskIpAddress(lockInfo.ip_address)})
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <Trans
                      i18nKey="publications.modal.edit.locking.userMessage"
                      values={{
                        user: lockInfo?.user_name,
                        browser: parseUserAgent(lockInfo?.user_agent),
                      }}
                      components={{
                        1: <span className="font-medium" />,
                      }}
                    />
                    <p className="mt-1 font-medium text-amber-600 dark:text-amber-400">
                      Tomarás el control automáticamente cuando se libere.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

      {/* Alerta: Eres el editor actual */}
      {isLockedByMe && activeUsers.length > 1 && (
        <div className="flex gap-2 rounded-lg border border-blue-500 bg-blue-50 p-3 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
          <Lock className="h-4 w-4 shrink-0" />
          <p>
            <strong>
              {t('publications.modal.edit.locking.youAreEditor') || 'Eres el editor actual.'}
            </strong>{' '}
            {t('publications.modal.edit.locking.usersWaiting', {
              count: activeUsers.length - 1,
            }) || `Hay ${activeUsers.length - 1} usuario(s) en espera para cuando termines.`}
          </p>
        </div>
      )}

      {/* Alerta: Pendiente de revisión */}
      {publicationStatus === 'pending_review' && (
        <div className="animate-in fade-in slide-in-from-top-4 flex gap-3 rounded-lg border border-yellow-500 bg-yellow-50 p-4 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-yellow-500" />
          <div>
            <p className="mb-1 font-semibold">
              {t('publications.modal.edit.pendingReviewWarning') || 'Publicación en Revisión'}
            </p>
            <p className="opacity-90">
              {t('publications.modal.edit.pendingReviewWarningHint') ||
                'Esta publicación está esperando aprobación. Debes aprobarla o rechazarla antes de poder editarla. Si la rechazas, el creador podrá hacer cambios y volver a solicitar aprobación.'}
            </p>
          </div>
        </div>
      )}

      {/* Alerta: Publicación aprobada */}
      {publicationStatus === 'approved' && !hasPublishedPlatform && (
        <div className="animate-in fade-in slide-in-from-top-4 flex gap-3 rounded-lg border border-blue-500 bg-blue-50/50 p-4 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-blue-500" />
          <div>
            <p className="mb-1 font-semibold">
              {t('publications.modal.edit.approvedEditWarning') || 'Publicación Aprobada'}
            </p>
            <p className="opacity-80">
              {t('publications.modal.edit.approvedEditWarningHint') ||
                "Esta publicación ya fue aprobada. Si realizas cambios, volverá a estado 'Pendiente' y requerirá una nueva aprobación."}
            </p>
          </div>
        </div>
      )}

      {/* Alerta: Publicación parcialmente publicada */}
      {hasPublishedPlatform && (
        <AlertCard
          type="info"
          title={t('publications.modal.edit.contentLocked') || 'Publication partially live'}
          message={
            t('publications.modal.edit.contentLockedHint') ||
            'This publication is live on some platforms. Changes will apply to pending and future uploads.'
          }
          className="animate-in fade-in slide-in-from-top-4"
        />
      )}
    </div>
  );
};
