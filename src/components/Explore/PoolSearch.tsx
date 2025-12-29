import React from "react";
import { Search, X } from "lucide-react";
import ViewToggle from "./ViewToggle";

interface PoolSearchProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
}

const PoolSearch: React.FC<PoolSearchProps> = ({
  searchQuery,
  onSearchChange,
  onClearSearch,
  viewMode,
  onViewModeChange,
}) => {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search pools by name, token symbol, price feed, or chain..."
          value={searchQuery}
          onChange={onSearchChange}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-2xl dark:bg-[#10151c] dark:text-white dark:border-gray-600 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={onClearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            type="button"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          </button>
        )}
      </div>
      <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
    </div>
  );
};

export default PoolSearch;