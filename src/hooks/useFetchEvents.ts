import { useCallback } from 'react';
import { clientApiFetch } from '@/lib/auth/apiFetch';

export const useFetchEvents = (accessToken: string | null) => {
  return useCallback(async (page: number, eventsPerPage: number, type: 'all' | 'my') => {
    console.log('useFetchEvents called with:', { page, eventsPerPage, type });
    
    if (!accessToken) {
      console.log('No access token provided to useFetchEvents');
      throw new Error('No access token available');
    }

    try {
      const response = await clientApiFetch('/api/events/get', accessToken, {
        body: JSON.stringify({
          startId: (page - 1) * eventsPerPage,
          viewMode: type,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      console.log('API response:', data);

      return {
        events: {
          standalone: data.events || [],
          groups: data.groups || []
        },
        totalPages: Math.ceil(data.totalCount / eventsPerPage)
      };
    } catch (error) {
      console.error('Error in useFetchEvents:', error);
      throw error;
    }
  }, [accessToken]);
};