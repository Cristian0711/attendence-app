import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import * as schema from "@/lib/db/schema";
import { withAuth } from "@/lib/middleware";
import { count, eq, and, isNull, inArray, gt, asc } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const authResponse = await withAuth(req, { requiredRoles: ['user'] });
    if (authResponse.ok === false) {
      return NextResponse.json(
        { error: "Unauthorized request!" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { standaloneOffset = 0, groupsOffset = 0, limit = 6, viewMode } = body;
    const userId = Number((await authResponse.json()).userId);

    if (viewMode === 'my') {
      const standaloneEvents = await db.query.events.findMany({
        where: and(
          eq(schema.events.userId, userId),
          isNull(schema.events.eventGroupId)
        ),
        orderBy: [asc(schema.events.startTime)],
        limit,
        offset: standaloneOffset,
      });

      const eventGroups = await db.query.eventGroups.findMany({
        where: eq(schema.eventGroups.userId, userId),
        orderBy: [asc(schema.eventGroups.id)],
        limit,
        offset: groupsOffset,
        with: {
          events: {
            orderBy: [asc(schema.events.startTime)]
          }
        }
      });

      const totalStandaloneCount = await db
        .select({ count: count() })
        .from(schema.events)
        .where(and(
          eq(schema.events.userId, userId),
          isNull(schema.events.eventGroupId)
        ));

      const totalGroupsCount = await db
        .select({ count: count() })
        .from(schema.eventGroups)
        .where(eq(schema.eventGroups.userId, userId));

      return NextResponse.json({
        standalone: {
          events: standaloneEvents,
          totalCount: totalStandaloneCount[0].count,
          totalPages: Math.ceil(totalStandaloneCount[0].count / limit)
        },
        groups: {
          items: eventGroups,
          totalCount: totalGroupsCount[0].count,
          totalPages: Math.ceil(totalGroupsCount[0].count / limit)
        }
      });
    }
    else if (viewMode === 'all') {
      const now = new Date();

      const standaloneEvents = await db.query.events.findMany({
        where: and(
          isNull(schema.events.eventGroupId),
          gt(schema.events.endTime, now)
        ),
        orderBy: [asc(schema.events.startTime)],
        limit,
        offset: standaloneOffset,
      });

      const eventGroups = await db.query.eventGroups.findMany({
        orderBy: [asc(schema.eventGroups.id)],
        limit,
        offset: groupsOffset,
        with: {
          events: {
            where: gt(schema.events.endTime, now),
            orderBy: [asc(schema.events.startTime)]
          }
        }
      });

      const registeredEventIds = await db
        .select({ eventId: schema.usersToEvents.eventId })
        .from(schema.usersToEvents)
        .where(eq(schema.usersToEvents.userId, userId));

      const standaloneEventsWithRegistration = standaloneEvents.map(event => ({
        ...event,
        isRegistered: registeredEventIds.some(reg => reg.eventId === event.id)
      }));

      const eventGroupsWithRegistration = eventGroups.map(group => ({
        ...group,
        events: group.events.map(event => ({
          ...event,
          isRegistered: registeredEventIds.some(reg => reg.eventId === event.id)
        }))
      }));

      const totalStandaloneCount = await db
        .select({ count: count() })
        .from(schema.events)
        .where(and(
          isNull(schema.events.eventGroupId),
          gt(schema.events.startTime, now)
        ));

      const totalGroupsCount = await db
        .select({ count: count() })
        .from(schema.eventGroups);

      return NextResponse.json({
        standalone: {
          events: standaloneEventsWithRegistration,
          totalCount: totalStandaloneCount[0].count,
          totalPages: Math.ceil(totalStandaloneCount[0].count / limit)
        },
        groups: {
          items: eventGroupsWithRegistration,
          totalCount: totalGroupsCount[0].count,
          totalPages: Math.ceil(totalGroupsCount[0].count / limit)
        }
      });
    }

    return NextResponse.json(
      { error: "Invalid view mode!" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}