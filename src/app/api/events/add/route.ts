import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import { events, eventGroups, insertEventSchema, insertEventGroupSchema } from "@/lib/db/schema";
import { z } from "zod";
import { withAuth } from "@/lib/middleware";

const generateEventCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
};

const generateRecurringDates = (
    startTime: Date,
    endTime: Date,
    pattern: string,
    interval: number,
    endDate: Date
): { start: Date; end: Date }[] => {
    const dates: { start: Date; end: Date }[] = [];
    const duration = endTime.getTime() - startTime.getTime();
    let currentStart = new Date(startTime);

    while (currentStart <= endDate) {
        const currentEnd = new Date(currentStart.getTime() + duration);
        dates.push({ start: currentStart, end: currentEnd });

        const nextStart = new Date(currentStart);
        switch (pattern) {
            case 'DAILY':
                nextStart.setDate(nextStart.getDate() + interval);
                break;
            case 'WEEKLY':
                nextStart.setDate(nextStart.getDate() + (interval * 7));
                break;
            case 'MONTHLY':
                nextStart.setMonth(nextStart.getMonth() + interval);
                break;
        }
        currentStart = nextStart;
    }

    return dates;
};

export async function POST(req: NextRequest) {
    try {
        const authResponse = await withAuth(req, { requiredRoles: ['admin', 'moderator'] });
        if (authResponse.ok === false) {
            return NextResponse.json(
                { error: "Unauthorized request!" },
                { status: 400 }
            );
        }

        const body = await req.json();
        const userId = Number((await authResponse.json()).userId);

        const result = await db.transaction(async (tx) => {
            let eventGroupId = body.eventGroupId;

            if (body.eventType === 'new_group') {
                const newGroup = await tx.insert(eventGroups).values({
                    userId,
                    name: body.groupName,
                    description: body.description,
                    isRecurring: body.isRecurring,
                    ...(body.isRecurring && {
                        recurrencePattern: body.recurrence.recurrencePattern,
                        recurrenceInterval: body.recurrence.recurrenceInterval,
                        recurrenceEndDate: new Date(body.recurrence.recurrenceEndDate)
                    })
                }).returning({ id: eventGroups.id });

                eventGroupId = newGroup[0].id;
            }

            const baseEventData = {
                userId,
                eventGroupId,
                name: body.name,
                description: body.description,
            };

            if (body.isRecurring) {
                const dates = generateRecurringDates(
                    new Date(body.startTime),
                    new Date(body.endTime),
                    body.recurrence.recurrencePattern,
                    body.recurrence.recurrenceInterval,
                    new Date(body.recurrence.recurrenceEndDate)
                );

                const recurringEvents = await Promise.all(
                    dates.map(async (date) => {
                        const uniqueEventCode = generateEventCode();
                        
                        return tx.insert(events).values({
                            ...baseEventData,
                            startTime: date.start,
                            endTime: date.end,
                            accessCode: uniqueEventCode,
                        }).returning();
                    })
                );

                return { events: recurringEvents.flat(), eventGroupId };
            } else {
                const eventCode = generateEventCode();
                const newEvent = await tx.insert(events).values({
                    ...baseEventData,
                    startTime: new Date(body.startTime),
                    endTime: new Date(body.endTime),
                    accessCode: eventCode,
                }).returning();

                return { events: newEvent, eventGroupId };
            }
        });

        return NextResponse.json({
            message: "Event(s) created successfully",
            events: result.events,
            eventGroupId: result.eventGroupId
        }, { status: 201 });

    } catch (error) {
        console.error('Event creation error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid input", details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}