import React from 'react';
import { X } from 'lucide-react';

interface ImagePreviewItemProps {
  preview: string;
  index: number;
  onRemove: () => void;
}

const ImagePreviewItem: React.FC<ImagePreviewItemProps> = ({ preview, index, onRemove }) => {
  return (
    <div className="group/item relative aspect-video overflow-hidden rounded-lg border bg-gray-900">
      <img src={preview} alt={`Preview ${index}`} className="h-full w-full object-cover" />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute right-2 top-2 rounded-full bg-red-500/80 p-1.5 text-white opacity-0 backdrop-blur-sm transition-colors hover:bg-red-600 group-hover/item:opacity-100"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};

export default ImagePreviewItem;
