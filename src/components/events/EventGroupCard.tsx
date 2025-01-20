'use client';

import { EventGroup, Event } from '@/types/FrontEvent';
import { ChevronDown, Trash2 } from 'lucide-react';
import { EventCard } from './EventCard';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { clientApiFetch } from '@/lib/auth/apiFetch';
import { useSession } from '@/providers/session/SessionProvider';
import { toast } from 'sonner';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

interface EventGroupCardProps {
  group: EventGroup;
  onEventUpdate: (updatedEvent: Event) => void;
  onEventDelete?: (eventId: number) => void;
  onGroupDelete?: (groupId: number) => void;
}

export function EventGroupCard({ 
  group, 
  onEventUpdate,
  onEventDelete,
  onGroupDelete 
}: EventGroupCardProps) {
  const { accessToken, user } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!accessToken) return;
    setIsDeleting(true);
    
    try {
      const response = await clientApiFetch('/api/events/deletegroup', accessToken, {
        method: 'POST',
        body: JSON.stringify({ groupId: group.id })
      });

      if (!response.ok) {
        throw new Error('Failed to delete event group');
      }

      toast.success('Event group deleted successfully');
      onGroupDelete?.(group.id);
    } catch (error) {
      console.error('Error deleting event group:', error);
      toast.error('Failed to delete event group');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const isOwner = group.userId === Number(user?.id);

  return (
    <>
      <div className="border rounded-lg p-4">
        <div className="flex justify-between items-center">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex-1 flex justify-between items-center p-2 hover:bg-gray-50/50 rounded-md"
          >
            <span className="text-lg font-medium">{group.name}</span>
            <ChevronDown 
              className={`${
                isOpen ? 'transform rotate-180' : ''
              } transition-transform duration-200`}
            />
          </button>
          {isOwner && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="ml-2 hover:bg-red-100 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {isOpen && (
          <div className="mt-4">
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
                  onEventDelete={onEventDelete}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Event Group"
        description="Are you sure you want to delete this event group? All events in this group will also be deleted. This action cannot be undone."
      />
    </>
  );
}