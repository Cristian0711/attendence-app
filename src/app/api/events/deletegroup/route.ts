import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import { events, eventGroups, usersToEvents } from "@/lib/db/schema";
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
        const { groupId } = body;
        
        if (!groupId) {
            return NextResponse.json(
                { error: "Group ID is required" },
                { status: 400 }
            );
        }

        const groupToDelete = await db.select().from(eventGroups).where(eq(eventGroups.id, groupId));
        if (!groupToDelete.length || groupToDelete[0].userId !== Number(userId)) {
            return NextResponse.json(
                { error: "Unauthorized to delete this group" },
                { status: 403 }
            );
        }

        await db.transaction(async (tx) => {
            const eventsInGroup = await tx.select({ id: events.id })
                .from(events)
                .where(eq(events.eventGroupId, groupId));
        
            for (const event of eventsInGroup) {
                await tx.delete(usersToEvents)
                    .where(eq(usersToEvents.eventId, event.id));
            }

            await tx.delete(events)
                .where(eq(events.eventGroupId, groupId));
        
            await tx.delete(eventGroups)
                .where(eq(eventGroups.id, groupId));
        });

        return NextResponse.json({
            message: "Event group and all its events deleted successfully"
        }, { status: 200 });

    } catch (error) {
        console.error('Error deleting event group:', error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}