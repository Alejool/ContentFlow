import React from "react";
import { X } from "lucide-react";

interface ImagePreviewItemProps {
  preview: string;
  index: number;
  onRemove: () => void;
}

const ImagePreviewItem: React.FC<ImagePreviewItemProps> = ({
  preview,
  index,
  onRemove,
}) => {
  return (
    <div className="relative group/item aspect-video border rounded-lg overflow-hidden bg-gray-900">
      <img
        src={preview}
        alt={`Preview ${index}`}
        className="w-full h-full object-cover"
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover/item:opacity-100 backdrop-blur-sm"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

export default ImagePreviewItem;
