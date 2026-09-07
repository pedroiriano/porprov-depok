import React, { useState, useRef, useEffect, useId } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  subLabel?: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Pilih opsi...',
  ariaLabel,
  disabled = false
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  // Find the selected option label
  const selectedOption = options.find(opt => opt.value === value);

  // Filter options based on search query
  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (opt.subLabel && opt.subLabel.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={ariaLabel || placeholder}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        className={`flex min-h-11 w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm shadow-sm transition-colors ${
          disabled ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800' :
          'border-slate-300 bg-white hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-slate-700 dark:bg-slate-900'
        }`}
      >
        <span className={`block truncate ${!selectedOption ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg animate-fade-in-up dark:border-slate-700 dark:bg-slate-800">
          <div className="p-2 border-b border-slate-100 dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                autoFocus
                placeholder="Cari..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div id={listboxId} role="listbox" aria-label={ariaLabel || placeholder} className="max-h-60 overflow-y-auto custom-scrollbar p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={value === opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`flex min-h-11 w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${
                    value === opt.value
                      ? 'bg-blue-50 font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-200'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex flex-col items-start text-left">
                    <span>{opt.label}</span>
                    {opt.subLabel && <span className="text-xs text-slate-500 dark:text-slate-400">{opt.subLabel}</span>}
                  </div>
                  {value === opt.value && <Check className="w-4 h-4" />}
                </button>
              ))
            ) : (
              <div className="p-3 text-sm text-center text-slate-500 dark:text-slate-400">
                Tidak ada hasil ditemukan.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
