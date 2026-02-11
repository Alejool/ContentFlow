import { Search, X } from "lucide-react";
import React, { useMemo, useState } from "react";

interface SearchableSelectorProps<T> {
  items: T[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  loading?: boolean;
  mode?: "single" | "multiple";
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
  mode = "multiple",
  searchPlaceholder = "Search...",
  emptyMessage = "No items available",
  noResultsMessage = "No results found",
  renderItem,
  getItemId,
  getSearchableText,
  className = "",
  disabled = false,
  maxHeight = "max-h-64",
}: SearchableSelectorProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return items;
    }

    const query = searchQuery.toLowerCase();
    return items.filter((item) =>
      getSearchableText(item).toLowerCase().includes(query),
    );
  }, [items, searchQuery, getSearchableText]);

  const handleToggle = (id: number) => {
    if (disabled) return;

    if (mode === "single") {
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
    setSearchQuery("");
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
        Loading...
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Search Input - Sticky at top */}
      <div className="relative mb-3 flex-shrink-0">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
          disabled={disabled}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Items List - Scrollable */}
      <div
        className={`space-y-2 overflow-y-auto ${maxHeight} custom-scrollbar`}
      >
        {filteredItems.length === 0 ? (
          <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
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
                  disabled ? "opacity-60 cursor-not-allowed" : ""
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
