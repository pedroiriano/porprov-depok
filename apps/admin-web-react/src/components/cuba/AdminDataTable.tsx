import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import type { SortDirection } from '../../hooks/useTableControls';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from './AdminPrimitives';

const emptySelection = new Set<string>();
const ignoreSelection = () => undefined;

export type AdminDataTableColumn<T, K extends string> = {
  key: string;
  label: string;
  sortKey?: K;
  className?: string;
  headerClassName?: string;
  render: (row: T) => ReactNode;
};

function SelectionCheckbox({
  checked,
  indeterminate = false,
  disabled = false,
  label,
  onChange,
}: {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) checkboxRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(event) => onChange(event.target.checked)}
      aria-label={label}
      className="size-4 rounded border-slate-300 text-blue-600 accent-blue-600 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600"
    />
  );
}

export function AdminDataTable<T, K extends string>({
  caption,
  rows,
  columns,
  getRowId,
  sortKey,
  sortDirection,
  onSort,
  selectedIds = emptySelection,
  onSelectedIdsChange = ignoreSelection,
  isRowSelectable = () => true,
  getRowLabel,
  rowActions,
  loading = false,
  loadingLabel = 'Memuat data...',
  error = '',
  onRetry,
  emptyTitle = 'Belum ada data',
  emptyDescription,
  selectionLabel = 'data',
  selectionEnabled = true,
  minWidthClassName = 'min-w-[840px]',
}: {
  caption: string;
  rows: T[];
  columns: Array<AdminDataTableColumn<T, K>>;
  getRowId: (row: T) => string;
  sortKey: K;
  sortDirection: SortDirection;
  onSort: (key: K) => void;
  selectedIds?: Set<string>;
  onSelectedIdsChange?: (selected: Set<string>) => void;
  isRowSelectable?: (row: T) => boolean;
  getRowLabel?: (row: T) => string;
  rowActions?: (row: T) => ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  error?: string;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  selectionLabel?: string;
  selectionEnabled?: boolean;
  minWidthClassName?: string;
}) {
  if (loading) return <AdminLoadingState label={loadingLabel} />;
  if (error) return <AdminErrorState message={error} onRetry={onRetry} />;
  if (rows.length === 0) return <AdminEmptyState title={emptyTitle} description={emptyDescription} />;

  const selectableIds = selectionEnabled ? rows.filter(isRowSelectable).map(getRowId) : [];
  const selectedOnPage = selectableIds.filter((id) => selectedIds.has(id)).length;
  const allSelected = selectableIds.length > 0 && selectedOnPage === selectableIds.length;
  const partiallySelected = selectedOnPage > 0 && !allSelected;

  const setPageSelection = (checked: boolean) => {
    const next = new Set(selectedIds);
    selectableIds.forEach((id) => checked ? next.add(id) : next.delete(id));
    onSelectedIdsChange(next);
  };

  const setRowSelection = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    onSelectedIdsChange(next);
  };

  return (
    <div className="overflow-x-auto">
      <table className={`w-full border-collapse text-left ${minWidthClassName}`}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-y border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
            {selectionEnabled && <th scope="col" className="w-14 px-4 py-3 text-center">
              <SelectionCheckbox
                checked={allSelected}
                indeterminate={partiallySelected}
                disabled={selectableIds.length === 0}
                label={`Pilih semua ${selectionLabel} pada halaman ini`}
                onChange={setPageSelection}
              />
            </th>}
            {columns.map((column) => {
              const active = column.sortKey === sortKey;
              const ariaSort = column.sortKey
                ? (active ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none')
                : undefined;
              const SortIcon = !active ? ArrowUpDown : sortDirection === 'asc' ? ArrowUp : ArrowDown;
              return (
                <th key={column.key} scope="col" aria-sort={ariaSort} className={`px-4 py-3 ${column.headerClassName || ''}`}>
                  {column.sortKey ? (
                    <button type="button" onClick={() => onSort(column.sortKey!)} className="inline-flex min-h-11 items-center gap-1.5 text-left hover:text-blue-700 dark:hover:text-blue-200" aria-label={`Urutkan berdasarkan ${column.label}`}>
                      {column.label}
                      <SortIcon className={`size-3.5 ${active ? 'text-blue-600 dark:text-blue-300' : 'text-slate-400'}`} aria-hidden="true" />
                    </button>
                  ) : column.label}
                </th>
              );
            })}
            {rowActions && <th scope="col" className="px-4 py-3 text-right">Aksi</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
          {rows.map((row) => {
            const id = getRowId(row);
            const selectable = isRowSelectable(row);
            const selected = selectedIds.has(id);
            return (
              <tr key={id} aria-selected={selected || undefined} className={`transition-colors hover:bg-blue-50/60 dark:hover:bg-blue-950/20 ${selected ? 'bg-blue-50 dark:bg-blue-950/30' : ''}`}>
                {selectionEnabled && <td className="px-4 py-3 text-center">
                  <SelectionCheckbox checked={selected} disabled={!selectable} label={selectable ? `Pilih ${selectionLabel} ${getRowLabel?.(row) || id}` : `${selectionLabel} ${getRowLabel?.(row) || id} tidak dapat dipilih`} onChange={(checked) => setRowSelection(id, checked)} />
                </td>}
                {columns.map((column) => <td key={column.key} className={`px-4 py-3 ${column.className || ''}`}>{column.render(row)}</td>)}
                {rowActions && <td className="px-4 py-3 text-right"><div className="flex justify-end gap-1">{rowActions(row)}</div></td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
