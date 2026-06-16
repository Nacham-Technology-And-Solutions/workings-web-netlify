import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { MaterialCatalogItem } from '@/types/estimation';

type MaterialGroup = {
  category: string;
  items: MaterialCatalogItem[];
};

interface SearchableMaterialSelectProps {
  groups: MaterialGroup[];
  value: string;
  onChange: (itemKey: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

const SearchableMaterialSelect: React.FC<SearchableMaterialSelectProps> = ({
  groups,
  value,
  onChange,
  placeholder = 'Search or select a material…',
  disabled = false,
  id,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedItem = useMemo(() => {
    for (const group of groups) {
      const match = group.items.find((item) => item.itemKey === value);
      if (match) return match;
    }
    return null;
  }, [groups, value]);

  const filteredGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return groups;

    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.itemName.toLowerCase().includes(normalizedQuery) ||
            item.itemKey.toLowerCase().includes(normalizedQuery)
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (itemKey: string) => {
    onChange(itemKey);
    setQuery('');
    setOpen(false);
  };

  const displayValue = open ? query : selectedItem?.itemName ?? '';

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          id={id}
          type="text"
          value={displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery('');
          }}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            if (disabled) return;
            setOpen((prev) => !prev);
            if (!open) setQuery('');
          }}
          disabled={disabled}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          aria-label="Toggle material list"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {open && !disabled && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg"
        >
          {filteredGroups.length === 0 ? (
            <li className="px-4 py-3 text-sm text-gray-500">No materials found</li>
          ) : (
            filteredGroups.map((group) => (
              <li key={group.category}>
                <div className="sticky top-0 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 border-b border-gray-100">
                  {group.category}
                </div>
                <ul>
                  {group.items.map((item) => (
                    <li key={item.itemKey}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={value === item.itemKey}
                        onClick={() => handleSelect(item.itemKey)}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                          value === item.itemKey ? 'bg-gray-100 font-medium text-gray-900' : 'text-gray-800'
                        }`}
                      >
                        <span className="block">{item.itemName}</span>
                        <span className="block text-xs text-gray-500 font-mono">{item.itemKey}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default SearchableMaterialSelect;
