# 测试用例列表页面设计文档

**版本**: 1.0  
**修改履历**: 任务 1.3.3  
**日期**: 2026-02-03  
**作者**: AI Assistant

## 1. 概述

测试用例列表页面是测试管理模块的核心界面，需要高效展示大量测试用例数据（支持 10,000+ 用例），并提供完整的搜索、筛选、排序和批量操作功能。页面采用虚拟化表格技术确保性能，同时提供丰富的交互功能。

## 2. 设计原则

### 2.1 性能优先
- 使用虚拟滚动技术，只渲染可见行
- 实现数据分页和增量加载
- 优化渲染性能，避免不必要的重渲染

### 2.2 用户体验
- 响应式设计，适配不同屏幕尺寸
- 直观的搜索和筛选界面
- 流畅的交互动画和反馈

### 2.3 功能完整
- 支持所有 CRUD 操作入口
- 提供高级搜索和筛选功能
- 支持批量操作

### 2.4 可维护性
- 组件化设计，便于复用和扩展
- TypeScript 类型安全
- 遵循项目现有架构模式

## 3. 页面架构

### 3.1 组件层次结构

```
TestCasesPage (页面容器)
├── PageHeader (页面头部)
│   ├── Title (页面标题)
│   ├── Breadcrumb (面包屑导航)
│   └── Actions (操作按钮)
├── FilterPanel (筛选面板)
│   ├── SearchInput (搜索输入框)
│   ├── StatusFilter (状态筛选)
│   ├── PriorityFilter (优先级筛选)
│   ├── TypeFilter (类型筛选)
│   ├── DateRangeFilter (日期范围筛选)
│   └── ClearFilters (清除筛选)
├── VirtualizedTable (虚拟化表格)
│   ├── TableHeader (表头)
│   ├── VirtualBody (虚拟化主体)
│   │   ├── TableRow (表格行)
│   │   └── TableCell (表格单元格)
│   └── TableFooter (表尾)
│       ├── Pagination (分页)
│       └── PageSizeSelector (页面大小选择)
└── ActionPanel (操作面板)
    ├── BulkActions (批量操作)
    └── CreateButton (创建按钮)
```

### 3.2 数据流架构

```
用户操作 → FilterPanel → React Query → API → 后端
    ↓
数据返回 → React Query → VirtualizedTable → 渲染
    ↓
用户交互 → 事件处理 → 状态更新 → UI刷新
```

## 4. 核心组件设计

### 4.1 VirtualizedTable 组件

**职责**: 实现高性能的虚拟化表格展示

**Props**:
```typescript
interface VirtualizedTableProps {
  projectId: number;
  columns: ColumnDef<TestCaseResponse>[];
  height?: number;
  rowHeight?: number;
  onRowClick?: (row: TestCaseResponse) => void;
  onRowSelection?: (selectedRows: TestCaseResponse[]) => void;
  selectedRows?: TestCaseResponse[];
  loading?: boolean;
  error?: string;
}
```

**核心功能**:
- 虚拟滚动渲染
- 支持行选择
- 支持排序
- 支持分页
- 加载状态处理
- 错误状态处理

### 4.2 FilterPanel 组件

**职责**: 提供搜索和筛选功能

**Props**:
```typescript
interface FilterPanelProps {
  onFiltersChange: (filters: TestCaseSearchQuery) => void;
  currentFilters: TestCaseSearchQuery;
}
```

**功能**:
- 全文搜索
- 状态筛选（下拉选择）
- 优先级筛选（下拉选择）
- 类型筛选（下拉选择）
- 标签筛选（多选）
- 日期范围筛选
- 清除所有筛选

### 4.3 TableHeader 组件

**职责**: 表头展示和排序控制

**Props**:
```typescript
interface TableHeaderProps {
  columns: ColumnDef<TestCaseResponse>[];
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  onSelectAll: (isSelected: boolean) => void;
  isAllSelected: boolean;
  isSomeSelected: boolean;
}
```

**功能**:
- 列标题展示
- 排序控制
- 全选功能
- 列宽调整（可选）

## 5. 数据模型

### 5.1 测试用例响应类型

