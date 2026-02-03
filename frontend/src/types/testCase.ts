/**
 * 测试用例相关类型定义
 */

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

export interface TestCaseCreateRequest {
  title: string;
  description?: string;
  status: TestCaseStatus;
  priority: TestCasePriority;
  type: TestCaseType;
  preconditions?: string;
  steps: string[];
  expected_results: string[];
  estimated_duration?: number;
  tags?: string[];
}

export interface TestCaseUpdateRequest {
  title?: string;
  description?: string;
  status?: TestCaseStatus;
  priority?: TestCasePriority;
  type?: TestCaseType;
  preconditions?: string;
  steps?: string[];
  expected_results?: string[];
  estimated_duration?: number;
  tags?: string[];
}

// 表格列定义类型
export interface TableColumn<T = any> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  enableSorting?: boolean;
  enableColumnFilter?: boolean;
  size?: number;
  className?: string;
}

// 排序状态
export interface SortingState {
  id: string;
  desc: boolean;
}

// 分页状态
export interface PaginationState {
  page: number;
  size: number;
  total: number;
}

// 选择状态
export interface SelectionState {
  selectedRows: TestCaseResponse[];
  isAllSelected: boolean;
  isSomeSelected: boolean;
}