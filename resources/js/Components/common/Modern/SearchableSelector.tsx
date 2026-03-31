import { Search, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface SearchableSelectorProps<T> {
  items: T[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  loading?: boolean;
  mode?: 'single' | 'multiple';
  searchPlaceholder?: string;
  emptyMessage?: string;
  noResultsMessage?: string;
  renderItem: (item: T, isSelected: boolean) => React.ReactNode;
  getItemId: (item: T) => number;
  getSearchableText: (item: T) => string;
  className?: string;
  disabled?: boolean;
  maxHeight?: string;
}

export default function SearchableSelector<T>({
  items,
  selectedIds,
  onToggle,
  loading = false,
  mode = 'multiple',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No items available',
  noResultsMessage = 'No results found',
  renderItem,
  getItemId,
  getSearchableText,
  className = '',
  disabled = false,
  maxHeight = 'max-h-64',
}: SearchableSelectorProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return items;
    }

    const query = searchQuery.toLowerCase();
    return items.filter((item) => getSearchableText(item).toLowerCase().includes(query));
  }, [items, searchQuery, getSearchableText]);

  const handleToggle = (id: number) => {
    if (disabled) return;

    if (mode === 'single') {
      // For single mode, if clicking the same item, deselect it
      if (selectedIds.includes(id)) {
        onToggle(id);
      } else {
        // Clear previous selection and select new one
        selectedIds.forEach((selectedId) => {
          if (selectedId !== id) {
            onToggle(selectedId);
          }
        });
        onToggle(id);
      }
    } else {
      // Multiple mode - just toggle
      onToggle(id);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-primary-500"></div>
        Loading...
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Search Input - Sticky at top */}
      <div className="relative mb-3 flex-shrink-0">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-transparent focus:ring-2 focus:ring-primary-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-100 dark:placeholder-gray-500"
          disabled={disabled}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Items List - Scrollable */}
      <div className={`space-y-2 overflow-y-auto ${maxHeight} custom-scrollbar`}>
        {filteredItems.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {items.length === 0 ? emptyMessage : noResultsMessage}
          </div>
        ) : (
          filteredItems.map((item) => {
            const itemId = getItemId(item);
            const isSelected = selectedIds.includes(itemId);

            return (
              <div
                key={itemId}
                onClick={() => handleToggle(itemId)}
                className={`cursor-pointer transition-all ${
                  disabled ? 'cursor-not-allowed opacity-60' : ''
                }`}
              >
                {renderItem(item, isSelected)}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
