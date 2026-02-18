import React, { useState, useEffect } from 'react';

interface Quality {
  resolution?: string;
  aspect_ratio?: string;
}

interface Format {
  extension: string;
}

interface PlatformConfig {
  platform: string;
  account_id: number;
  account_name: string;
  is_compatible: boolean;
  type: string;
  available_types?: string[];
  can_change_type?: boolean;
  quality?: Quality;
  format?: Format;
  warnings?: string[];
  incompatibility_reason?: string;
  suggestion?: string;
  applied_settings?: Record<string, any>;
  thumbnail_url?: string;
}

interface PlatformConfigCardProps {
  config: PlatformConfig;
  editable?: boolean;
  onUpdate?: (accountId: number, type: string, settings: Record<string, any>) => void;
}

export default function PlatformConfigCard({
  config,
  editable = true,
  onUpdate,
}: PlatformConfigCardProps) {
  const [selectedType, setSelectedType] = useState(config.type);
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  useEffect(() => {
    setSelectedType(config.type);
  }, [config.type]);

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    setSelectedType(newType);
    onUpdate?.(config.account_id, newType, {});
  };

  const getPlatformIcon = (platform: string): string => {
    const icons: Record<string, string> = {
      facebook: '📘',
      instagram: '📷',
      tiktok: '🎵',
      youtube: '📺',
      twitter: '🐦',
      linkedin: '💼',
    };
    return icons[platform] || '📱';
  };

  const formatPlatformName = (platform: string): string => {
    const names: Record<string, string> = {
      facebook: 'Facebook',
      instagram: 'Instagram',
      tiktok: 'TikTok',
      youtube: 'YouTube',
      twitter: 'Twitter',
      linkedin: 'LinkedIn',
    };
    return names[platform] || platform;
  };

  const formatType = (type: string): string => {
    const types: Record<string, string> = {
      feed: 'Feed',
      reel: 'Reel',
      story: 'Historia',
      short: 'Short',
      standard: 'Video estándar',
      video: 'Video',
      tweet: 'Tweet',
      post: 'Publicación',
    };
    return types[type] || type;
  };

  const formatSettingKey = (key: string): string => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatSettingValue = (value: any): string => {
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const statusClass = !config.is_compatible
    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
    : config.warnings?.length
    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
    : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';

  const statusIcon = !config.is_compatible ? '✗' : config.warnings?.length ? '⚠' : '✓';

  const cardBorderClass = config.is_compatible
    ? 'border-gray-200 dark:border-neutral-700 hover:border-blue-500 dark:hover:border-blue-500'
    : 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10';

  return (
    <div
      className={`bg-white dark:bg-neutral-900 border-2 rounded-xl overflow-hidden transition-all ${cardBorderClass} hover:shadow-lg`}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{getPlatformIcon(config.platform)}</span>
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              {formatPlatformName(config.platform)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">@{config.account_name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${statusClass}`}>
            {!config.is_compatible ? 'Fallido' : config.warnings?.length ? 'Advertencia' : 'Listo'}
          </span>
          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Thumbnail */}
      {config.thumbnail_url && (
        <div className="w-full h-36 overflow-hidden bg-gray-100 dark:bg-neutral-800">
          <img src={config.thumbnail_url} alt="Preview" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Body */}
      <div className="p-3">
        {/* Type Selector */}
        {config.is_compatible && (
          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 min-w-[60px]">Tipo:</label>
            {editable && config.can_change_type && config.available_types ? (
              <select
                value={selectedType}
                onChange={handleTypeChange}
                className="flex-1 px-2.5 py-1.5 border border-gray-300 dark:border-neutral-600 rounded-md text-xs bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {config.available_types.map((type) => (
                  <option key={type} value={type}>
                    {formatType(type)}
                  </option>
                ))}
              </select>
            ) : (
              <span className="flex-1 px-2.5 py-1.5 bg-gray-100 dark:bg-neutral-800 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300">
                {formatType(config.type)}
              </span>
            )}
          </div>
        )}

        {/* Quality Info */}
        {config.quality && (
          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 min-w-[60px]">Calidad:</label>
            <div className="flex-1 flex gap-1.5 flex-wrap">
              {config.quality.resolution && (
                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs font-medium">
                  {config.quality.resolution}
                </span>
              )}
              {config.quality.aspect_ratio && (
                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs font-medium">
                  {config.quality.aspect_ratio}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Format Info */}
        {config.format && (
          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 min-w-[60px]">Formato:</label>
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-neutral-800 rounded text-xs font-medium text-gray-700 dark:text-gray-300">
              {config.format.extension}
            </span>
          </div>
        )}

        {/* Warnings */}
        {config.warnings && config.warnings.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-neutral-700">
            {config.warnings.map((warning, index) => (
              <div key={index} className="flex items-start gap-1.5 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md mb-1.5">
                <span className="text-yellow-600 dark:text-yellow-400 text-xs flex-shrink-0">⚠</span>
                <span className="text-xs text-yellow-900 dark:text-yellow-200 leading-relaxed">{warning}</span>
              </div>
            ))}
          </div>
        )}

        {/* Incompatibility */}
        {!config.is_compatible && (
          <div className="mt-2 pt-2 border-t border-red-300 dark:border-red-800">
            <div className="flex items-start gap-1.5 p-2 bg-red-100 dark:bg-red-900/30 rounded-md mb-1.5">
              <span className="text-red-600 dark:text-red-400 text-sm flex-shrink-0">✗</span>
              <span className="text-xs font-medium text-red-900 dark:text-red-200 leading-relaxed">
                {config.incompatibility_reason}
              </span>
            </div>
            {config.suggestion && (
              <div className="flex items-start gap-1.5 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <span className="text-sm flex-shrink-0">💡</span>
                <span className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">{config.suggestion}</span>
              </div>
            )}
          </div>
        )}

        {/* Applied Settings */}
        {config.applied_settings && Object.keys(config.applied_settings).length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-neutral-700">
            <button
              onClick={() => setSettingsExpanded(!settingsExpanded)}
              className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <span>{settingsExpanded ? '▼' : '▶'}</span>
              <span>Configuración aplicada</span>
            </button>
            {settingsExpanded && (
              <div className="mt-2 p-2 bg-gray-50 dark:bg-neutral-800 rounded-md">
                {Object.entries(config.applied_settings).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-1 text-xs">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">{formatSettingKey(key)}:</span>
                    <span className="text-gray-900 dark:text-gray-100 font-semibold">
                      {formatSettingValue(value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
