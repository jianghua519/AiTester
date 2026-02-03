import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from '@tanstack/react-table';
import { Virtual, VirtualItem } from '@tanstack/react-virtual';
import { ChevronDown, ChevronUp, ArrowUpDown, Search, Filter, X } from 'lucide-react';
import { TestCaseResponse, TestCaseStatus, TestCasePriority, TestCaseType } from '../types/testCase';

interface VirtualizedTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  height?: number;
  rowHeight?: number;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  totalCount?: number;
  pagination?: {
    page: number;
    size: number;
    total: number;
    onPageChange: (page: number) => void;
    onSizeChange: (size: number) => void;
  };
  onSortChange?: (sorting: SortingState) => void;
  onFilterChange?: (filters: ColumnFiltersState) => void;
}

const VirtualizedTable = <T extends Record<string, any>>({
  data,
  columns,
  height = 600,
  rowHeight = 42,
  onRowClick,
  loading = false,
  totalCount = 0,
  pagination,
  onSortChange,
  onFilterChange,
}: VirtualizedTableProps<T>) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState('');

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
    },
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(newSorting);
      onSortChange?.(newSorting);
    },
    onColumnFiltersChange: (updater) => {
      const newFilters = typeof updater === 'function' ? updater(columnFilters) : updater;
      setColumnFilters(newFilters);
      onFilterChange?.(newFilters);
    },
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    debugTable: false,
  });

  const { rows } = table.getRowModel();
  const virtualRows = table.getRowModel().rows;
  const totalHeight = virtualRows.length * rowHeight;
  const containerRef = React.useRef<HTMLDivElement>(null);

  // 状态标签组件
  const StatusBadge = ({ status }: { status: TestCaseStatus }) => {
    const statusConfig = {
      [TestCaseStatus.DRAFT]: { label: '草稿', className: 'bg-gray-100 text-gray-800' },
      [TestCaseStatus.ACTIVE]: { label: '激活', className: 'bg-green-100 text-green-800' },
      [TestCaseStatus.BLOCKED]: { label: '阻塞', className: 'bg-red-100 text-red-800' },
      [TestCaseStatus.DEPRECATED]: { label: '废弃', className: 'bg-yellow-100 text-yellow-800' },
    };
    
    const config = statusConfig[status];
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  // 优先级标签组件
  const PriorityBadge = ({ priority }: { priority: TestCasePriority }) => {
    const priorityConfig = {
      [TestCasePriority.LOW]: { label: '低', className: 'bg-blue-100 text-blue-800' },
      [TestCasePriority.MEDIUM]: { label: '中', className: 'bg-yellow-100 text-yellow-800' },
      [TestCasePriority.HIGH]: { label: '高', className: 'bg-orange-100 text-orange-800' },
      [TestCasePriority.CRITICAL]: { label: '紧急', className: 'bg-red-100 text-red-800' },
    };
    
    const config = priorityConfig[priority];
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  // 类型标签组件
  const TypeBadge = ({ type }: { type: TestCaseType }) => {
    const typeConfig = {
      [TestCaseType.FUNCTIONAL]: { label: '功能', className: 'bg-purple-100 text-purple-800' },
      [TestCaseType.PERFORMANCE]: { label: '性能', className: 'bg-indigo-100 text-indigo-800' },
      [TestCaseType.SECURITY]: { label: '安全', className: 'bg-pink-100 text-pink-800' },
      [TestCaseType.REGRESSION]: { label: '回归', className: 'bg-teal-100 text-teal-800' },
      [TestCaseType.MANUAL]: { label: '手动', className: 'bg-gray-100 text-gray-800' },
      [TestCaseType.AUTOMATED]: { label: '自动化', className: 'bg-green-100 text-green-800' },
    };
    
    const config = typeConfig[type];
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  // 自定义渲染列
  const customColumns = useMemo(() => {
    return columns.map((column) => {
      if (column.id === 'status') {
        return {
          ...column,
          cell: ({ row }) => (
            <div className="flex items-center justify-center">
              <StatusBadge status={row.getValue('status')} />
            </div>
          ),
        };
      }
      if (column.id === 'priority') {
        return {
          ...column,
          cell: ({ row }) => (
            <div className="flex items-center justify-center">
              <PriorityBadge priority={row.getValue('priority')} />
            </div>
          ),
        };
      }
      if (column.id === 'type') {
        return {
          ...column,
          cell: ({ row }) => (
            <div className="flex items-center justify-center">
              <TypeBadge type={row.getValue('type')} />
            </div>
          ),
        };
      }
      return column;
    });
  }, [columns]);

  return (
    <div className="flex flex-col h-full">
      {/* 搜索和筛选栏 */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="搜索测试用例..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
          <Filter className="text-gray-400 h-4 w-4" />
        </div>
        
        {/* 列显示控制 */}
        <div className="flex items-center space-x-2">
          {table.getAllLeafColumns().map((column) => (
            <button
              key={column.id}
              onClick={() => column.toggleVisibility()}
              className={`p-2 rounded ${
                column.getIsVisible() ? 'bg-gray-100' : 'bg-gray-50'
              }`}
            >
              {column.columnDef.header}
            </button>
          ))}
        </div>
      </div>

      {/* 表格容器 */}
      <div ref={containerRef} className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div
            style={{ height }}
            className="relative overflow-auto"
          >
            <Virtual
              size={virtualRows.length}
              parentRef={containerRef}
              estimateSize={() => rowHeight}
              overscan={5}
            >
              {({ virtualItems, totalSize }) => (
                <>
                  <div
                    style={{
                      height: `${totalSize}px`,
                      width: '100%',
                      position: 'relative',
                    }}
                  >
                    {virtualItems.map((virtualRow) => {
                      const row = virtualRows[virtualRow.index];
                      if (!row) return null;
                      
                      return (
                        <div
                          key={virtualRow.index}
                          data-index={virtualRow.index}
                          ref={row.getRef()}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: `${rowHeight}px`,
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                          className={`border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                            virtualRow.index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                          onClick={() => onRowClick?.(row.original)}
                        >
                          <div className="flex h-full">
                            {customColumns.map((column) => (
                              <div
                                key={column.id}
                                style={{
                                  width: column.getSize(),
                                  minWidth: column.getSize(),
                                }}
                                className="flex items-center px-4"
                              >
                                {flexRender(
                                  column.columnDef.cell,
                                  {
                                    row,
                                    getValue: () => row.getValue(column.id),
                                    table,
                                  }
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </Virtual>
          </div>
        )}
      </div>

      {/* 分页控件 */}
      {pagination && (
        <div className="flex items-center justify-between p-4 border-t">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              显示 {(pagination.page - 1) * pagination.size + 1} -{' '}
              {Math.min(pagination.page * pagination.size, totalCount)} 条，共 {totalCount} 条
            </span>
            <select
              value={pagination.size}
              onChange={(e) => pagination.onSizeChange(Number(e.target.value))}
              className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} 条/页
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
            >
              上一页
            </button>
            <span className="text-sm text-gray-600">
              第 {pagination.page} 页，共 {Math.ceil(totalCount / pagination.size)} 页
            </span>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page * pagination.size >= totalCount}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualizedTable;