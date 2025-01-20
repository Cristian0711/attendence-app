'use client';

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useSession } from '@/providers/session/SessionProvider';
import Pagination from './Pagination';
import Loader from '@/components/ui/loader';
import { Event, GroupedEvents } from '@/types/FrontEvent';
import { EventCard } from './EventCard';
import { EventGroupCard } from './EventGroupCard';
import { clientApiFetch } from '@/lib/auth/apiFetch';

interface EventsDisplayProps {
  viewMode: 'all' | 'my';
  header?: React.ReactNode;
  onEventDeleted?: () => void;
  onEventJoined?: () => void;
}

const ITEMS_PER_PAGE = 6;

export const EventsDisplay = forwardRef<{ refreshEvents: () => void }, EventsDisplayProps>(
  ({ viewMode, header, onEventDeleted, onEventJoined }, ref) => {
    const { accessToken, loading: sessionLoading } = useSession();
    const [standalonePage, setStandalonePage] = useState(1);
    const [groupsPage, setGroupsPage] = useState(1);
    const [events, setEvents] = useState<GroupedEvents>({ standalone: [], groups: [] });
    const [standalonePages, setStandalonePages] = useState(1);
    const [groupPages, setGroupPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const eventsContainerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      refreshEvents: loadEvents
    }));

    const loadEvents = async () => {
      if (!accessToken) return;
      
      setIsTransitioning(true);
      setError(null);

      try {
        const response = await clientApiFetch('/api/events/get', accessToken, {
          method: 'POST',
          body: JSON.stringify({
            standaloneOffset: (standalonePage - 1) * ITEMS_PER_PAGE,
            groupsOffset: (groupsPage - 1) * ITEMS_PER_PAGE,
            limit: ITEMS_PER_PAGE,
            viewMode,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }

        const data = await response.json();
        
        console.log(data);
        setEvents({
          standalone: data.standalone.events || [],
          groups: data.groups.items || []
        });
        setStandalonePages(Math.max(1, data.standalone.totalPages));
        setGroupPages(Math.max(1, data.groups.totalPages));
      } catch (error) {
        console.error('Error loading events:', error);
        setError('Failed to load events. Please try again later.');
      } finally {
        setIsTransitioning(false);
      }
    };

    useEffect(() => {
      if (sessionLoading || !accessToken) return;
      setIsLoading(true);
      loadEvents().finally(() => setIsLoading(false));
    }, [accessToken, sessionLoading]);

    useEffect(() => {
      if (!isLoading && accessToken) {
        loadEvents();
      }
    }, [standalonePage, groupsPage, viewMode]);

    const handleEventDelete = (eventId: number) => {
      setEvents(prevEvents => ({
        standalone: prevEvents.standalone.filter(event => event.id !== eventId),
        groups: prevEvents.groups.map(group => ({
          ...group,
          events: group.events.filter(event => event.id !== eventId)
        }))
      }));
      
      onEventDeleted?.();
      loadEvents();
    };

    const handleEventUpdate = (updatedEvent: Event) => {
      setEvents(prevEvents => ({
        ...prevEvents,
        standalone: prevEvents.standalone.map(event =>
          event.id === updatedEvent.id ? updatedEvent : event
        ),
        groups: prevEvents.groups.map(group => ({
          ...group,
          events: group.events.map(event =>
            event.id === updatedEvent.id ? updatedEvent : event
          )
        }))
      }));
      onEventJoined?.();
    };

    const handleGroupDelete = async (groupId: number) => {
      setEvents(prevEvents => ({
        ...prevEvents,
        groups: prevEvents.groups.filter(group => group.id !== groupId)
      }));
      await loadEvents();
    };

    if (sessionLoading || isLoading) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          <Loader />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-red-500">{error}</p>
        </div>
      );
    }

    return (
      <div className="container mx-auto px-4 py-8">
        {header}
        <div 
          ref={eventsContainerRef} 
          className="space-y-8 transition-all duration-300 ease-in-out transform"
        >
          {/* Standalone Events Section */}
          {events.standalone.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Individual Events</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.standalone.map(event => (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    onEventUpdate={handleEventUpdate}
                    onEventDelete={handleEventDelete}
                  />
                ))}
              </div>
              <div className="mt-4">
                <Pagination
                  page={standalonePage}
                  totalPages={standalonePages}
                  onPageChange={setStandalonePage}
                  disabled={isTransitioning}
                />
              </div>
            </div>
          )}

          {/* Event Groups Section */}
          {events.groups.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Event Groups</h2>
              <div className="space-y-6">
                {events.groups.map(group => (
                  <EventGroupCard 
                    key={group.id} 
                    group={group}
                    onEventUpdate={handleEventUpdate}
                    onEventDelete={handleEventDelete}
                    onGroupDelete={handleGroupDelete}
                  />
                ))}
              </div>
              <div className="mt-4">
                <Pagination
                  page={groupsPage}
                  totalPages={groupPages}
                  onPageChange={setGroupsPage}
                  disabled={isTransitioning}
                />
              </div>
            </div>
          )}

          {events.standalone.length === 0 && events.groups.length === 0 && (
            <p className="text-center text-gray-500">No events found.</p>
          )}
        </div>
      </div>
    );
  }
);