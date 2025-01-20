import { useState, useEffect } from 'react';

interface PaginationState<T> {
  data: T[];
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: Error | null;
}

interface PaginationHookProps<T> {
  fetchFunction: () => Promise<{ events: T[]; totalPages: number }>;
  dependencyArray: any[];
  skipWhile?: boolean;
}

export function useEventsPagination<T>({
  fetchFunction,
  dependencyArray,
  skipWhile = false
}: PaginationHookProps<T>) {
  const [state, setState] = useState<PaginationState<T>>({
    data: [],
    page: 1,
    totalPages: 1,
    isLoading: false,
    error: null
  });

  useEffect(() => {
    if (skipWhile) return;

    let isMounted = true;

    const fetchData = async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const { events, totalPages } = await fetchFunction();
        
        if (isMounted) {
          setState(prev => ({
            ...prev,
            data: events,
            totalPages,
            isLoading: false
          }));
        }
      } catch (error) {
        if (isMounted) {
          setState(prev => ({
            ...prev,
            error: error as Error,
            isLoading: false
          }));
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [state.page, ...dependencyArray]); 

  const setPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= state.totalPages) {
      setState(prev => ({ ...prev, page: newPage }));
    }
  };

  return {
    data: state.data,
    page: state.page,
    totalPages: state.totalPages,
    isLoading: state.isLoading,
    error: state.error,
    setPage
  };
}