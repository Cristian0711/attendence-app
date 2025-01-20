'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSession } from '@/providers/session/SessionProvider';
import { clientApiFetch } from '@/lib/auth/apiFetch';
import { toast } from 'sonner';
import { EventsDisplay } from './EventsDisplay';

export default function AllEvents() {
  const { accessToken } = useSession();
  const [accessCode, setAccessCode] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const eventsDisplayRef = useRef<{ refreshEvents: () => void } | null>(null);

  const handleJoinWithCode = async () => {
    if (!accessCode.trim()) return;

    try {
      const response = await clientApiFetch('/api/events/signwithcode', accessToken ?? "", {
        body: JSON.stringify({ accessCode }),
      });

      const result = await response.json();

      if (response.ok) {
        toast('Successfully joined the event');
        eventsDisplayRef.current?.refreshEvents();
        setIsDialogOpen(false);
        setAccessCode('');
      } else {
        toast(result.message || 'Failed to join event');
      }
    } catch (error) {
      toast('An error occurred while joining the event');
    }
  };

  const header = (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-semibold">All Events</h1>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="secondary">Join with Code</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Event with Code</DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Enter your access code"
              className="w-full p-2 border border-gray-300 rounded-md"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleJoinWithCode();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="default" onClick={handleJoinWithCode}>
              Join Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  const handleRefresh = () => {
    eventsDisplayRef.current?.refreshEvents();
  };

  return (
    <EventsDisplay 
      viewMode="all" 
      header={header} 
      ref={eventsDisplayRef}
      onEventDeleted={handleRefresh}
      onEventJoined={handleRefresh}
    />
  );
}