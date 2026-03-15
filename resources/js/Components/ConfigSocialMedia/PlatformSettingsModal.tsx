import PlatformModalContent from "@/Components/ConfigSocialMedia/PlatformModalContent";
import PlatformModalFooter from "@/Components/ConfigSocialMedia/PlatformModalFooter";
import PlatformModalHeader from "@/Components/ConfigSocialMedia/PlatformModalHeader";
import Modal from "@/Components/common/ui/Modal";

interface PlatformSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  platform: string;
  settings: any;
  onSettingsChange: (newSettings: any) => void;
  videoMetadata?: {
    duration: number;
    width?: number;
    height?: number;
    aspectRatio?: number;
  };
  allPlatforms?: string[];
  allSettings?: Record<string, any>;
  onAllSettingsChange?: (platform: string, newSettings: any) => void;
}

export default function PlatformSettingsModal({
  isOpen,
  onClose,
  onSave,
  platform,
  settings,
  onSettingsChange,
  videoMetadata,
  allPlatforms = [],
  allSettings = {},
  onAllSettingsChange,
}: PlatformSettingsModalProps) {
  const isAllPlatforms =
    platform.toLowerCase() === "all" || allPlatforms.length > 0;

  return (
    <Modal show={isOpen} onClose={onClose} maxWidth="lg">
      <div className="relative overflow-hidden bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary-500/5 rounded-full blur-lg pointer-events-none" />

        <div className="px-6">
          <PlatformModalHeader
            platform={platform}
            isAllPlatforms={isAllPlatforms}
            onClose={onClose}
          />

          <div className="max-h-[60vh] overflow-y-auto pr-4 platform-modal-scrollbar">
            <div className="space-y-8 py-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <PlatformModalContent
                platform={platform}
                settings={settings}
                onSettingsChange={onSettingsChange}
                videoMetadata={videoMetadata}
                allPlatforms={allPlatforms}
                allSettings={allSettings}
                onAllSettingsChange={onAllSettingsChange}
              />
            </div>
          </div>

          <PlatformModalFooter onClose={onClose} onSave={onSave} />
        </div>
      </div>
    </Modal>
  );
}
