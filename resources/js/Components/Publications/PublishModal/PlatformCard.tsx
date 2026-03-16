import { SocialAccount } from '@/types/Publication';

interface PlatformCardProps {
  account: SocialAccount;
  isSelected: boolean;
  isCompatible: boolean;
  onToggle: () => void;
}

export default function PlatformCard({
  account,
  isSelected,
  isCompatible,
  onToggle,
}: PlatformCardProps) {
  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      instagram: '📷',
      twitter: '🐦',
      facebook: '📘',
      youtube: '📺',
      tiktok: '🎵',
      linkedin: '💼',
      pinterest: '📌',
    };
    return icons[platform.toLowerCase()] || '📱';
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      instagram: 'from-purple-500 to-pink-500',
      twitter: 'from-blue-400 to-blue-600',
      facebook: 'from-blue-600 to-blue-800',
      youtube: 'from-red-500 to-red-700',
      tiktok: 'from-black to-gray-800',
      linkedin: 'from-blue-700 to-blue-900',
      pinterest: 'from-red-600 to-red-800',
    };
    return colors[platform.toLowerCase()] || 'from-gray-500 to-gray-700';
  };

  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-all ${isCompatible ? 'opacity-100' : 'cursor-not-allowed opacity-50'} ${
        isSelected && isCompatible
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50 dark:border-neutral-700 dark:hover:bg-blue-900/10'
      } `}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggle}
        disabled={!isCompatible}
        className="rounded"
      />

      <div className="flex flex-1 items-center gap-2">
        <div
          className={`h-8 w-8 rounded-full bg-gradient-to-r ${getPlatformColor(account.platform)} flex items-center justify-center text-sm text-white`}
        >
          {getPlatformIcon(account.platform)}
        </div>

        <div className="flex-1">
          <div
            className={`text-sm font-medium ${
              isSelected && isCompatible
                ? 'text-blue-700 dark:text-blue-300'
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            {account.platform.charAt(0).toUpperCase() + account.platform.slice(1)}
          </div>
          {account.account_name && (
            <div className="text-xs text-gray-500 dark:text-gray-400">{account.account_name}</div>
          )}
        </div>
      </div>
    </label>
  );
}
