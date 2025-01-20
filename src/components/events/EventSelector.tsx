import React from 'react';
import { Button } from '@/components/ui/button';

interface EventSelectorProps {
  onSelect: (view: 'all' | 'my') => void;
}

const EventSelector: React.FC<EventSelectorProps> = ({ onSelect }) => {
  return (
    <div className="flex justify-center gap-4 mb-8">
      <Button onClick={() => onSelect('all')} variant="outline">
        All Events
      </Button>
      <Button onClick={() => onSelect('my')} variant="outline">
        My Events
      </Button>
    </div>
  );
};

export default EventSelector;