import React, { useState } from 'react';
import { AlertTriangle, Clock, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CalendarEvent } from '@/types/calendar';

export interface DataConflict {
  eventId: string;
  field: string;
  localValue: any;
  serverValue: any;
  localTimestamp: Date;
  serverTimestamp: Date;
  localUser?: string;
  serverUser?: string;
}

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

  const formatValue = (value: any): string => {
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    if (typeof value === 'object') {
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
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="conflict-modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          aria-hidden="true"
          onClick={onCancel}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-amber-50 dark:bg-amber-900/20 px-6 py-4 border-b border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 id="conflict-modal-title" className="text-lg font-medium text-amber-900 dark:text-amber-100">
                  {t('calendar.conflict.title', 'Data Conflict Detected')}
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {t(
                    'calendar.conflict.description',
                    'This event has been modified by another user. Please choose which version to keep.'
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {event && (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {t('calendar.conflict.event', 'Event')}: {event.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('calendar.conflict.field_label', 'Conflicting field')}: {getFieldLabel(conflict.field)}
                </p>
              </div>
            )}

            <div className="space-y-4">
              {/* Local Version */}
              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedResolution === 'local'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
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
                <div className="flex items-start justify-between mb-2">
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
                    <Clock className="w-3 h-3" />
                    <span>{conflict.localTimestamp.toLocaleString()}</span>
                  </div>
                  {conflict.localUser && (
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <User className="w-3 h-3" />
                      <span>{conflict.localUser}</span>
                    </div>
                  )}
                  <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    <pre className="text-xs text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-all">
                      {formatValue(conflict.localValue)}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Server Version */}
              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedResolution === 'server'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
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
                <div className="flex items-start justify-between mb-2">
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
                    <Clock className="w-3 h-3" />
                    <span>{conflict.serverTimestamp.toLocaleString()}</span>
                  </div>
                  {conflict.serverUser && (
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <User className="w-3 h-3" />
                      <span>{conflict.serverUser}</span>
                    </div>
                  )}
                  <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    <pre className="text-xs text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-all">
                      {formatValue(conflict.serverValue)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {t(
                  'calendar.conflict.info',
                  'The version you choose will be saved. The other version will be discarded.'
                )}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t('calendar.conflict.cancel', 'Cancel')}
            </button>
            <button
              type="button"
              onClick={handleResolve}
              disabled={!selectedResolution}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('calendar.conflict.resolve', 'Apply Selected Version')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
