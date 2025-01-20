'use client';

import { useState, useRef } from 'react';
import { Card, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSession } from '@/providers/session/SessionProvider';
import { Event } from '@/types/FrontEvent';
import { Clock } from 'lucide-react';
import { EventCard } from './EventCard';

interface RecurringEventCardProps {
  events: Event[];
  onEventUpdate: (updatedEvent: Event) => void;
  onEventDelete?: (eventId: number) => void;
}

export function RecurringEventCard({ events, onEventUpdate, onEventDelete }: RecurringEventCardProps) {
  const { user } = useSession();
  const [showDetails, setShowDetails] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const mainEvent = events[0];
  const isOwner = mainEvent.userId === Number(user?.id);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setShowDetails(true);
    }, 200);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShowDetails(false);
  };

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {/* Main Card */}
      <Card className="w-full h-full flex flex-col transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 relative">
        <div className="absolute top-2 right-2">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-blue-100 hover:text-blue-600"
          >
            <Clock className="h-4 w-4" />
          </Button>
        </div>

        <CardTitle className="text-center p-4 line-clamp-1">
          {mainEvent.name}
        </CardTitle>

        <CardContent className="p-4 flex-grow">
          <p className="line-clamp-3 mb-2">{mainEvent.description}</p>
          <p className="text-sm text-blue-600 font-medium">
            Recurring Event ({events.length} occurrences)
          </p>
        </CardContent>

        <CardFooter className="p-4">
          <Button
            variant="default"
            className="w-full"
            onClick={() => setShowDetails(true)}
          >
            View Series
          </Button>
        </CardFooter>
      </Card>

      {/* Overlay with all events */}
      {showDetails && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-sm"
          onClick={() => setShowDetails(false)}
        >
          <div 
            className="relative min-h-screen w-full py-8 px-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="container mx-auto">
              <div className="bg-white rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold">{mainEvent.name} Series</h2>
                  <Button
                    variant="ghost"
                    onClick={() => setShowDetails(false)}
                  >
                    Close
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {events.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onEventUpdate={onEventUpdate}
                      onEventDelete={onEventDelete}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}