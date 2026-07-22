import { useEffect, useMemo, useState } from 'react';

// INFO: Tipe sorting generik
export type SortDirection = 'asc' | 'desc';

// INFO: Opsi jumlah baris per halaman standar
export const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;

/**
 * Hook reusable untuk kontrol tabel: sorting, pagination, dan rows-per-page.
 * Digunakan bersama komponen TablePagination dan SortableHeader.
 */
export function useTableControls<K extends string>(defaults?: {
  sortKey?: K;
  sortDirection?: SortDirection;
  rowsPerPage?: number;
}) {
  const [sortKey, setSortKey] = useState<K>((defaults?.sortKey ?? '') as K);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaults?.sortDirection ?? 'asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(defaults?.rowsPerPage ?? 10);

  const handleSort = (key: K, defaultDirection?: SortDirection) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection(defaultDirection ?? 'asc');
    }
  };

  // CHANGE: Reset ke halaman 1 saat rowsPerPage berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage]);

  return {
    sortKey,
    sortDirection,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    handleSort,
    resetPage: () => setCurrentPage(1),
    
    // INFO: Alias backward compatibility lengkap untuk seluruh varian subagent
    handleChangePage: (page: number) => setCurrentPage(page),
    handlePageChange: (page: number) => setCurrentPage(page),
    setPage: (page: number) => setCurrentPage(page),
    handleChangeRowsPerPage: (value: number) => setRowsPerPage(value),
    handleRowsPerPageChange: (value: number) => setRowsPerPage(value),
  };
}

/**
 * Hook untuk mem-paginate array data.
 * Mengembalikan data yang sudah dipaginasi beserta metadata pagination.
 */
export function usePagination<T>(data: T[], currentPage: number, rowsPerPage: number) {
  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const startIndex = (safePage - 1) * rowsPerPage;
    return data.slice(startIndex, startIndex + rowsPerPage);
  }, [data, safePage, rowsPerPage]);

  const startItem = totalItems === 0 ? 0 : (safePage - 1) * rowsPerPage + 1;
  const endItem = Math.min(safePage * rowsPerPage, totalItems);

  return {
    paginatedData,
    totalItems,
    totalPages,
    startItem,
    endItem,
    safePage,
  };
}
