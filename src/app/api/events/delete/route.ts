import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import { events, usersToEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/middleware";

export async function POST(req: NextRequest) {
    try {
        const authResponse = await withAuth(req, { requiredRoles: ['admin', 'moderator'] });
        if (authResponse.ok === false) {
            return NextResponse.json(
                { error: "Unauthorized request!" },
                { status: 401 }
            );
        }

        const { userId } = await authResponse.json();
        const body = await req.json();
        const { eventId } = body;
        
        if (!eventId) {
            return NextResponse.json(
                { error: "Event ID is required" },
                { status: 400 }
            );
        }

        const eventToDelete = await db.select().from(events).where(eq(events.id, eventId));
        if (!eventToDelete.length || eventToDelete[0].userId !== Number(userId)) {
            return NextResponse.json(
                { error: "Unauthorized to delete this event" },
                { status: 403 }
            );
        }

        await db.transaction(async (tx) => {
            await tx.delete(usersToEvents)
                .where(eq(usersToEvents.eventId, eventId));
        
            await tx.delete(events)
                .where(eq(events.id, eventId));
        });

        return NextResponse.json({
            message: "Event deleted successfully"
        }, { status: 200 });

    } catch (error) {
        console.error('Error deleting event:', error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}