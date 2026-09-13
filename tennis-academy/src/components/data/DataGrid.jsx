import { useState } from 'react';
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel, flexRender,
} from '@tanstack/react-table';
import { motion } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUp, ArrowDown } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import { SearchX } from 'lucide-react';

const PAGE_SIZES = [10, 25, 50];

export default function DataGrid({
  data,
  columns,
  searchPlaceholder = 'Search...',
  onRowClick,
  hideSearch = false,
  emptyTitle,
  emptyDescription,
}) {
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pageSize, setPageSize] = useState(10);

  const table = useReactTable({
    data, columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const { pageIndex } = table.getState().pagination;
  const rowCount = table.getFilteredRowModel().rows.length;
  const pageCount = table.getPageCount();
  const startRow = rowCount === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, rowCount);

  const rowVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.03, duration: 0.18, ease: 'easeOut' },
    }),
  };

  return (
    <Card padding={false} className="overflow-hidden">
      {hideSearch ? (
        <div className="flex items-center justify-end px-4 pt-4 pb-3 gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-ink-faint">Rows</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); table.setPageSize(Number(e.target.value)); }}
              className="h-[32px] px-2 rounded-lg border border-line bg-white text-[12px] text-ink outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
            >
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              <option value={rowCount || 9999}>All</option>
            </select>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between px-4 pt-4 pb-3 gap-3 flex-wrap">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
            <input
              value={globalFilter ?? ''}
              onChange={e => setGlobalFilter(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 h-[38px] bg-canvas-soft border border-line rounded-lg text-[13px] outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-ink-faint">Rows</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); table.setPageSize(Number(e.target.value)); }}
              className="h-[32px] px-2 rounded-lg border border-line bg-white text-[12px] text-ink outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
            >
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              <option value={rowCount || 9999}>All</option>
            </select>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px] min-w-0">
          <thead className="sticky top-0 z-10 bg-canvas-soft text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-faint">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(h => (
                  <th
                    key={h.id}
                    onClick={h.column.getToggleSortingHandler()}
                    className="px-4 h-[42px] cursor-pointer select-none hover:bg-line/30 whitespace-nowrap"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {h.column.getIsSorted() === 'asc' && <ArrowUp className="w-3 h-3 text-brand" />}
                      {h.column.getIsSorted() === 'desc' && <ArrowDown className="w-3 h-3 text-brand" />}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-line">
            {table.getRowModel().rows.map((r, idx) => (
              <motion.tr
                key={r.id}
                custom={idx}
                initial="hidden"
                animate="visible"
                variants={rowVariants}
                className={onRowClick ? 'hover:bg-canvas-soft transition-colors cursor-pointer' : 'hover:bg-canvas-soft transition-colors'}
                onClick={() => onRowClick?.(r.original)}
              >
                {r.getVisibleCells().map(c => (
                  <td key={c.id} className="px-4 h-[52px] text-ink whitespace-nowrap">
                    {flexRender(c.column.columnDef.cell, c.getContext())}
                  </td>
                ))}
              </motion.tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-0">
                  <EmptyState
                    icon={SearchX}
                    title={
                      !data || data.length === 0
                        ? (emptyTitle || 'No items found')
                        : 'No results found'
                    }
                    description={
                      !data || data.length === 0
                        ? (emptyDescription || 'No items available to display.')
                        : 'Try adjusting your search or filters.'
                    }
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {rowCount > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-line gap-3 flex-wrap">
          <span className="text-[11px] text-ink-faint">
            Showing {startRow}-{endRow} of {rowCount}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="sm" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-[12px] text-ink-muted px-2 min-w-[60px] text-center">
              {pageIndex + 1} / {pageCount || 1}
            </span>
            <Button variant="secondary" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => table.setPageIndex(pageCount - 1)} disabled={!table.getCanNextPage()}>
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}