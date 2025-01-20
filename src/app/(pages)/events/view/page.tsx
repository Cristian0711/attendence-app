'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AllEvents from '@/components/events/AllEvents';
import MyEvents from '@/components/events/MyEvents';

export default function EventsView() {
  const [viewMode, setViewMode] = useState<'all' | 'my'>('all');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleViewModeChange = async (mode: 'all' | 'my') => {
    if (mode === viewMode) return;
    
    setIsTransitioning(true);
    await new Promise(resolve => setTimeout(resolve, 150));
    setViewMode(mode);
    await new Promise(resolve => setTimeout(resolve, 50));
    setIsTransitioning(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-center space-x-4 mb-8">
        <Button 
          variant={viewMode === 'all' ? 'default' : 'outline'}
          onClick={() => handleViewModeChange('all')}
          className="transition-all duration-300 hover:scale-105"
          disabled={isTransitioning}
        >
          All Events
        </Button>
        <Button 
          variant={viewMode === 'my' ? 'default' : 'outline'}
          onClick={() => handleViewModeChange('my')}
          className="transition-all duration-300 hover:scale-105"
          disabled={isTransitioning}
        >
          My Events
        </Button>
      </div>

      <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
        {viewMode === 'all' ? <AllEvents /> : <MyEvents />}
      </div>
    </div>
  );
}