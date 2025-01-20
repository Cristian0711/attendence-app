import { verifyAccessToken } from '@/lib/jwt';
import { db } from '@/lib/db/db';
import { events, usersToEvents } from '@/lib/db/schema'; 
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';

export async function POST(req: NextRequest) {
  try {
    const { accessCode } = await req.json(); 

    const authResponse = await withAuth(req, { requiredRoles: ['user'] });

    if (authResponse.ok === false) {
      return NextResponse.json(
        { error: "Unauthorized request!" },
        { status: 400 }
      );
    }

    const userId = Number((await authResponse.json()).userId);

    const event = await db.query.events.findFirst({
        where: eq(events.accessCode, accessCode)
    });

    if (!event) {
      return NextResponse.json({ message: 'Invalid access code!' }, { status: 400 });
    }

    if (event.userId === userId) {
        return NextResponse.json({ message: 'This is your own event!' }, { status: 400 });
      }

    const currentTime = new Date();
    const { startTime, endTime } = event;

    if (currentTime < new Date(startTime) || currentTime > new Date(endTime)) {
      return NextResponse.json({ message: 'Event is not active at the moment' }, { status: 400 });
    }

    const existingRegistration = await db
      .select()
      .from(usersToEvents)
      .where(and(
        eq(usersToEvents.userId, Number(userId)),
        eq(usersToEvents.eventId, event.id)
      ))
      .limit(1)
      .execute();

    if (existingRegistration.length > 0) {
      return NextResponse.json({ message: 'User is already registered for this event!' }, { status: 400 });
    }

    await db.insert(usersToEvents).values({
      userId: Number(userId),
      eventId: event.id,
    });

    return NextResponse.json({ message: 'User successfully registered for the event!', eventId: event.id }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'An error occurred while registering for the event' }, { status: 500 });
  }
}
