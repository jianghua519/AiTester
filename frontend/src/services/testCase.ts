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

export interface TestCaseResponse {
  id: number;
  project_id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  type: string;
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

export interface TestCaseCreateRequest {
  title: string;
  description?: string;
  status: string;
  priority: string;
  type: string;
  preconditions?: string;
  steps: string[];
  expected_results: string[];
  estimated_duration?: number;
  tags?: string[];
}

export interface TestCaseUpdateRequest {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  type?: string;
  preconditions?: string;
  steps?: string[];
  expected_results?: string[];
  estimated_duration?: number;
  tags?: string[];
}

export const getTestCases = async (
  projectId: number,
  query: TestCaseSearchQuery
): Promise<TestCaseListResponse> => {
  const params = new URLSearchParams();
  
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  const response = await apiClient.get(`/projects/${projectId}/testcases`, {
    params,
  });
  
  return response.data;
};

export const getTestCase = async (testCaseId: number): Promise<TestCaseResponse> => {
  const response = await apiClient.get(`/testcases/${testCaseId}`);
  return response.data;
};

export const createTestCase = async (
  projectId: number,
  data: TestCaseCreateRequest
): Promise<TestCaseResponse> => {
  const response = await apiClient.post(`/projects/${projectId}/testcases`, data);
  return response.data;
};

export const updateTestCase = async (
  testCaseId: number,
  data: TestCaseUpdateRequest
): Promise<TestCaseResponse> => {
  const response = await apiClient.put(`/testcases/${testCaseId}`, data);
  return response.data;
};

export const deleteTestCase = async (testCaseId: number): Promise<void> => {
  await apiClient.delete(`/testcases/${testCaseId}`);
};

export const getTestCaseStats = async (projectId: number): Promise<any> => {
  const response = await apiClient.get(`/projects/${projectId}/testcases/stats`);
  return response.data;
};

export const bulkUpdateTestCaseStatus = async (
  projectId: number,
  testCaseIds: number[],
  status: string
): Promise<any> => {
  const response = await apiClient.put(`/projects/${projectId}/testcases/bulk/status`, {
    test_case_ids: testCaseIds,
    status,
  });
  return response.data;
};