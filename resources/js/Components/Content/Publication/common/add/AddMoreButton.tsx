import React from 'react';
import { Upload } from 'lucide-react';

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
      className="flex aspect-video cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 transition-colors hover:bg-gray-50"
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <div className="text-center">
        <Upload className="mx-auto h-6 w-6 text-gray-400" />
        <span className="text-xs text-gray-500">Add more</span>
      </div>
    </div>
  );
};

export default AddMoreButton;
