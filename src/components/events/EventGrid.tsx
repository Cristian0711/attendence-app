'use client';

import { Card } from '@/components/ui/card';
import { Event, EventGroup } from '@/types/FrontEvent';
import { EventCard } from './EventCard';
import { Disclosure } from '@headlessui/react';
import { ChevronDown } from 'lucide-react';
import Loader from '@/components/ui/loader';

interface EventGridProps {
  events: {
    standalone: Event[];
    groups: EventGroup[];
  };
  isLoading: boolean;
  onEventUpdate: (updatedEvent: Event) => void;
}

export default function EventGrid({ events, isLoading, onEventUpdate }: EventGridProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader />
      </div>
    );
  }

  const hasNoEvents = events.standalone.length === 0 && events.groups.length === 0;

  if (hasNoEvents) {
    return (
      <div className="text-center py-8 text-gray-500">
        No events found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Standalone Events */}
      {events.standalone.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Individual Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.standalone.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEventUpdate={onEventUpdate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Event Groups */}
      {events.groups.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Event Groups</h2>
          <div className="space-y-4">
            {events.groups.map((group) => (
              <Card key={group.id} className="overflow-hidden">
                <Disclosure as="div" defaultOpen>
                  {({ open }) => (
                    <div className="border rounded-lg">
                      <Disclosure.Button className="flex justify-between w-full p-4 hover:bg-gray-50">
                        <span className="text-lg font-medium">{group.name}</span>
                        <ChevronDown 
                          className={`transform transition-transform duration-200 ${
                            open ? 'rotate-180' : ''
                          }`} 
                        />
                      </Disclosure.Button>

                      <Disclosure.Panel as="div" className="p-4 pt-0">
                        <p className="text-gray-600 mb-4">{group.description}</p>
                        {group.isRecurring && (
                          <p className="text-sm text-gray-500 mb-4">
                            Recurring: Every {group.recurrenceInterval} {group.recurrencePattern?.toLowerCase()}
                          </p>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {group.events.map((event) => (
                            <EventCard
                              key={event.id}
                              event={event}
                              onEventUpdate={onEventUpdate}
                            />
                          ))}
                        </div>
                      </Disclosure.Panel>
                    </div>
                  )}
                </Disclosure>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}