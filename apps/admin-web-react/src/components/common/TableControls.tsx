import React from 'react';
import { ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { SortDirection } from '../../hooks/useTableControls';
import { ROWS_PER_PAGE_OPTIONS } from '../../hooks/useTableControls';

// INFO: Komponen standar footer pagination untuk semua tabel
interface TablePaginationProps {
  startItem: number;
  safePage?: number; // Support safePage dari hook usePagination
  endItem: number;
  totalItems: number;
  totalAll?: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Label entitas, contoh: "data", "event", "pengguna" */
  itemLabel?: string;
  /** Teks tambahan di samping info range */
  footerNote?: string;
}

export function TablePagination({
  startItem, endItem, totalItems, totalAll,
  currentPage, totalPages, onPageChange,
  itemLabel = 'data', footerNote,
}: TablePaginationProps) {
  // INFO: Render max 5 page numbers around current page
  const pages: number[] = [];
  let start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  start = Math.max(1, end - 4);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-700 px-4 py-3 sm:flex-row">
      {/* INFO: Info range */}
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Menampilkan{' '}
        <span className="font-semibold text-slate-900 dark:text-white">{startItem}</span>
        &ndash;
        <span className="font-semibold text-slate-900 dark:text-white">{endItem}</span>
        {' '}dari{' '}
        <span className="font-semibold text-slate-900 dark:text-white">{totalItems}</span>
        {' '}{itemLabel}
        {totalAll !== undefined && totalAll !== totalItems && (
          <span className="ml-1 text-slate-400 dark:text-slate-500">({totalAll} total)</span>
        )}
        {footerNote && <span className="ml-1">&middot; {footerNote}</span>}
      </p>

      {/* INFO: Pagination controls */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Halaman pertama"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
              page === currentPage
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Halaman berikutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Halaman terakhir"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// INFO: Komponen standar rows-per-page selector
interface RowsPerPageSelectorProps {
  value?: number;
  rowsPerPage?: number; // Support rowsPerPage dari subagent
  onChange: (value: number) => void;
}

export function RowsPerPageSelector({ value, rowsPerPage, onChange }: RowsPerPageSelectorProps) {
  const selectedValue = value !== undefined ? value : (rowsPerPage !== undefined ? rowsPerPage : 10);
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
      <span className="whitespace-nowrap">Tampilkan</span>
      <div className="relative">
        <select
          value={selectedValue}
          onChange={(e) => onChange(Number(e.target.value))}
          className="min-h-9 appearance-none rounded-lg border border-slate-300 bg-white py-1 pl-3 pr-8 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          {ROWS_PER_PAGE_OPTIONS.map((opt) => (
            <option key={opt} value={opt} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{opt}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
      </div>
      <span className="whitespace-nowrap">baris</span>
    </div>
  );
}

// INFO: Komponen standar sortable table header yang fleksibel
interface SortableHeaderProps<K extends string> {
  label?: string;
  children?: React.ReactNode;
  
  columnKey?: K;
  sortKey?: K;
  field?: K;
  
  activeSortKey?: K;
  currentSortKey?: K;
  currentSort?: K;
  
  sortDirection?: SortDirection;
  direction?: SortDirection;
  
  onSort: (key: K) => void;
  className?: string;
}

export function SortableHeader<K extends string>({
  label, children, columnKey, sortKey, field,
  activeSortKey, currentSortKey, currentSort,
  sortDirection, direction, onSort, className
}: SortableHeaderProps<K>) {
  const key = (columnKey || sortKey || field) as K;
  const activeKey = (activeSortKey || currentSortKey || currentSort) as K;
  const activeDir = (sortDirection || direction || 'asc') as SortDirection;
  
  const textLabel = label || children;
  const isActive = activeKey === key;

  const content = (
    <button
      type="button"
      onClick={() => onSort(key)}
      className="group inline-flex items-center gap-1 font-medium uppercase tracking-wider hover:text-indigo-600 dark:hover:text-indigo-400"
    >
      {textLabel}
      <span className={`ml-0.5 inline-flex transition-colors ${isActive ? 'text-indigo-500' : 'text-slate-400 dark:text-slate-600'}`}>
        {isActive ? (
          <ArrowUpDown className={`h-3.5 w-3.5 transition-transform ${activeDir === 'desc' ? 'rotate-180' : ''}`} />
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100" />
        )}
      </span>
    </button>
  );

  // CHANGE: Jika dipanggil dengan className (misal: "p-4 font-medium" untuk <th>), 
  // maka render sebagai <th> agar struktur HTML table valid.
  if (className) {
    return <th className={className}>{content}</th>;
  }
  
  return content;
}
