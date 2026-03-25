"use client";

import { useState, useCallback } from "react";
import { Search, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ContactFiltersProps {
  onSearch: (query: string) => void;
  onCreateClick: () => void;
  searchValue: string;
}

export function ContactFilters({ onSearch, onCreateClick, searchValue }: ContactFiltersProps) {
  const [localSearch, setLocalSearch] = useState(searchValue);

  const handleSearch = useCallback(
    (value: string) => {
      setLocalSearch(value);
      // Debounce
      const timeout = setTimeout(() => onSearch(value), 300);
      return () => clearTimeout(timeout);
    },
    [onSearch]
  );

  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3 flex-1">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <Input
            placeholder="Search contacts..."
            value={localSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
          {localSearch && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <Button onClick={onCreateClick} className="btn-press">
        <Plus className="h-4 w-4 mr-2" />
        Add Contact
      </Button>
    </div>
  );
}
