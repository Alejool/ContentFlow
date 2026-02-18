import React from "react";
import { X } from "lucide-react";
import Button from "@/Components/common/Modern/Button";

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
      <Button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        buttonStyle="solid"
        variant="danger"
        size="sm"
        icon={X}
        className="absolute top-2 right-2 opacity-0 group-hover/item:opacity-100"
      />
    </div>
  );
};

export default ImagePreviewItem;
