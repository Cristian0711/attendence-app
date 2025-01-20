import { NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import { users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { decodeRefreshToken } from "@/lib/jwt";
import { TokenStorage } from "@/lib/auth/token";

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        const refreshToken = authHeader?.replace("Bearer ", "");

        if (!refreshToken) {
            return NextResponse.json(
                { error: "Refresh token not found" },
                { status: 400 }
            );
        }

        const decoded = await decodeRefreshToken(refreshToken);

        if (!decoded) {
            return NextResponse.json(
                { error: "Invalid refresh token" },
                { status: 400 }
            );
        }

        await db
            .update(users)
            .set({
                updatedAt: sql`NOW()`,
                jwtid: null,
            })
            .where(eq(users.id, Number(decoded.sub)));
            
        return NextResponse.json(
            { message: "Logged out successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Sign-out error:", error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}
