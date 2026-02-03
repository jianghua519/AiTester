import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import VirtualizedTable from '../components/common/VirtualizedTable';
import { 
  TestCaseResponse, 
  TestCaseSearchQuery, 
  TestCaseStatus, 
  TestCasePriority, 
  TestCaseType,
  TableColumn 
} from '../types/testCase';
import { useTestCases } from '../hooks/useTestCases';
import { useCreateTestCase } from '../hooks/useCreateTestCase';
import { useBulkUpdateTestCaseStatus } from '../hooks/useBulkUpdateTestCaseStatus';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { TestCaseDetailPage } from './TestCaseDetailPage';
import { Plus, Search, Filter, MoreVertical, Edit, Trash2, Play, Pause } from 'lucide-react';

const TestCasesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedTestCase, setSelectedTestCase] = useState<TestCaseResponse | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<TestCaseSearchQuery>({
    page: 1,
    size: 20,
  });
  const [selectedRows, setSelectedRows] = useState<TestCaseResponse[]>([]);
  const [isBulkActionModalOpen, setIsBulkActionModalOpen] = useState(false);

  // 获取URL参数中的projectId
  const queryParams = new URLSearchParams(location.search);
  const projectId = parseInt(queryParams.get('projectId') || '1', 10);

  // 获取测试用例列表
  const { 
    data: testCasesData, 
    isLoading, 
    error, 
    refetch 
  } = useTestCases(projectId, searchQuery);

  // 创建测试用例
  const createTestCase = useCreateTestCase(projectId);
  
  // 批量更新状态
  const bulkUpdateStatus = useBulkUpdateTestCaseStatus(projectId);

  // 处理行点击
  const handleRowClick = useCallback((testCase: TestCaseResponse) => {
    setSelectedTestCase(testCase);
    setIsDetailModalOpen(true);
  }, []);

  // 处理搜索
  const handleSearch = useCallback((newQuery: Partial<TestCaseSearchQuery>) => {
    setSearchQuery(prev => ({ ...prev, ...newQuery, page: 1 }));
  }, []);

  // 处理分页
  const handlePageChange = useCallback((page: number) => {
    setSearchQuery(prev => ({ ...prev, page }));
  }, []);

  // 处理每页大小变化
  const handleSizeChange = useCallback((size: number) => {
    setSearchQuery(prev => ({ ...prev, size, page: 1 }));
  }, []);

  // 处理行选择
  const handleRowSelect = useCallback((testCase: TestCaseResponse, selected: boolean) => {
    if (selected) {
      setSelectedRows(prev => [...prev, testCase]);
    } else {
      setSelectedRows(prev => prev.filter(row => row.id !== testCase.id));
    }
  }, []);

  // 处理全选
  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected && testCasesData?.test_cases) {
      setSelectedRows(testCasesData.test_cases);
    } else {
      setSelectedRows([]);
    }
  }, [testCasesData]);

  // 批量操作处理
  const handleBulkAction = useCallback((action: string) => {
    if (selectedRows.length === 0) return;

    switch (action) {
      case 'activate':
        bulkUpdateStatus.mutate({
          testCaseIds: selectedRows.map(row => row.id),
          status: TestCaseStatus.ACTIVE,
        });
        break;
      case 'block':
        bulkUpdateStatus.mutate({
          testCaseIds: selectedRows.map(row => row.id),
          status: TestCaseStatus.BLOCKED,
        });
        break;
      case 'delete':
        // TODO: 实现删除逻辑
        break;
      case 'execute':
        // TODO: 实现执行逻辑
        break;
    }
    
    setIsBulkActionModalOpen(false);
    setSelectedRows([]);
  }, [selectedRows, bulkUpdateStatus]);

  // 创建测试用例
  const handleCreateTestCase = useCallback((testCaseData: any) => {
    createTestCase.mutate(testCaseData, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        refetch();
      },
    });
  }, [createTestCase, refetch]);

  // 表格列定义
  const columns: TableColumn<TestCaseResponse>[] = [
    {
      id: 'select',
      header: '',
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectedRows.some(r => r.id === row.original.id)}
          onChange={(e) => handleRowSelect(row.original, e.target.checked)}
          className="rounded border-gray-300"
        />
      ),
      size: 50,
    },
    {
      id: 'title',
      header: '标题',
      accessorKey: 'title',
      enableSorting: true,
      enableColumnFilter: true,
      size: 300,
    },
    {
      id: 'status',
      header: '状态',
      accessorKey: 'status',
      enableSorting: true,
      enableColumnFilter: true,
      size: 100,
    },
    {
      id: 'priority',
      header: '优先级',
      accessorKey: 'priority',
      enableSorting: true,
      enableColumnFilter: true,
      size: 100,
    },
    {
      id: 'type',
      header: '类型',
      accessorKey: 'type',
      enableSorting: true,
      enableColumnFilter: true,
      size: 100,
    },
    {
      id: 'tags',
      header: '标签',
      accessorKey: 'tags',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.tags.map((tag, index) => (
            <Badge key={index} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      ),
      size: 150,
    },
    {
      id: 'created_at',
      header: '创建时间',
      accessorKey: 'created_at',
      enableSorting: true,
      size: 150,
      cell: ({ row }) => {
        const date = new Date(row.original.created_at);
        return date.toLocaleDateString('zh-CN');
      },
    },
    {
      id: 'actions',
      header: '操作',
      size: 100,
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleRowClick(row.original);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: 实现执行逻辑
            }}
          >
            <Play className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: 实现删除逻辑
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* 页面头部 */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">测试用例管理</h1>
          <p className="text-gray-600 mt-1">项目 ID: {projectId}</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {selectedRows.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                已选择 {selectedRows.length} 个测试用例
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBulkActionModalOpen(true)}
              >
                批量操作
              </Button>
            </div>
          )}
          
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>创建测试用例</span>
          </Button>
        </div>
      </div>

      {/* 搜索和筛选栏 */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索测试用例..."
              value={searchQuery.title || ''}
              onChange={(e) => handleSearch({ title: e.target.value })}
              className="w-64"
            />
          </div>
          
          <Select
            value={searchQuery.status || ''}
            onChange={(value) => handleSearch({ status: value as TestCaseStatus })}
            placeholder="状态"
            className="w-32"
          >
            <option value="">全部状态</option>
            <option value={TestCaseStatus.DRAFT}>草稿</option>
            <option value={TestCaseStatus.ACTIVE}>激活</option>
            <option value={TestCaseStatus.BLOCKED}>阻塞</option>
            <option value={TestCaseStatus.DEPRECATED}>废弃</option>
          </Select>
          
          <Select
            value={searchQuery.priority || ''}
            onChange={(value) => handleSearch({ priority: value as TestCasePriority })}
            placeholder="优先级"
            className="w-32"
          >
            <option value="">全部优先级</option>
            <option value={TestCasePriority.LOW}>低</option>
            <option value={TestCasePriority.MEDIUM}>中</option>
            <option value={TestCasePriority.HIGH}>高</option>
            <option value={TestCasePriority.CRITICAL}>紧急</option>
          </Select>
          
          <Select
            value={searchQuery.type || ''}
            onChange={(value) => handleSearch({ type: value as TestCaseType })}
            placeholder="类型"
            className="w-32"
          >
            <option value="">全部类型</option>
            <option value={TestCaseType.FUNCTIONAL}>功能</option>
            <option value={TestCaseType.PERFORMANCE}>性能</option>
            <option value={TestCaseType.SECURITY}>安全</option>
            <option value={TestCaseType.REGRESSION}>回归</option>
            <option value={TestCaseType.MANUAL}>手动</option>
            <option value={TestCaseType.AUTOMATED}>自动化</option>
          </Select>
        </div>
        
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          高级筛选
        </Button>
      </div>

      {/* 表格区域 */}
      <div className="flex-1 overflow-hidden">
        {error ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <p className="text-red-600 mb-4">加载失败: {error.message}</p>
              <Button onClick={refetch}>重试</Button>
            </div>
          </div>
        ) : (
          <VirtualizedTable
            data={testCasesData?.test_cases || []}
            columns={columns}
            height={600}
            rowHeight={42}
            onRowClick={handleRowClick}
            loading={isLoading}
            totalCount={testCasesData?.total || 0}
            pagination={{
              page: searchQuery.page,
              size: searchQuery.size,
              total: testCasesData?.total || 0,
              onPageChange: handlePageChange,
              onSizeChange: handleSizeChange,
            }}
          />
        )}
      </div>

      {/* 创建测试用例模态框 */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="创建测试用例"
        size="large"
      >
        <TestCaseDetailPage
          projectId={projectId}
          onSave={handleCreateTestCase}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* 测试用例详情模态框 */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="测试用例详情"
        size="large"
      >
        {selectedTestCase && (
          <TestCaseDetailPage
            projectId={projectId}
            testCase={selectedTestCase}
            onSave={(data) => {
              // TODO: 实现更新逻辑
              setIsDetailModalOpen(false);
            }}
            onCancel={() => setIsDetailModalOpen(false)}
          />
        )}
      </Modal>

      {/* 批量操作模态框 */}
      <Modal
        isOpen={isBulkActionModalOpen}
        onClose={() => setIsBulkActionModalOpen(false)}
        title="批量操作"
        size="medium"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            已选择 {selectedRows.length} 个测试用例，请选择要执行的操作：
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => handleBulkAction('activate')}
              disabled={bulkUpdateStatus.isPending}
            >
              激活
            </Button>
            <Button
              variant="outline"
              onClick={() => handleBulkAction('block')}
              disabled={bulkUpdateStatus.isPending}
            >
              阻塞
            </Button>
            <Button
              variant="outline"
              onClick={() => handleBulkAction('execute')}
            >
              执行
            </Button>
            <Button
              variant="outline"
              onClick={() => handleBulkAction('delete')}
            >
              删除
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TestCasesPage;