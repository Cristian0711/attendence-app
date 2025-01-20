export interface Event {
    id: number;
    userId: number;
    name: string;
    description: string | null;
    startTime: string;
    endTime: string;
    accessCode: string;
    isRegistered?: boolean;
    eventGroupId: number | null;
  }
  
  export interface EventGroup {
    id: number;
    userId: number;
    name: string;
    description: string | null;
    isRecurring: boolean;
    recurrencePattern?: string;
    recurrenceInterval?: number;
    recurrenceEndDate?: string;
    events: Event[];
  }
  
  export interface GroupedEvents {
    standalone: Event[];
    groups: EventGroup[];
  }