```typescript
export interface TestCaseResponse {
  id: number;
  project_id: number;
  title: string;
  description?: string;
  status: TestCaseStatus;
  priority: TestCasePriority;
  type: TestCaseType;
  preconditions?: string;
  steps: string[];
  expected_results: string[];
  estimated_duration?: number;
  tags: string[];
  created_by: number;
  created_at: string;
  updated_at: string;
  updated_by?: number;
}

export interface TestCaseListResponse {
  test_cases: TestCaseResponse[];
  total: number;
  page: number;
  size: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface TestCaseSearchQuery {
  page: number;
  size: number;
  title?: string;
  status?: TestCaseStatus;
  priority?: TestCasePriority;
  type?: TestCaseType;
  tags?: string[];
  created_by?: number;
  created_after?: string;
  created_before?: string;
}

export enum TestCaseStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  BLOCKED = 'blocked',
  DEPRECATED = 'deprecated',
}

export enum TestCasePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum TestCaseType {
  FUNCTIONAL = 'functional',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  REGRESSION = 'regression',
  MANUAL = 'manual',
  AUTOMATED = 'automated',
}
```

### 5.2 列定义

```typescript
const columns: ColumnDef<TestCaseResponse>[] = [
  {
    id: 'selection',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllRowsSelected()}
        indeterminate={table.getIsSomeRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
    enableSorting: false,
    enableColumnFilter: false,
  },
  {
    accessorKey: 'id',
    header: 'ID',
    enableSorting: true,
    enableColumnFilter: false,
    size: 80,
  },
  {
    accessorKey: 'title',
    header: 'Title',
    enableSorting: true,
    enableColumnFilter: true,
    cell: ({ row }) => (
      <div className="flex items-center space-x-2">
        <div className="font-medium">{row.getValue('title')}</div>
        {row.original.tags && row.original.tags.length > 0 && (
          <div className="flex space-x-1">
            {row.original.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary">{tag}</Badge>
            ))}
            {row.original.tags.length > 3 && (
              <Badge variant="outline">+{row.original.tags.length - 3}</Badge>
            )}
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    enableSorting: true,
    enableColumnFilter: true,
    cell: ({ row }) => (
      <Badge variant={
        row.original.status === 'active' ? 'default' :
        row.original.status === 'blocked' ? 'destructive' :
        row.original.status === 'deprecated' ? 'secondary' : 'outline'
      }>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
    enableSorting: true,
    enableColumnFilter: true,
    cell: ({ row }) => (
      <Badge variant={
        row.original.priority === 'critical' ? 'destructive' :
        row.original.priority === 'high' ? 'default' :
        row.original.priority === 'medium' ? 'secondary' : 'outline'
      }>
        {row.original.priority}
      </Badge>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Type',
    enableSorting: true,
    enableColumnFilter: true,
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.type}</Badge>
    ),
  },
  {
    accessorKey: 'estimated_duration',
    header: 'Duration',
    enableSorting: true,
    enableColumnFilter: false,
    cell: ({ row }) => (
      row.original.estimated_duration ? 
        `${row.original.estimated_duration}m` : 
        '-'
    ),
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    enableSorting: true,
    enableColumnFilter: false,
    cell: ({ row }) => (
      <div className="text-sm text-gray-500">
        {formatDate(row.original.created_at)}
      </div>
    ),
  },
  {
    id: 'actions',
    header: 'Actions',
    enableSorting: false,
    enableColumnFilter: false,
    cell: ({ row }) => (
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm">
          Edit
        </Button>
        <Button variant="ghost" size="sm">
          Delete
        </Button>
      </div>
    ),
  },
];
```

## 6. API 集成

### 6.1 测试用例服务

```typescript
// frontend/src/services/testCaseService.ts
import { apiClient } from './auth';

export interface TestCaseSearchQuery {
  page: number;
  size: number;
  title?: string;
  status?: string;
  priority?: string;
  type?: string;
  tags?: string[];
  created_by?: number;
  created_after?: string;
  created_before?: string;
}

export interface TestCaseListResponse {
  test_cases: TestCaseResponse[];
  total: number;
  page: number;
  size: number;
  has_next: boolean;
  has_prev: boolean;
}

export const getTestCases = async (
  projectId: number,
  query: TestCaseSearchQuery
): Promise<TestCaseListResponse> => {
  const params = new URLSearchParams();
  
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });

  const response = await apiClient.get(`/projects/${projectId}/testcases`, {
    params,
  });
  
  return response.data;
};
```

### 6.2 React Query 集成

