import MediaUploadSection from '@/Components/Content/Publication/common/edit/MediaUploadSection';
import MediaUploadSkeleton from '@/Components/Content/Publication/common/edit/MediaUploadSkeleton';
import type { TFunction } from 'i18next';
import { SectionHeader } from '../common/SectionHeader';

interface MediaSectionProps {
  t: TFunction;
  isDataReady: boolean;
  mediaPreviews: any[];
  thumbnails: Record<string, File>;
  imageError: string | null;
  isDragOver: boolean;
  hasPublishedPlatform: boolean;
  isMediaSectionDisabled: boolean;
  isAnyMediaProcessing: boolean;
  uploadProgress: Record<string, number>;
  uploadStats: Record<string, any>;
  uploadErrors: Record<string, string>;
  remoteLock: any;
  videoMetadata: Record<string, any>;
  publicationId?: number;
  allMediaFiles: any[];
  onFileChange: (files: FileList | null) => void;
  onRemoveMedia: (tempId: string) => void;
  onSetThumbnail: (tempId: string, file: File) => void;
  onClearThumbnail: (tempId: string) => void;
  onUpdateFile: (tempId: string, file: File) => void;
  setIsDragOver: (value: boolean) => void;
}

export const MediaSection = ({
  t,
  isDataReady,
  mediaPreviews,
  thumbnails,
  imageError,
  isDragOver,
  hasPublishedPlatform,
  isMediaSectionDisabled,
  isAnyMediaProcessing,
  uploadProgress,
  uploadStats,
  uploadErrors,
  remoteLock,
  videoMetadata,
  publicationId,
  allMediaFiles,
  onFileChange,
  onRemoveMedia,
  onSetThumbnail,
  onClearThumbnail,
  onUpdateFile,
  setIsDragOver,
}: MediaSectionProps) => {
  return (
    <div className="space-y-4">
      <SectionHeader title={t('publications.modal.edit.mediaSection') || 'Archivos Multimedia'} />

      {!isDataReady ? (
        <MediaUploadSkeleton />
      ) : (
        <MediaUploadSection
          mediaPreviews={mediaPreviews}
          thumbnails={thumbnails}
          imageError={imageError}
          isDragOver={isDragOver}
          t={t}
          onFileChange={onFileChange}
          onRemoveMedia={onRemoveMedia}
          onSetThumbnail={onSetThumbnail}
          onClearThumbnail={onClearThumbnail}
          onUpdateFile={onUpdateFile}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);
            onFileChange(e.dataTransfer.files);
          }}
          disabled={hasPublishedPlatform || isMediaSectionDisabled}
          isAnyMediaProcessing={isAnyMediaProcessing}
          uploadProgress={uploadProgress}
          uploadStats={uploadStats}
          uploadErrors={uploadErrors}
          lockedBy={remoteLock}
          videoMetadata={videoMetadata}
          publicationId={publicationId}
          allMediaFiles={allMediaFiles}
        />
      )}
    </div>
  );
};
