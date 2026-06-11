import React from 'react';
import { Search, Info } from 'lucide-react';
import { TableSkeleton } from './Skeleton';

interface Column<T> {
  header: string;
  accessor?: keyof T | string;
  render?: (val: any, row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  onSearchChange?: (val: string) => void;
  searchValue?: string;
  searchPlaceholder?: string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  onSearchChange,
  searchValue = '',
  searchPlaceholder = 'Search records...'
}: DataTableProps<T>) {
  if (isLoading) {
    return <TableSkeleton rows={5} cols={columns.length} />;
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      {onSearchChange && (
        <div className="relative max-w-sm">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      )}

      {/* Table grid */}
      <div className="border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                {columns.map((col, idx) => (
                  <th 
                    key={idx} 
                    className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans"
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {data.length > 0 ? (
                data.map((row, rIdx) => (
                  <tr 
                    key={rIdx} 
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors"
                  >
                    {columns.map((col, cIdx) => {
                      const val = col.accessor ? (row as any)[col.accessor] : undefined;
                      return (
                        <td key={cIdx} className="p-4 text-sm text-slate-600 dark:text-slate-300">
                          {col.render ? col.render(val, row) : val}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="p-8 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 text-slate-400 rounded-full">
                        <Info size={24} />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                        No records match the active criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
export default DataTable;
