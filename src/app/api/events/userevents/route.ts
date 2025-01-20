import { db } from '@/lib/db/db';
import { events, usersToEvents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';

export async function POST(req: NextRequest) {
  try {
    const authResponse = await withAuth(req, { requiredRoles: ['user'] }); 

    if (authResponse.ok === false) {
      return NextResponse.json(
        { error: 'Unauthorized request!' },
        { status: 401 }
      );
    }

    const userId = Number((await authResponse.json()).userId);
    
    const registeredEvents = await db
      .select({
        eventId: events.id,
      })
      .from(usersToEvents)
      .innerJoin(events, eq(usersToEvents.eventId, events.id))
      .where(eq(usersToEvents.userId, userId));

    return NextResponse.json(registeredEvents, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'An error occurred while fetching registered events' },
      { status: 500 }
    );
  }
}