```typescript
// frontend/src/hooks/useTestCases.ts
import { useQuery } from '@tanstack/react-query';
import { getTestCases } from '../services/testCaseService';
import { TestCaseSearchQuery } from '../types/testCase';

export const useTestCases = (
  projectId: number,
  query: TestCaseSearchQuery
) => {
  return useQuery({
    queryKey: ['test-cases', projectId, query],
    queryFn: () => getTestCases(projectId, query),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5分钟
  });
};
```

## 7. 状态管理

### 7.1 本地状态

```typescript
// 筛选状态
const [filters, setFilters] = useState<TestCaseSearchQuery>({
  page: 1,
  size: 20,
});

// 排序状态
const [sorting, setSorting] = useState<SortingState>([]);

// 选择状态
const [selectedRows, setSelectedRows] = useState<TestCaseResponse[]>([]);

// 加载状态
const [isLoading, setIsLoading] = useState(false);
```

### 7.2 状态更新逻辑

```typescript
const handleFiltersChange = (newFilters: Partial<TestCaseSearchQuery>) => {
  setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
};

const handlePageChange = (page: number) => {
  setFilters(prev => ({ ...prev, page }));
};

const handlePageSizeChange = (size: number) => {
  setFilters(prev => ({ ...prev, size, page: 1 }));
};

const handleSortingChange = (newSorting: SortingState) => {
  setSorting(newSorting);
};

const handleRowSelection = (row: TestCaseResponse, isSelected: boolean) => {
  const newSelectedRows = isSelected
    ? [...selectedRows, row]
    : selectedRows.filter(r => r.id !== row.id);
  setSelectedRows(newSelectedRows);
};
```

## 8. 交互设计

### 8.1 搜索和筛选

- **搜索框**: 实时搜索，支持防抖
- **状态筛选**: 下拉选择，支持多选
- **优先级筛选**: 下拉选择，支持多选
- **类型筛选**: 下拉选择，支持多选
- **标签筛选**: 多选标签
- **日期范围**: 日期选择器
- **清除筛选**: 一键清除所有筛选条件

### 8.2 表格交互

- **行选择**: 单选、多选、全选
- **行点击**: 点击行可进入详情页
- **排序**: 点击表头进行排序
- **分页**: 页码导航和页面大小选择
- **批量操作**: 基于选择行的批量操作

### 8.3 响应式设计

- **桌面端**: 完整功能展示
- **平板端**: 适配中等屏幕
- **移动端**: 简化版本，支持触摸操作

## 9. 性能优化

### 9.1 虚拟滚动优化

- 使用 `react-window` 实现高效虚拟滚动
- 设置合适的行高和缓冲区大小
- 使用 `memo` 优化行组件渲染

### 9.2 数据获取优化

- 使用 React Query 缓存机制
- 实现分页和增量加载
- 添加防抖处理搜索请求

### 9.3 渲染优化

- 使用 `React.memo` 避免不必要的重渲染
- 使用 `useMemo` 和 `useCallback` 优化计算
- 实现虚拟滚动，只渲染可见行

## 10. 测试策略

### 10.1 单元测试

- 组件渲染测试
- 事件处理测试
- 状态管理测试
- 数据转换测试

### 10.2 集成测试

- API 集成测试
- React Query 集成测试
- 组件交互测试

### 10.3 E2E 测试

- 完整用户流程测试
- 性能测试
- 响应式测试

## 11. 国际化支持

### 11.1 文本资源

```json
{
  "testCases": {
    "title": "Test Cases",
    "search": "Search test cases...",
    "createNew": "Create New Test Case",
    "id": "ID",
    "title": "Title",
    "status": "Status",
    "priority": "Priority",
    "type": "Type",
    "duration": "Duration",
    "created": "Created",
    "actions": "Actions",
    "selectAll": "Select all",
    "selectedCount": "selected",
    "clearFilters": "Clear filters",
    "noResults": "No test cases found",
    "loading": "Loading test cases...",
    "error": "Failed to load test cases"
  }
}
```

### 11.2 多语言支持

- 英语（en）
- 中文（zh）
- 日语（ja）

## 12. 部署和发布

### 12.1 构建配置

- 使用 Vite 进行构建
- 代码分割和懒加载
- 资源优化

### 12.2 环境配置

- 开发环境
- 测试环境
- 生产环境

## 13. 监控和分析

### 13.1 性能监控

- 页面加载时间
- 渲染性能
- API 响应时间

### 13.2 用户行为分析

- 搜索使用情况
- 筛选使用频率
- 功能使用统计

---

**设计文档完成**: 测试用例列表页面已设计完成，包含了完整的技术实现方案和交互设计。