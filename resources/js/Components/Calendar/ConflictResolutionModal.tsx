import type { CalendarEvent, DataConflict } from '@/types/calendar';
import { AlertTriangle, Clock, User } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export type { DataConflict };

interface ConflictResolutionModalProps {
  conflict: DataConflict;
  event?: CalendarEvent;
  onResolve: (resolution: 'local' | 'server' | 'merge') => void;
  onCancel: () => void;
  isOpen: boolean;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  conflict,
  event,
  onResolve,
  onCancel,
  isOpen,
}) => {
  const { t } = useTranslation();
  const [selectedResolution, setSelectedResolution] = useState<'local' | 'server' | null>(null);

  if (!isOpen) return null;

  const formatValue = (value: unknown): string => {
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      start: t('calendar.conflict.field.start', 'Start Date'),
      end: t('calendar.conflict.field.end', 'End Date'),
      title: t('calendar.conflict.field.title', 'Title'),
      status: t('calendar.conflict.field.status', 'Status'),
      platform: t('calendar.conflict.field.platform', 'Platform'),
      campaign: t('calendar.conflict.field.campaign', 'Campaign'),
    };
    return labels[field] || field;
  };

  const handleResolve = () => {
    if (selectedResolution) {
      onResolve(selectedResolution);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="conflict-modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex min-h-screen items-center justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onCancel}
        ></div>

        {/* Modal panel */}
        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all dark:bg-gray-800 sm:my-8 sm:w-full sm:max-w-2xl sm:align-middle">
          {/* Header */}
          <div className="border-b border-amber-200 bg-amber-50 px-6 py-4 dark:border-amber-800 dark:bg-amber-900/20">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3
                  id="conflict-modal-title"
                  className="text-lg font-medium text-amber-900 dark:text-amber-100"
                >
                  {t('calendar.conflict.title', 'Data Conflict Detected')}
                </h3>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                  {t(
                    'calendar.conflict.description',
                    'This event has been modified by another user. Please choose which version to keep.',
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {event && (
              <div className="mb-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {t('calendar.conflict.event', 'Event')}: {event.title}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t('calendar.conflict.field_label', 'Conflicting field')}:{' '}
                  {getFieldLabel(conflict.field)}
                </p>
              </div>
            )}

            <div className="space-y-4">
              {/* Local Version */}
              <div
                className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                  selectedResolution === 'local'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                }`}
                onClick={() => setSelectedResolution('local')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedResolution('local');
                  }
                }}
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={selectedResolution === 'local'}
                      onChange={() => setSelectedResolution('local')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      aria-label={t('calendar.conflict.select_local', 'Select your version')}
                    />
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {t('calendar.conflict.your_version', 'Your Version')}
                    </h4>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('calendar.conflict.local', 'Local')}
                  </span>
                </div>

                <div className="ml-6 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <Clock className="h-3 w-3" />
                    <span>{conflict.localTimestamp.toLocaleString()}</span>
                  </div>
                  {conflict.localUser && (
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <User className="h-3 w-3" />
                      <span>{conflict.localUser}</span>
                    </div>
                  )}
                  <div className="mt-2 rounded border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
                    <pre className="whitespace-pre-wrap break-all text-xs text-gray-900 dark:text-gray-100">
                      {formatValue(conflict.localValue)}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Server Version */}
              <div
                className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                  selectedResolution === 'server'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                }`}
                onClick={() => setSelectedResolution('server')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedResolution('server');
                  }
                }}
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={selectedResolution === 'server'}
                      onChange={() => setSelectedResolution('server')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      aria-label={t('calendar.conflict.select_server', 'Select server version')}
                    />
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {t('calendar.conflict.server_version', 'Server Version')}
                    </h4>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('calendar.conflict.server', 'Server')}
                  </span>
                </div>

                <div className="ml-6 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <Clock className="h-3 w-3" />
                    <span>{conflict.serverTimestamp.toLocaleString()}</span>
                  </div>
                  {conflict.serverUser && (
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <User className="h-3 w-3" />
                      <span>{conflict.serverUser}</span>
                    </div>
                  )}
                  <div className="mt-2 rounded border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
                    <pre className="whitespace-pre-wrap break-all text-xs text-gray-900 dark:text-gray-100">
                      {formatValue(conflict.serverValue)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {t(
                  'calendar.conflict.info',
                  'The version you choose will be saved. The other version will be discarded.',
                )}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 bg-gray-50 px-6 py-4 dark:bg-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-500 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
            >
              {t('calendar.conflict.cancel', 'Cancel')}
            </button>
            <button
              type="button"
              onClick={handleResolve}
              disabled={!selectedResolution}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('calendar.conflict.resolve', 'Apply Selected Version')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
