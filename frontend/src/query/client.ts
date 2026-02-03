import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // 对于 401 错误不重试
        if (error instanceof Error && error.message.includes('401')) {
          return false
        }
        return failureCount < 3
      }
    }
  }
})