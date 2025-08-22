import { useCallback } from 'react';
import { measureAsync } from '../utils/performance';

// Hook to measure async operations
export const useAsyncPerformance = () => {
  const measureAsyncOperation = useCallback(async <T>(
    operationName: string,
    asyncOperation: () => Promise<T>
  ): Promise<T> => {
    return measureAsync(operationName, asyncOperation);
  }, []);

  return { measureAsync: measureAsyncOperation };
};


