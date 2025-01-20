import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import * as schema from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
    try {
      const authResponse = await withAuth(req, { requiredRoles: ['user'] });
  
      if (authResponse.ok === false) {
        return NextResponse.json(
          { error: 'Unauthorized request!' },
          { status: 400 }
        );
      }
  
      const body = await req.json();
      const { eventId } = body;
  
      if (!eventId || isNaN(eventId)) {
        return NextResponse.json(
          { error: 'Invalid or missing event ID!' },
          { status: 400 }
        );
      }
  
      const registeredUsers = await db
        .select({
          id: schema.users.id,
          email: schema.users.email,
          username: schema.users.username,
          createdAt: schema.usersToEvents.createdAt, 
        })
        .from(schema.usersToEvents)
        .innerJoin(schema.users, eq(schema.users.id, schema.usersToEvents.userId))
        .where(eq(schema.usersToEvents.eventId, eventId));
  
      return NextResponse.json(
        { users: registeredUsers },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error:', error);
      return NextResponse.json(
        { error: 'Something went wrong' },
        { status: 500 }
      );
    }
  }
  
