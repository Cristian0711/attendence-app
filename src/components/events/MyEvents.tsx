'use client';

import { EventsDisplay } from './EventsDisplay';

export default function MyEvents() {
    return (
      <EventsDisplay 
        viewMode="my"
        header={
          <h1 className="text-3xl font-semibold mb-8 text-center">
            My Events
          </h1>
        }
      />
    );
  }
  