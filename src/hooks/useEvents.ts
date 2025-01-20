import { useState, useEffect } from 'react';
import { GroupedEvents } from '@/types/FrontEvent';
import { useFetchEvents } from '@/hooks/useFetchEvents';

export function useEvents(accessToken: string | null, page: number, perPage: number, type: 'all' | 'my') {
  console.log('useEvents hook called with:', { accessToken, page, perPage, type });

  const [events, setEvents] = useState<GroupedEvents>({ standalone: [], groups: [] });
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const fetchEvents = useFetchEvents(accessToken);
  console.log('fetchEvents created:', !!fetchEvents);

  useEffect(() => {
    console.log('useEffect triggered');
    let isMounted = true;

    const loadEvents = async () => {
      if (!accessToken) {
        console.log('No access token, skipping fetch'); 
        return;
      }

      console.log('Starting fetch process...');
      setIsTransitioning(true);
      setError(null);

      try {
        console.log('Calling fetchEvents...');
        const data = await fetchEvents(page, perPage, type);
        console.log('Data received:', data); 

        if (isMounted) {
          setEvents(data.events);
          setTotalPages(data.totalPages);
          setIsLoading(false);
          console.log('State updated successfully'); 
        }
      } catch (err) {
        console.error('Error in loadEvents:', err); 
        if (isMounted) {
          setError('Failed to load events. Please try again later.');
          setIsLoading(false);
        }
      } finally {
        if (isMounted) {
          setIsTransitioning(false);
        }
      }
    };

    loadEvents();

    return () => {
      console.log('Cleanup function called'); 
      isMounted = false;
    };
  }, [accessToken, page, perPage, type, fetchEvents]);

  console.log('Current state:', { events, isLoading, error });

  return {
    events,
    totalPages,
    isLoading,
    error,
    isTransitioning
  };
}