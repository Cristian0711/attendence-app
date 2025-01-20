import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import { withAuth } from "@/lib/middleware";

export async function POST(req: NextRequest) {
  try {
    const authResponse = await withAuth(req, { requiredRoles: ['user'] });
    if (authResponse.ok === false) {
      return NextResponse.json(
        { error: "Unauthorized request!" },
        { status: 400 }
      );
    }

    const eventGroups = await db.query.eventGroups.findMany({
      columns: {
        id: true,
        name: true,
        description: true
      }
    });

    return NextResponse.json({
      eventGroups,
      message: "Event groups fetched successfully"
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching event groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch event groups" },
      { status: 500 }
    );
  }
}