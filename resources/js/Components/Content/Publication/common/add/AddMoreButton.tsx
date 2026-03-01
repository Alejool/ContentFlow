import React from "react";
import { Upload } from "lucide-react";

interface AddMoreButtonProps {
  onClick: () => void;
}

const AddMoreButton: React.FC<AddMoreButtonProps> = ({ onClick }) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className="flex items-center justify-center aspect-video border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <div className="text-center">
        <Upload className="w-6 h-6 mx-auto text-gray-400" />
        <span className="text-xs text-gray-500">Add more</span>
      </div>
    </div>
  );
};

export default AddMoreButton;
