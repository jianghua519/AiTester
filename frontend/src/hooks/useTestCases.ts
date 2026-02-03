import { useQuery, useQueryClient, useMutation, useInfiniteQuery } from '@tanstack/react-query';
import { getTestCases, getTestCase, createTestCase, updateTestCase, deleteTestCase, getTestCaseStats, bulkUpdateTestCaseStatus } from '../services/testCase';
import { TestCaseSearchQuery, TestCaseResponse, TestCaseCreateRequest, TestCaseUpdateRequest } from '../types/testCase';

// 测试用例列表查询
export const useTestCases = (
  projectId: number,
  query: TestCaseSearchQuery,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['test-cases', projectId, query],
    queryFn: () => getTestCases(projectId, query),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5分钟
    enabled,
  });
};

// 单个测试用例查询
export const useTestCase = (testCaseId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['test-case', testCaseId],
    queryFn: () => getTestCase(testCaseId),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
    enabled,
  });
};

// 测试用例统计查询
export const useTestCaseStats = (projectId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['test-case-stats', projectId],
    queryFn: () => getTestCaseStats(projectId),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
    enabled,
  });
};

// 创建测试用例
export const useCreateTestCase = (projectId: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: TestCaseCreateRequest) => createTestCase(projectId, data),
    onSuccess: () => {
      // 刷新测试用例列表
      queryClient.invalidateQueries(['test-cases']);
      queryClient.invalidateQueries(['test-case-stats']);
    },
  });
};

// 更新测试用例
export const useUpdateTestCase = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ testCaseId, data }: { testCaseId: number; data: TestCaseUpdateRequest }) => 
      updateTestCase(testCaseId, data),
    onSuccess: (data, variables) => {
      // 刷新相关的查询
      queryClient.invalidateQueries(['test-case', variables.testCaseId]);
      queryClient.invalidateQueries(['test-cases']);
      queryClient.invalidateQueries(['test-case-stats']);
    },
  });
};

// 删除测试用例
export const useDeleteTestCase = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteTestCase,
    onSuccess: () => {
      // 刷新测试用例列表
      queryClient.invalidateQueries(['test-cases']);
      queryClient.invalidateQueries(['test-case-stats']);
    },
  });
};

// 批量更新测试用例状态
export const useBulkUpdateTestCaseStatus = (projectId: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ testCaseIds, status }: { testCaseIds: number[]; status: string }) => 
      bulkUpdateTestCaseStatus(projectId, testCaseIds, status),
    onSuccess: () => {
      // 刷新测试用例列表
      queryClient.invalidateQueries(['test-cases']);
      queryClient.invalidateQueries(['test-case-stats']);
    },
  });
};