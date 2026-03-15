import { Publication, SocialAccount } from '@/types/Publication';
import PlatformCard from './PlatformCard';

interface PlatformSelectorProps {
  socialAccounts: SocialAccount[];
  selectedPlatforms: number[];
  onPlatformChange: (accountId: number) => void;
  publication: Publication;
}

export default function PlatformSelector({
  socialAccounts,
  selectedPlatforms,
  onPlatformChange,
  publication,
}: PlatformSelectorProps) {
  // Filter platforms based on content type compatibility
  const getCompatibleAccounts = () => {
    if (!publication.content_type) return socialAccounts;

    return socialAccounts.filter((account) => {
      const supportedTypes = getSupportedContentTypes(account.platform);
      return supportedTypes.includes(publication.content_type);
    });
  };

  const getSupportedContentTypes = (platform: string): string[] => {
    const supportedTypes: Record<string, string[]> = {
      instagram: ['post', 'reel', 'story', 'carousel'],
      twitter: ['post', 'poll'],
      tiktok: ['reel'],
      youtube: ['post', 'reel'],
      facebook: ['post', 'story'], // Facebook no soporta encuestas nativas
      linkedin: ['post', 'carousel'],
      pinterest: ['post', 'carousel'],
    };

    return supportedTypes[platform.toLowerCase()] || ['post'];
  };

  const compatibleAccounts = getCompatibleAccounts();
  const incompatibleAccounts = socialAccounts.filter(
    (account) => !compatibleAccounts.includes(account),
  );

  return (
    <div className="mb-6">
      <h3 className="mb-3 text-base font-semibold text-gray-700 dark:text-gray-300">
        Selecciona las plataformas
      </h3>

      {/* Compatible Platforms */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        {compatibleAccounts.map((account) => (
          <PlatformCard
            key={account.id}
            account={account}
            isSelected={selectedPlatforms.includes(account.id)}
            isCompatible={true}
            onToggle={() => onPlatformChange(account.id)}
          />
        ))}
      </div>

      {/* Incompatible Platforms Warning */}
      {incompatibleAccounts.length > 0 && (
        <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
          <div className="flex items-start gap-2">
            <span className="text-lg text-yellow-600 dark:text-yellow-400">⚠</span>
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Plataformas no compatibles con {publication.content_type}:
              </p>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                {incompatibleAccounts.map((account) => account.platform).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
