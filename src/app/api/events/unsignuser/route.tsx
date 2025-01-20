import { db } from "@/lib/db/db";
import { events, usersToEvents } from "@/lib/db/schema";
import { withAuth } from "@/lib/middleware";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
      const { eventId } = await req.json(); 
  
      const authResponse = await withAuth(req, { requiredRoles: ['user'] });
      
      if (authResponse.ok === false) {
        return NextResponse.json(
          { error: "Unauthorized request!" },
          { status: 400 }
        );
      }
  
      const userId = Number((await authResponse.json()).userId);

      const event = await db.query.events.findFirst({
        where: eq(events.id, eventId),
      });
  
      if (!event) {
        return NextResponse.json({ message: 'Event not found!' }, { status: 404 });
      }
  
      const now = new Date();
      if (event.endTime < now) {
        return NextResponse.json({ message: 'Event already finished!' }, { status: 404 });
      }

      const existingRegistration = await db
        .select()
        .from(usersToEvents)
        .where(and(
          eq(usersToEvents.userId, userId),
          eq(usersToEvents.eventId, eventId)
        ))
        .limit(1)
        .execute();
  
      if (existingRegistration.length === 0) {
        return NextResponse.json({ message: 'User is not registered for this event!' }, { status: 400 });
      }

      await db.delete(usersToEvents)
        .where(and(
          eq(usersToEvents.userId, userId),
          eq(usersToEvents.eventId, eventId)
        ))
        .execute();
  
      return NextResponse.json({ message: 'User successfully unregistered from the event' }, { status: 200 });
    } catch (error) {
      console.error(error);
      return NextResponse.json({ message: 'An error occurred while unregistering from the event' }, { status: 500 });
    }
  }