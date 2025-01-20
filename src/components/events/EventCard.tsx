'use client';

import { Card, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { clientApiFetch } from '@/lib/auth/apiFetch';
import { useSession } from '@/providers/session/SessionProvider';
import { toast } from 'sonner';
import { Event } from '@/types/FrontEvent';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { EventDetailsModal } from './EventsDetailsModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EventCardProps {
  event: Event;
  onEventUpdate: (updatedEvent: Event) => void;
  onEventDelete?: (eventId: number) => void;
}

export function EventCard({ event, onEventUpdate, onEventDelete }: EventCardProps) {
  const { accessToken, user } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner = event.userId === Number(user?.id);

  const getEventStatus = () => {
    const now = new Date();
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);

    if (endTime < now) {
      return <span className="text-red-500">Past Event</span>;
    } else if (startTime <= now && now <= endTime) {
      return <span className="text-green-500">Open</span>;
    } else {
      return <span className="text-blue-500">In the future</span>;
    }
  };

  const handleRegister = async () => {
    if (!accessToken) {
      toast('You must be logged in to register for this event');
      return;
    }

    setIsLoading(true);
    try {
      const response = await clientApiFetch('/api/events/signuser', accessToken, {
        body: JSON.stringify({ eventId: event.id }),
      });

      const data = await response.json();
      if (response.ok) {
        toast('Successfully registered for the event');
        await new Promise(resolve => setTimeout(resolve, 150));
        onEventUpdate({ ...event, isRegistered: true });
      } else {
        toast(data.message || 'Failed to register');
      }
    } catch (error) {
      toast('An error occurred while registering');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnregister = async () => {
    if (!accessToken) {
      toast('You must be logged in to unregister from this event');
      return;
    }

    setIsLoading(true);
    try {
      const response = await clientApiFetch('/api/events/unsignuser', accessToken, {
        body: JSON.stringify({ eventId: event.id }),
      });

      const data = await response.json();
      if (response.ok) {
        toast('Successfully unregistered from the event');
        await new Promise(resolve => setTimeout(resolve, 150));
        onEventUpdate({ ...event, isRegistered: false });
      } else {
        toast(data.message || 'Failed to unregister');
      }
    } catch (error) {
      toast('An error occurred while unregistering');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!accessToken) return;
    
    try {
      const response = await clientApiFetch('/api/events/delete', accessToken, {
        method: 'POST',
        body: JSON.stringify({ eventId: event.id })
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      toast.success('Event deleted successfully');
      onEventDelete?.(event.id);
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <Card className="w-full h-full flex flex-col transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 relative">
        {isOwner && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isLoading}
            className="absolute top-2 right-2 hover:bg-red-100 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}

        <CardTitle className="text-center p-4 line-clamp-1">
          {event.name}
        </CardTitle>

        <CardContent className="p-4 flex-grow">
          <p className="line-clamp-3 mb-2">{event.description}</p>
          <p className="text-sm">
            <strong>Start:</strong> {new Date(event.startTime).toLocaleString()}
          </p>
          <p className="text-sm">
            <strong>End:</strong> {new Date(event.endTime).toLocaleString()}
          </p>
          <p className="text-sm mt-2">
            <strong>Status:</strong> {getEventStatus()}
          </p>
        </CardContent>

        <CardFooter className="p-4">
          {isOwner ? (
            <Button
              variant="default"
              className="w-full"
              onClick={() => setIsDetailsOpen(true)}
              disabled={isLoading}
            >
              View Details
            </Button>
          ) : !event.isRegistered ? (
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleRegister}
              disabled={isLoading}
            >
              Register
            </Button>
          ) : (
            <Button
              variant="default"
              className="w-full"
              onClick={handleUnregister}
              disabled={isLoading}
            >
              Unregister
            </Button>
          )}
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isDetailsOpen && (
        <EventDetailsModal 
          event={event} 
          onClose={() => setIsDetailsOpen(false)} 
        />
      )}
    </>
  );
}